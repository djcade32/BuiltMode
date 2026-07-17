import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/scheduler";
import { UserDoc } from "src/types/user.js";
import { handleGetWeekWindow } from "src/utils/weekId.js";

type ChangeUsersWeeklyTargetDaysResult =
  | {
      status: "updated";
      uid: string;
    }
  | {
      status: "skipped";
      reason?: string;
    };

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

const PAGE_SIZE = 100;

export const changeUsersWeeklyTargetDays = onSchedule(
  {
    schedule: "0 * * * *",
    timeZone: "America/New_York",
    region: "us-central1",
    retryCount: 3,
    memory: "256MiB",
  },
  async () => {
    const now = Timestamp.now();

    logger.info("changeUsersWeeklyTargetDays started", {
      now: now.toDate().toISOString(),
    });

    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    let lastDoc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData> | undefined;

    while (true) {
      let query = db
        .collection("users")
        .where("pendingWeeklyTargetDays", "!=", null)
        .where("pendingWeeklyTargetStartsAt", "<=", now)
        .orderBy("pendingWeeklyTargetStartsAt", "asc")
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

        const result = await handleChangeWeeklyTargetDays(userDoc.ref.path, now);

        if (result.status === "updated") {
          updatedCount += 1;
        } else {
          skippedCount += 1;
        }
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      if (snapshot.size < PAGE_SIZE) {
        break;
      }
    }

    logger.info("changeUsersWeeklyTargetDays finished", {
      processedCount,
      updatedCount,
      skippedCount,
    });
  },
);

async function handleChangeWeeklyTargetDays(
  userPath: string,
  now: Timestamp,
): Promise<ChangeUsersWeeklyTargetDaysResult> {
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

    if (!user.pendingWeeklyTargetDays) {
      return {
        status: "skipped",
        reason: "missing_pending_weekly_target_days",
      };
    }

    if (!user.pendingWeeklyTargetStartsAt) {
      return {
        status: "skipped",
        reason: "missing_pending_weekly_target_starts_at",
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

    const weekWindow = handleGetWeekWindow(now.toDate(), user.homeTimezone);
    const userWeekAggregateRef = db.doc(`userWeekAggregates/${uid}_${weekWindow.weekId}`);

    const userWeekAggregateSnap = await tx.get(userWeekAggregateRef);

    tx.update(userRef, {
      weeklyTargetDays: user.pendingWeeklyTargetDays,
      pendingWeeklyTargetDays: null,
      pendingWeeklyTargetStartsAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.update(userStatsRef, {
      weeklyTargetDays: user.pendingWeeklyTargetDays,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (userWeekAggregateSnap.exists) {
      tx.update(userWeekAggregateRef, {
        weeklyTargetDays: user.pendingWeeklyTargetDays,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return {
      status: "updated",
      uid,
    };
  });
}
