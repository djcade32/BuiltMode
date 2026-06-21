import { UserStats } from "@builtmode/shared/types/user";
import {
  DocumentData,
  FieldValue,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  calculateModeScore,
  getDayMarker,
  getLastFourWeekAggregates,
  getLastFourWeeksAdherenceRate,
  getWorkoutsWithinLast30Days,
} from "../firestore/workout.js";
import { db } from "../lib/firebaseAdmin.js";
import { UserDoc } from "../types/user.js";
import { UserWeekAggregate } from "../types/workout.js";
import { handleGetLocalDateKey } from "../utils/weekId.js";

type FinalizeWeekAggregatesResult =
  | {
      status: "finalized";
      uid: string;
      weekId: string;
    }
  | {
      status: "skipped";
      reason?: string;
    };

const PAGE_SIZE = 100;

export const finalizeExpiredWeeks = onSchedule(
  {
    schedule: "0 * * * *",
    timeZone: "America/New_York",
    region: "us-central1",
    retryCount: 3,
    memory: "256MiB",
  },
  async () => {
    const now = Timestamp.now();

    logger.info("finalizeExpiredWeeks started", {
      now: now.toDate().toISOString(),
    });

    let processedCount = 0;
    let finalizedCount = 0;
    let skippedCount = 0;

    let lastDoc: QueryDocumentSnapshot<DocumentData> | undefined;

    while (true) {
      let query = db
        .collection("userWeekAggregates")
        .where("finalizedAt", "==", null)
        .where("weekEndAt", "<=", now)
        .orderBy("weekEndAt", "asc")
        .orderBy("__name__", "asc")
        .limit(PAGE_SIZE);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        break;
      }

      for (const aggregateDoc of snapshot.docs) {
        processedCount += 1;

        const result = await finalizeWeekAggregate(aggregateDoc.ref.path, now);

        if (result.status === "finalized") {
          finalizedCount += 1;
        } else {
          skippedCount += 1;

          logger.info("Skipped week aggregate finalization", {
            path: aggregateDoc.ref.path,
            reason: result.reason,
          });
        }
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      if (snapshot.size < PAGE_SIZE) {
        break;
      }
    }

    logger.info("finalizeExpiredWeeks finished", {
      processedCount,
      finalizedCount,
      skippedCount,
    });
  },
);

async function finalizeWeekAggregate(
  aggregatePath: string,
  now: Timestamp,
): Promise<FinalizeWeekAggregatesResult> {
  const aggregateRef = db.doc(aggregatePath);

  return db.runTransaction(async (tx) => {
    const aggregateSnap = await tx.get(aggregateRef);

    if (!aggregateSnap.exists) {
      return {
        status: "skipped",
        reason: "aggregate_not_found",
      };
    }

    const weekAggregate = aggregateSnap.data() as UserWeekAggregate;

    if (weekAggregate.finalizedAt !== null) {
      return {
        status: "skipped",
        reason: "already_finalized",
      };
    }

    if (!weekAggregate.uid) {
      return {
        status: "skipped",
        reason: "missing_uid",
      };
    }

    if (!weekAggregate.weekId) {
      return {
        status: "skipped",
        reason: "missing_week_id",
      };
    }

    if (!weekAggregate.weekEndAt) {
      return {
        status: "skipped",
        reason: "missing_week_end_at",
      };
    }

    if (weekAggregate.weekEndAt.toMillis() > now.toMillis()) {
      return {
        status: "skipped",
        reason: "week_not_expired",
      };
    }

    const uid = weekAggregate.uid;
    const weekId = weekAggregate.weekId;

    const userRef = db.collection("users").doc(uid);
    const userStatsRef = db.collection("userStats").doc(uid);

    const freshUserSnap = await tx.get(userRef);

    if (!freshUserSnap.exists) {
      return {
        status: "skipped",
        reason: "user_not_found",
      };
    }

    const user = freshUserSnap.data() as UserDoc;

    if (user.officialWeekStatus !== "official") {
      return {
        status: "skipped",
        reason: "not_official",
      };
    }

    const freshUserStatsSnap = await tx.get(userStatsRef);

    if (!freshUserStatsSnap.exists) {
      return {
        status: "skipped",
        reason: "user_stats_not_found",
      };
    }

    const userStats = freshUserStatsSnap.data() as UserStats;

    const activeDaysThisWeek = weekAggregate.activeDaysThisWeek ?? 0;
    const weeklyTargetDays = weekAggregate.weeklyTargetDays ?? user.weeklyTargetDays;

    if (!weeklyTargetDays || weeklyTargetDays < 1) {
      return {
        status: "skipped",
        reason: "invalid_weekly_target_days",
      };
    }

    const targetMet =
      weekAggregate.metTargetThisWeek === true || activeDaysThisWeek >= weeklyTargetDays;

    /**
     * Week is not official yet.
     */
    if (!weekAggregate.isOfficialWeek) {
      tx.update(aggregateRef, {
        finalizedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        status: "finalized",
        uid,
        weekId,
      };
    }

    /**
     * Deload weeks preserve the streak.
     * No increment.
     * No reset.
     * Just mark the week as closed.
     */
    if (weekAggregate.isDeloadWeek) {
      tx.update(aggregateRef, {
        finalizedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        status: "finalized",
        uid,
        weekId,
      };
    }

    const localDateKey = handleGetLocalDateKey(now.toDate(), user.homeTimezone);
    const dayMarkerExists = (await getDayMarker(tx, uid, weekId, localDateKey)).exists;
    const numOfCompletedWorkoutsLast30Days = await getWorkoutsWithinLast30Days(
      tx,
      uid,
      localDateKey,
    );
    const completedWorkoutsLast30Days = dayMarkerExists
      ? numOfCompletedWorkoutsLast30Days
      : numOfCompletedWorkoutsLast30Days + 1;

    const last4WeekAggregates = await getLastFourWeekAggregates(tx, uid, weekId);
    const lastFourWeeksAdherenceRate = getLastFourWeeksAdherenceRate(last4WeekAggregates);

    /**
     * Target met.
     *
     * Option B:
     * completeWorkout should usually have already credited the streak
     * when the user first hit their weekly target.
     *
     * This cron only credits as a fallback if streakCreditedAt is still null.
     */
    if (targetMet) {
      if (weekAggregate.streakCreditedAt === null) {
        const currentWeekStreak = userStats.currentWeekStreak ?? 0;
        const bestWeekStreak = userStats.bestWeekStreak ?? 0;

        const newCurrentWeekStreak = currentWeekStreak + 1;
        const newBestWeekStreak = Math.max(bestWeekStreak, newCurrentWeekStreak);

        const calculatedStats = calculateModeScore({
          weeklyTarget: weeklyTargetDays,
          completedWorkoutsLast30Days,
          weeklyAdherenceStreak: newCurrentWeekStreak,
          completedWorkoutsThisWeek: activeDaysThisWeek,
        });

        tx.update(aggregateRef, {
          metTargetThisWeek: true,
          targetMetAt: weekAggregate.targetMetAt ?? now,
          streakCreditedAt: FieldValue.serverTimestamp(),
          finalizedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          streakWeeks: newCurrentWeekStreak,
          modeScore: calculatedStats.modeScore,
          streakStatus: "active",
        });

        tx.update(userStatsRef, {
          currentWeekStreak: newCurrentWeekStreak,
          bestWeekStreak: newBestWeekStreak,
          modeScore: calculatedStats.modeScore,
          activity30DayRate: calculatedStats.activity30DayScore,
          last30DayWeeklyAdherenceRate: lastFourWeeksAdherenceRate,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        /**
         * Streak was already credited by completeWorkout.
         * Do not increment again.
         */
        tx.update(aggregateRef, {
          metTargetThisWeek: true,
          finalizedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          streakStatus: "active",
        });
      }

      return {
        status: "finalized",
        uid,
        weekId,
      };
    }

    /**
     * Target missed.
     *
     * This is the main reason this cron exists.
     * Missed weeks happen through inactivity, so completeWorkout may never fire.
     */

    const calculatedStats = calculateModeScore({
      weeklyTarget: weeklyTargetDays,
      completedWorkoutsLast30Days,
      weeklyAdherenceStreak: userStats.currentWeekStreak ?? 0,
      completedWorkoutsThisWeek: activeDaysThisWeek,
    });

    tx.update(aggregateRef, {
      metTargetThisWeek: false,
      modeScore: calculatedStats.modeScore,
      finalizedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      streakWeeks: userStats.currentWeekStreak ?? 0,
      streakStatus: "reset",
    });

    tx.update(userStatsRef, {
      currentWeekStreak: 0,
      modeScore: calculatedStats.modeScore,
      activity30DayRate: calculatedStats.activity30DayScore,
      last30DayWeeklyAdherenceRate: lastFourWeeksAdherenceRate,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      status: "finalized",
      uid,
      weekId,
    };
  });
}
