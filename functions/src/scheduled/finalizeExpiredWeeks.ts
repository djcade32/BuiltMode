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
    const leaderboardEntryRef = db.collection("leaderboardEntries").doc(uid);

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

    if (!user.homeTimezone) {
      return {
        status: "skipped",
        reason: "missing_home_timezone",
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

    const localDateKey = handleGetLocalDateKey(now.toDate(), user.homeTimezone);

    /**
     * Since this cron is not completing a new workout,
     * do not add +1 here. Just read the current 30-day count.
     */
    const completedWorkoutsLast30Days = await getWorkoutsWithinLast30Days(tx, uid, localDateKey);

    const last4WeekAggregates = await getLastFourWeekAggregates(tx, uid, weekId);
    const lastFourWeeksAdherenceRate = getLastFourWeeksAdherenceRate(last4WeekAggregates);

    /**
     * Deload weeks preserve the streak.
     * No increment.
     * No reset.
     * Just mark the week as closed and keep leaderboard state aligned.
     */
    if (weekAggregate.isDeloadWeek) {
      const currentWeekStreak = userStats.currentWeekStreak ?? 0;
      const bestWeekStreak = userStats.bestWeekStreak ?? 0;
      const currentModeScore = userStats.modeScore ?? weekAggregate.modeScore ?? 0;

      tx.update(aggregateRef, {
        finalizedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.set(
        leaderboardEntryRef,
        getLeaderboardEntryUpdate({
          uid,
          modeScore: currentModeScore,
          streakWeeks: currentWeekStreak,
          weekId: user.currentWeekId ?? weekId,
        }),
        { merge: true },
      );

      return {
        status: "finalized",
        uid,
        weekId,
      };
    }

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

        tx.set(
          leaderboardEntryRef,
          getLeaderboardEntryUpdate({
            uid,
            modeScore: calculatedStats.modeScore,
            streakWeeks: newCurrentWeekStreak,
            weekId: user.currentWeekId ?? weekId,
          }),
          { merge: true },
        );
      } else {
        /**
         * Streak was already credited by completeWorkout.
         * Do not increment again, but still recalculate Mode Score
         * and sync leaderboard because the week is now officially finalized.
         */
        const currentWeekStreak = userStats.currentWeekStreak ?? 0;
        const bestWeekStreak = userStats.bestWeekStreak ?? 0;

        const calculatedStats = calculateModeScore({
          weeklyTarget: weeklyTargetDays,
          completedWorkoutsLast30Days,
          weeklyAdherenceStreak: currentWeekStreak,
          completedWorkoutsThisWeek: activeDaysThisWeek,
        });

        tx.update(aggregateRef, {
          metTargetThisWeek: true,
          finalizedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          modeScore: calculatedStats.modeScore,
          streakWeeks: currentWeekStreak,
          streakStatus: "active",
        });

        tx.update(userStatsRef, {
          modeScore: calculatedStats.modeScore,
          activity30DayRate: calculatedStats.activity30DayScore,
          last30DayWeeklyAdherenceRate: lastFourWeeksAdherenceRate,
          updatedAt: FieldValue.serverTimestamp(),
        });

        tx.set(
          leaderboardEntryRef,
          getLeaderboardEntryUpdate({
            uid,
            modeScore: calculatedStats.modeScore,
            streakWeeks: currentWeekStreak,
            weekId: user.currentWeekId ?? weekId,
          }),
          { merge: true },
        );
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
     *
     * Important:
     * Mode Score should be calculated with weeklyAdherenceStreak: 0 because
     * this branch resets the user's weekly streak.
     */
    const resetWeekStreak = 0;
    const bestWeekStreak = userStats.bestWeekStreak ?? 0;

    const calculatedStats = calculateModeScore({
      weeklyTarget: weeklyTargetDays,
      completedWorkoutsLast30Days,
      weeklyAdherenceStreak: resetWeekStreak,
      completedWorkoutsThisWeek: activeDaysThisWeek,
    });

    tx.update(aggregateRef, {
      metTargetThisWeek: false,
      modeScore: calculatedStats.modeScore,
      finalizedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      streakWeeks: resetWeekStreak,
      streakStatus: "reset",
    });

    tx.update(userStatsRef, {
      currentWeekStreak: resetWeekStreak,
      modeScore: calculatedStats.modeScore,
      activity30DayRate: calculatedStats.activity30DayScore,
      last30DayWeeklyAdherenceRate: lastFourWeeksAdherenceRate,
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.set(
      leaderboardEntryRef,
      getLeaderboardEntryUpdate({
        uid,
        modeScore: calculatedStats.modeScore,
        streakWeeks: resetWeekStreak,
        weekId: user.currentWeekId ?? weekId,
      }),
      { merge: true },
    );

    return {
      status: "finalized",
      uid,
      weekId,
    };
  });
}

function getLeaderboardEntryUpdate(input: {
  uid: string;
  modeScore: number;
  streakWeeks: number;
  weekId: string;
}) {
  return {
    uid: input.uid,

    modeScore: input.modeScore,
    streakWeeks: input.streakWeeks,

    weekId: input.weekId,

    isRanked: true,

    updatedAt: FieldValue.serverTimestamp(),
  };
}
