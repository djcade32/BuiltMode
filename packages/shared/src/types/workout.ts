import { WeeklyTargetDays } from "./user.js";

export type ExerciseType = "strength" | "conditioning" | "cardio";

export type WorkoutType =
  | "strength"
  | "conditioning"
  | "mixed"
  | "skill"
  | "recovery"
  | "cardio"
  | "other";

export type ExerciseMetricType =
  | "weight_reps"
  | "reps_only"
  | "duration"
  | "distance"
  | "calories"
  | "time"
  | "other";

export type ExerciseSet = {
  id: string;
  reps?: number;
  weight?: number;
  durationSec?: number;
  distanceMiles?: number;
  distanceUnit?: "mi" | "km" | "m";
  calories?: number;
  timeSeconds?: number;
  completed?: boolean;
  rpe?: number;
};

export type Exercise = {
  id: string;
  name: string;
  metricType: ExerciseMetricType;
  sets: ExerciseSet[];
  notes?: string;
};

export type ActiveWorkoutDraft = {
  sessionId: string;
  uid: string;
  name?: string;
  workoutType?: WorkoutType;
  notes?: string;
  exercises: Exercise[];
  startedAtMs: number;
  status: "active" | "finishing";
  lastEditedAtMs: number;
};

export type CompleteWorkoutRequest = {
  sessionId: string;
  workoutType?: WorkoutType;
  notes?: string;
  exercises: Exercise[];
  name?: string;
  duration: number; // seconds
};

export type CompleteWorkoutResponse = {
  weekId: string;
  isOfficialWeek: boolean;
  activeDaysThisWeek: number;
  weeklyTargetDays: WeeklyTargetDays;
  streakWeeks: number;
  modeScore: number | null;
  modeScoreDifference: number;
  lockedAt: string;
  localDate: string;
} & WorkoutTimezoneFields;

export type EditWorkoutMetadataRequest = {
  sessionId: string;
  workoutType?: WorkoutType;
  notes?: string;
};

export type EditWorkoutMetadataResponse = {
  sessionId: string;
  workoutType?: WorkoutType;
  notes?: string;
  lockedAt: string;
};

export type WorkoutTimezoneFields = {
  workoutTimezone: string;

  /**
   * Owner-timezone local date.
   * Example: "2026-06-23"
   */
  workoutLocalDate: string;

  /**
   * Owner-timezone local time.
   * Example: "03:51"
   */
  workoutLocalTime: string;

  /**
   * Full owner-timezone ISO datetime.
   * Example: "2026-06-23T03:51:02+10:00"
   */
  workoutLocalDateTimeISO: string;

  /**
   * Preformatted display date from Cloud Functions.
   * Example: "Tuesday, Jun 23"
   */
  workoutLocalDisplayDate: string;

  /**
   * Preformatted display time from Cloud Functions.
   * Example: "3:51 AM"
   */
  workoutLocalDisplayTime: string;

  /**
   * Timezone offset in minutes at completion time.
   * Example: 600 for Australia/Sydney during UTC+10.
   */
  workoutUtcOffsetMinutes: number;
};
