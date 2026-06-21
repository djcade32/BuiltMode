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
              weekId: result.weekId,
              screen: "home",
            },
          });
        } else {
          skippedCount += 1;
        }
      }

      /**
       * We do not need startAfter pagination here because every activated user
       * is removed from the query set by changing officialWeekStatus.
       *
       * If a user is skipped because of bad/missing data, they could remain in
       * the query set forever. That is why activateUserOfficialWeek marks invalid
       * records with an error flag instead of leaving them untouched.
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
      return { status: "skipped" };
    }

    const user = freshUserSnap.data() as BuiltModeUser;
    const uid = freshUserSnap.id;

    if (user.officialWeekStatus !== "practice") {
      return { status: "skipped" };
    }

    if (!user.officialStartAt || !user.officialStartWeekId) {
      tx.update(userRef, {
        officialWeekActivationError: {
          reason: "missing_official_start_fields",
          checkedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { status: "skipped" };
    }

    if (user.officialStartAt.toMillis() > now.toMillis()) {
      return { status: "skipped" };
    }

    const weekId = user.officialStartWeekId;
    const weeklyTargetDays = user.weeklyTargetDays ?? 4;

    const userWeekAggregateRef = db.doc(`userWeekAggregates/${uid}_${weekId}`);

    const aggregateSnap = await tx.get(userWeekAggregateRef);

    if (!aggregateSnap.exists) {
      const weekWindow = handleGetWeekWindow(new Date(), user?.homeTimezone || "");
      tx.create(userWeekAggregateRef, {
        uid,
        weekId,
        isOfficialWeek: true,
        weeklyTargetDays,

        modeScore: 0,
        activeDaysThisWeek: 0,
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
      updatedAt: FieldValue.serverTimestamp(),
      officialWeekActivationError: FieldValue.delete(),
      lastEnsuredWeekId: weekId,
    });

    return {
      status: "activated",
      uid,
      weekId,
    };
  });
}
