import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { sendPushNotificationToUser } from "../services/notificationService.js";
import { handleGetWeekWindow } from "../utils/weekId.js";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

type OfficialWeekStatus = "practice" | "official";

type BuiltModeUser = {
  uid?: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
  weeklyTargetDays?: number;
  homeTimezone?: string;
  officialWeekStatus?: OfficialWeekStatus;
  officialStartWeekId?: string;
  officialStartAt?: Timestamp;
};

type ActivateOfficialWeekResult =
  | {
      status: "activated";
      uid: string;
      weekId: string;
    }
  | {
      status: "skipped";
      reason?: string;
    };

const PAGE_SIZE = 100;

export const activateOfficialWeeks = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "America/New_York",
    region: "us-central1",
    retryCount: 3,
    memory: "256MiB",
  },
  async () => {
    const now = Timestamp.now();

    logger.info("activateOfficialWeeks started", {
      now: now.toDate().toISOString(),
    });

    let processedCount = 0;
    let activatedCount = 0;
    let skippedCount = 0;

    while (true) {
      const snapshot = await db
        .collection("users")
        .where("officialWeekStatus", "==", "practice")
        .where("officialStartAt", "<=", now)
        .orderBy("officialStartAt", "asc")
        .limit(PAGE_SIZE)
        .get();

      if (snapshot.empty) {
        break;
      }

      for (const userDoc of snapshot.docs) {
        processedCount += 1;

        const result = await activateUserOfficialWeek(userDoc.ref.path, now);

        if (result.status === "activated") {
          activatedCount += 1;

          await sendPushNotificationToUser({
            recipientUid: result.uid,
            title: "Your official week has started",
            body: "Your BuiltMode standard is live. Time to build.",
            type: "official_week_started",
            data: {
              targetUid: result.uid,
              weekId: result.weekId,
              screen: "home",
            },
          });
        } else {
          skippedCount += 1;

          logger.info("Skipped official week activation", {
            userPath: userDoc.ref.path,
            reason: result.reason,
          });
        }
      }

      /**
       * No startAfter pagination needed because activated users are removed
       * from this query by changing officialWeekStatus from "practice" to "official".
       *
       * Invalid records are also marked with officialWeekActivationError so they
       * can be inspected instead of silently failing forever.
       */
    }

    logger.info("activateOfficialWeeks finished", {
      processedCount,
      activatedCount,
      skippedCount,
    });
  },
);

async function activateUserOfficialWeek(
  userPath: string,
  now: Timestamp,
): Promise<ActivateOfficialWeekResult> {
  const userRef = db.doc(userPath);

  return db.runTransaction(async (tx) => {
    const freshUserSnap = await tx.get(userRef);

    if (!freshUserSnap.exists) {
      return {
        status: "skipped",
        reason: "user_not_found",
      };
    }

    const user = freshUserSnap.data() as BuiltModeUser;
    const uid = freshUserSnap.id;

    if (user.officialWeekStatus !== "practice") {
      return {
        status: "skipped",
        reason: "not_in_practice",
      };
    }

    if (!user.officialStartAt || !user.officialStartWeekId) {
      tx.update(userRef, {
        officialWeekActivationError: {
          reason: "missing_official_start_fields",
          checkedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        status: "skipped",
        reason: "missing_official_start_fields",
      };
    }

    if (!user.homeTimezone) {
      tx.update(userRef, {
        officialWeekActivationError: {
          reason: "missing_home_timezone",
          checkedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        status: "skipped",
        reason: "missing_home_timezone",
      };
    }

    if (user.officialStartAt.toMillis() > now.toMillis()) {
      return {
        status: "skipped",
        reason: "official_start_in_future",
      };
    }

    const weekId = user.officialStartWeekId;
    const weeklyTargetDays = user.weeklyTargetDays ?? 4;

    const userWeekAggregateRef = db.doc(`userWeekAggregates/${uid}_${weekId}`);
    const leaderboardEntryRef = db.doc(`leaderboardEntries/${uid}`);

    const aggregateSnap = await tx.get(userWeekAggregateRef);

    if (!aggregateSnap.exists) {
      /**
       * Use officialStartAt instead of new Date().
       *
       * If this cron runs late, new Date() could point to a later week.
       * The first official aggregate should match officialStartWeekId.
       */
      const weekWindow = handleGetWeekWindow(user.officialStartAt.toDate(), user.homeTimezone);

      tx.create(userWeekAggregateRef, {
        uid,
        weekId,
        isOfficialWeek: true,
        weeklyTargetDays,

        modeScore: 0,
        activeDaysThisWeek: 0,
        totalWorkouts: 0,
        workoutCountByDate: {},

        metTargetThisWeek: false,
        targetMetAt: null,

        streakWeeks: 0,
        streakStatus: "inactive",

        isDeloadWeek: false,

        createdBy: "activateOfficialWeeks",
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
      officialWeekStatus: "official",
      officialStartedAt: FieldValue.serverTimestamp(),
      currentWeekId: weekId,
      lastEnsuredWeekId: weekId,
      updatedAt: FieldValue.serverTimestamp(),
      officialWeekActivationError: FieldValue.delete(),
    });

    /**
     * This is the important leaderboard change.
     *
     * During practice week:
     *   isRanked: false
     *
     * Once official:
     *   isRanked: true
     *
     * set(..., { merge: true }) keeps any existing leaderboard fields intact.
     */
    tx.set(
      leaderboardEntryRef,
      {
        uid,
        displayName: user.displayName ?? null,
        usernameLower: user.username?.toLocaleLowerCase() ?? null,
        avatarUrl: user.avatarUrl ?? null,

        isRanked: true,
        weekId,

        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      status: "activated",
      uid,
      weekId,
    };
  });
}
