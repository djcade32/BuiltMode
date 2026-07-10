import { Exercise, WorkoutTimezoneFields, WorkoutType } from "@builtmode/shared/types/workout";
import { Timestamp } from "firebase-admin/firestore";

export type WorkoutStatus = "completed" | "voided";

export type Workout = {
  sessionId: string;
  uid: string;

  completedAt: Timestamp;
  weekId: string;
  localDateKey: string;
  localDate: string;

  name?: string;
  workoutType?: WorkoutType;
  notes?: string;
  photoUrl: string | null;
  exercises: Exercise[];
  duration: number;

  lockedAt: Timestamp;
  status: WorkoutStatus;
  voidedAt?: Timestamp | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
} & WorkoutTimezoneFields;

export type UserWeekAggregate = {
  uid: string;
  weekId: string;
  isOfficialWeek: boolean;
  weeklyTargetDays: number;
  activeDaysThisWeek: number;
  metTargetThisWeek: boolean;
  weekStartAt: Timestamp;
  weekEndAt: Timestamp;
  targetMetAt: Timestamp | null;
  streakWeeks: number;
  streakStatus: "inactive" | "active";
  isDeloadWeek: boolean;
  modeScore: number | null;
  scoreVersion: number;
  updatedAt: Timestamp;
  streakCreditedAt: Timestamp | null;
  finalizedAt: Timestamp | null;
};

export type DayMarker = {
  uid: string;
  weekId: string;
  localDateKey: string;
  createdAt: Timestamp;
};

export type ModeScoreInput = {
  weeklyAdherenceStreak: number;
  completedWorkoutsThisWeek: number;
  weeklyTarget: number;
  completedWorkoutsLast30Days: number;
  streakMaxWeeks?: number; // configurable cap for streak normalization
  completedWorkoutsLastFinalizedWeek?: number;
  weeklyTargetLastFinalizedWeek?: number;
};

export type ModeScoreBreakdown = {
  modeScore: number;
  streakScore: number;
  weeklyAdherenceRateScore: number;
  activity30DayScore: number;
  activeDaysLast30: number;
};

export type WeeklyAdherenceResult = {
  adherenceRate: number;
  completedDays: number;
  targetDays: number;
  weeksIncluded: number;
  weeks: Array<{
    weekId: string;
    completedDays: number;
    targetDays: number;
    adherenceRate: number;
  }>;
};
