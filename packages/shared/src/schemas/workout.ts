import { z } from "zod";
import { homeTimezoneSchema } from "./user.js";

export const exerciseTypeSchema = z.enum(["strength", "conditioning", "cardio"]);

export const workoutTypeSchema = z.enum([
  "strength",
  "conditioning",
  "mixed",
  "skill",
  "recovery",
  "cardio",
  "other",
]);

export const exerciseMetricTypeSchema = z.enum([
  "weight_reps",
  "reps_only",
  "duration",
  "distance",
  "calories",
  "time",
]);

const workoutLocalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date format YYYY-MM-DD");

const workoutLocalTimeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Expected time format HH:mm");

export const workoutTimezoneFieldsSchema = z.object({
  workoutTimezone: homeTimezoneSchema,
  workoutLocalDate: workoutLocalDateSchema,
  workoutLocalTime: workoutLocalTimeSchema,
  workoutLocalDateTimeISO: z.string().min(1),
  workoutLocalDisplayDate: z.string().min(1),
  workoutLocalDisplayTime: z.string().min(1),
  workoutUtcOffsetMinutes: z.number().int().min(-840).max(840),
});

export const exerciseSetSchema = z.object({
  id: z.string().min(1),
  reps: z.number().int().nonnegative().optional(),
  weight: z.number().nonnegative().optional(),
  durationSec: z.number().int().nonnegative().optional(),
  distanceMiles: z.number().nonnegative().optional(),
  calories: z.number().nonnegative().optional(),
  completed: z.boolean().optional(),
  rpe: z.number().min(1).max(10).optional(),
});

export const exerciseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  metricType: exerciseMetricTypeSchema,
  sets: z.array(exerciseSetSchema),
  notes: z.string().trim().max(500).optional(),
});

export const activeWorkoutDraftSchema = z.object({
  sessionId: z.string().min(1),
  uid: z.string().min(1),
  name: z.string().trim().max(100).optional(),
  workoutType: workoutTypeSchema.optional(),
  notes: z.string().trim().max(1000).optional(),
  exercises: z.array(exerciseSchema),
  startedAtMs: z.number().int().nonnegative(),
  status: z.enum(["active", "finishing"]),
  lastEditedAtMs: z.number().int().nonnegative(),
});

export const completeWorkoutRequestSchema = z.object({
  sessionId: z.string().min(1),
  workoutType: workoutTypeSchema.optional(),
  notes: z.string().trim().max(1000).optional(),
  exercises: z.array(exerciseSchema),
  name: z.string().trim().max(100).optional(),
  duration: z.number().int().nonnegative(),
});

export const completeWorkoutResponseSchema = z
  .object({
    weekId: z.string().min(1),
    isOfficialWeek: z.boolean(),
    activeDaysThisWeek: z.number().int().nonnegative(),
    weeklyTargetDays: z.number().int().min(2).max(7),
    streakWeeks: z.number().int().nonnegative(),
    modeScore: z.number().min(0).max(100).nullable(),
    modeScoreDifference: z.number().min(-100).max(100),
    lockedAt: z.string().min(1),
    localDate: z.string().min(1),
  })
  .merge(workoutTimezoneFieldsSchema);

export const editWorkoutMetadataRequestSchema = z.object({
  sessionId: z.string().min(1),
  workoutType: workoutTypeSchema.optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const editWorkoutMetadataResponseSchema = z.object({
  sessionId: z.string().min(1),
  workoutType: workoutTypeSchema.optional(),
  notes: z.string().trim().max(1000).optional(),
  lockedAt: z.string().min(1),
});

export type ExerciseType = z.infer<typeof exerciseTypeSchema>;
export type WorkoutType = z.infer<typeof workoutTypeSchema>;
export type ExerciseMetricType = z.infer<typeof exerciseMetricTypeSchema>;
export type ExerciseSet = z.infer<typeof exerciseSetSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type ActiveWorkoutDraft = z.infer<typeof activeWorkoutDraftSchema>;
export type CompleteWorkoutRequest = z.infer<typeof completeWorkoutRequestSchema>;
export type CompleteWorkoutResponse = z.infer<typeof completeWorkoutResponseSchema>;
export type EditWorkoutMetadataRequest = z.infer<typeof editWorkoutMetadataRequestSchema>;
export type EditWorkoutMetadataResponse = z.infer<typeof editWorkoutMetadataResponseSchema>;
