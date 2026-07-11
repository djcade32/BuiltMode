import { UserStats } from "@builtmode/shared/types/user";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../lib/firebaseAdmin.js";
import { UserDoc } from "../types/user.js";
import { handleGetWeekWindow } from "../utils/weekId.js";

type CurrentWeekAggregatesResult =
  | {
      status: "created";
      uid: string;
      weekId: string;
    }
  | {
      status: "skipped";
      reason?: string;
    };

const PAGE_SIZE = 100;

export const ensureCurrentWeekAggregates = onSchedule(
  {
    schedule: "0 * * * *",
    timeZone: "America/New_York",
    region: "us-central1",
    retryCount: 3,
    memory: "256MiB",
  },
  async () => {
    const now = Timestamp.now();

    logger.info("ensureCurrentWeekAggregates started", {
      now: now.toDate().toISOString(),
    });

    let processedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;

    let lastDoc:
      | FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
      | undefined;

    while (true) {
      let query = db
        .collection("users")
        .where("officialWeekStatus", "==", "official")
        .orderBy("officialStartAt", "asc")
        .orderBy("__name__", "asc")
        .limit(PAGE_SIZE);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        break;
      }

      for (const userDoc of snapshot.docs) {
        processedCount += 1;

        const result = await createCurrentWeekAggregate(userDoc.ref.path, now);

        if (result.status === "created") {
          createdCount += 1;
        } else {
          skippedCount += 1;
        }
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      if (snapshot.size < PAGE_SIZE) {
        break;
      }
    }

    logger.info("ensureCurrentWeekAggregates finished", {
      processedCount,
      createdCount,
      skippedCount,
    });
  },
);

async function createCurrentWeekAggregate(
  userPath: string,
  now: Timestamp,
): Promise<CurrentWeekAggregatesResult> {
  const userRef = db.doc(userPath);

  return db.runTransaction(async (tx) => {
    const freshUserSnap = await tx.get(userRef);

    if (!freshUserSnap.exists) {
      return {
        status: "skipped",
        reason: "user_not_found",
      };
    }

    const user = freshUserSnap.data() as UserDoc;
    const uid = freshUserSnap.id;

    if (user.officialWeekStatus !== "official") {
      return {
        status: "skipped",
        reason: "not_official",
      };
    }

    if (!user.homeTimezone) {
      return {
        status: "skipped",
        reason: "missing_home_timezone",
      };
    }

    const weekWindow = handleGetWeekWindow(now.toDate(), user.homeTimezone);

    /**
     * If the user doc says this week has already been ensured,
     * we can skip without reading userStats or aggregate.
     */
    if (user.lastEnsuredWeekId === weekWindow.weekId) {
      return {
        status: "skipped",
        reason: "already_ensured",
      };
    }

    const userStatsRef = db.collection("userStats").doc(uid);
    const freshUserStatsSnap = await tx.get(userStatsRef);

    if (!freshUserStatsSnap.exists) {
      return {
        status: "skipped",
        reason: "user_stats_not_found",
      };
    }

    const userStats = freshUserStatsSnap.data() as UserStats;

    const userWeekAggregateRef = db.doc(`userWeekAggregates/${uid}_${weekWindow.weekId}`);

    const userWeekAggregateSnap = await tx.get(userWeekAggregateRef);

    /**
     * The aggregate may already exist if completeWorkout created it defensively.
     * In that case, do not create again. Just update lastEnsuredWeekId.
     */
    if (!userWeekAggregateSnap.exists) {
      tx.create(userWeekAggregateRef, {
        uid,
        weekId: weekWindow.weekId,

        isOfficialWeek: true,
        weeklyTargetDays: user.weeklyTargetDays,

        modeScore: userStats.modeScore ?? 0,

        activeDaysThisWeek: 0,
        totalWorkouts: 0,
        workoutCountByDate: {},

        metTargetThisWeek: false,
        targetMetAt: null,

        streakWeeks: userStats.currentWeekStreak ?? 0,
        streakStatus: "inactive",

        isDeloadWeek: false,

        createdBy: "ensureCurrentWeekAggregates",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),

        streakCreditedAt: null,
        finalizedAt: null,

        weekStartAt: weekWindow.weekStartAt,
        weekEndAt: weekWindow.weekEndAt,

        scoreVersion: 1,
      });
    }

    tx.update(userRef, {
      currentWeekId: weekWindow.weekId,
      lastEnsuredWeekId: weekWindow.weekId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      status: "created",
      uid,
      weekId: weekWindow.weekId,
    };
  });
}
