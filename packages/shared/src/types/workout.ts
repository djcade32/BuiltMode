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
  calories?: number;
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
};

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
