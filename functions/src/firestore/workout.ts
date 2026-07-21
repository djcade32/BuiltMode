import { UserWeekAggregate } from "@builtmode/shared/types/user";
import dayjs from "dayjs";
import { Transaction } from "firebase-admin/firestore";
import { db } from "../lib/firebaseAdmin.js";
import {
  DayMarker,
  ModeScoreBreakdown,
  ModeScoreInput,
  WeeklyAdherenceResult,
  Workout,
} from "../types/workout.js";
import { clamp, roundToNearestInt } from "../utils/math.js";
import { getLastFiveWeekIds } from "../utils/weekId.js";

export const createCompleteWorkout = (tx: Transaction, workout: Workout) => {
  const ref = db.collection("workouts").doc(workout.sessionId);
  tx.set(ref, workout);
};

export const createDayMarker = (tx: Transaction, dayMarker: DayMarker) => {
  const { uid, weekId, localDateKey } = dayMarker;
  const ref = db.collection(`userWeekDays/${uid}_${weekId}/days`).doc(localDateKey);
  tx.set(ref, dayMarker);
};

export const getUserLeaderboardEntry = (tx: Transaction, uid: string) => {
  return tx.get(db.collection("leaderboardEntries").doc(uid));
};

export const getDayMarker = (tx: Transaction, uid: string, weekId: string, localDateKey: string) => {
  return tx.get(db.collection(`userWeekDays/${uid}_${weekId}/days`).doc(localDateKey));
};

export const calculateModeScore = (input: ModeScoreInput): ModeScoreBreakdown => {
  const {
    weeklyAdherenceStreak,
    completedWorkoutsThisWeek,
    completedWorkoutsLast30Days,
    weeklyTarget,
    streakMaxWeeks = 12,
    completedWorkoutsLastFinalizedWeek,
    weeklyTargetLastFinalizedWeek,
  } = input;

  const streakScore = calculateStreakScore(weeklyAdherenceStreak, streakMaxWeeks);

  const currentWeekProgressScore = calculateWeeklyAdherenceRateScore(completedWorkoutsThisWeek, weeklyTarget);

  const finalizedWeeklyAdherenceRateScore =
    completedWorkoutsLastFinalizedWeek !== undefined && weeklyTargetLastFinalizedWeek !== undefined
      ? calculateWeeklyAdherenceRateScore(completedWorkoutsLastFinalizedWeek, weeklyTargetLastFinalizedWeek)
      : currentWeekProgressScore;

  /**
   * Current week can help Mode Score, but should not hurt it.
   */
  const weeklyAdherenceRateScore = Math.max(finalizedWeeklyAdherenceRateScore, currentWeekProgressScore);

  const { activity30DayScore, numOfdaysWorkedout } = calculate30DayActivityScore(completedWorkoutsLast30Days);

  const rawModeScore = streakScore * 0.45 + weeklyAdherenceRateScore * 0.3 + activity30DayScore * 0.25;

  return {
    modeScore: roundToNearestInt(rawModeScore),
    streakScore: roundToNearestInt(streakScore),
    weeklyAdherenceRateScore: roundToNearestInt(weeklyAdherenceRateScore),
    activity30DayScore: roundToNearestInt(activity30DayScore),
    activeDaysLast30: numOfdaysWorkedout,
  };
};

export const getLastFourWeekAggregates = async (
  tx: Transaction,
  uid: string,
  weekId: string,
): Promise<UserWeekAggregate[]> => {
  if (!uid.trim()) {
    throw new Error("uid is required.");
  }

  let weekIds = getLastFiveWeekIds(weekId);
  //Omit current weekId
  weekIds = weekIds.filter((id) => id !== weekId);
  const weekRefs = weekIds.map((id) => {
    const aggregateId = `${uid}_${id}`;

    return db.collection("userWeekAggregates").doc(aggregateId);
  });

  const snapshots = await tx.getAll(...weekRefs);

  return snapshots.flatMap((snapshot, index) => {
    if (!snapshot.exists) {
      return [];
    }

    const data = snapshot.data();

    if (!data) {
      return [];
    }

    return [
      {
        ...data,
        weekId: weekIds[index],
      } as UserWeekAggregate,
    ];
  });
};

export function getLastFourWeeksAdherenceRate(weekRecords: UserWeekAggregate[]): WeeklyAdherenceResult {
  const eligibleWeeks = weekRecords
    .filter((week) => {
      return week.isOfficialWeek && !week.isDeloadWeek && week.weeklyTargetDays > 0;
    })
    .sort((a, b) => b.weekId.localeCompare(a.weekId))
    .slice(0, 4);

  const normalizedWeeks = eligibleWeeks.map((week) => {
    // Extra workout days do not increase adherence above 100%.
    const completedDays = Math.min(week.activeDaysThisWeek, week.weeklyTargetDays);

    const adherenceRate = Math.round((completedDays / week.weeklyTargetDays) * 100);

    return {
      weekId: week.weekId,
      completedDays,
      targetDays: week.weeklyTargetDays,
      adherenceRate,
    };
  });

  const completedDays = normalizedWeeks.reduce((total, week) => total + week.completedDays, 0);

  const targetDays = normalizedWeeks.reduce((total, week) => total + week.targetDays, 0);

  const adherenceRate = targetDays === 0 ? 0 : Math.round((completedDays / targetDays) * 100);

  return {
    adherenceRate,
    completedDays,
    targetDays,
    weeksIncluded: normalizedWeeks.length,
    weeks: normalizedWeeks,
  };
}
// Helper functions

export const getLast30DayDateKeys = (todayLocalDateKey: string): Set<string> => {
  const result = new Set<string>();

  for (let i = 0; i < 30; i++) {
    result.add(dayjs(todayLocalDateKey).subtract(i, "day").format("YYYY-MM-DD"));
  }

  return result;
};

export const getWorkoutsWithinLast30Days = async (tx: Transaction, uid: string, todayLocalDateKey: string) => {
  // Turn set into array to better iterate over
  const validWindowKeys = [...getLast30DayDateKeys(todayLocalDateKey)];
  let daysWorkedout = 0;
  for (const dateKey of validWindowKeys) {
    const weekId = dayjs(dateKey).startOf("week").add(1, "day");
    const dayMarkerExists = (await getDayMarker(tx, uid, weekId.format("YYYY-MM-DD"), dateKey)).exists;
    dayMarkerExists && daysWorkedout++;
  }

  return daysWorkedout;
};

export const getDateKeysForMonth = (date: Date | string): Set<string> => {
  const result = new Set<string>();
  const startOfMonth = dayjs(date).startOf("month").toDate();
  const numOfDaysInMonth = dayjs(date).daysInMonth();

  for (let i = 0; i < numOfDaysInMonth; i++) {
    result.add(dayjs(startOfMonth).add(i, "day").format("YYYY-MM-DD"));
  }
  return result;
};

export const getTotalActiveDaysInMonth = async (
  tx: Transaction,
  uid: string,
  todayLocalDateKey: Date | string,
) => {
  // Turn set into array to better iterate over
  const validWindowKeys = [...getDateKeysForMonth(todayLocalDateKey)];
  let daysWorkedout = 0;
  for (const dateKey of validWindowKeys) {
    const weekId = dayjs(dateKey).startOf("week").add(1, "day");
    const dayMarkerExists = (await getDayMarker(tx, uid, weekId.format("YYYY-MM-DD"), dateKey)).exists;
    dayMarkerExists && daysWorkedout++;
  }
  return daysWorkedout;
};

const calculate30DayActivityScore = (numOfdaysWorkedout: number) => {
  const activity30DayScore = clamp((numOfdaysWorkedout / 30) * 100, 0, 100);

  return {
    activity30DayScore,
    numOfdaysWorkedout,
  };
};

const calculateWeeklyAdherenceRateScore = (completedWorkoutsThisWeek: number, weeklyTarget: number): number => {
  if (weeklyTarget <= 0) return 0;

  return clamp((completedWorkoutsThisWeek / weeklyTarget) * 100, 0, 100);
};

const calculateStreakScore = (weeklyAdherenceStreak: number, streakMaxWeeks: number = 12): number => {
  if (streakMaxWeeks <= 0) return 0;

  return clamp((weeklyAdherenceStreak / streakMaxWeeks) * 100, 0, 100);
};
