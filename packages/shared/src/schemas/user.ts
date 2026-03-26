import { z } from "zod";

export const goalSchema = z.union([
  z.literal("BUILD MUSCLE"),
  z.literal("CUT BODY FAT"),
  z.literal("INCREASE STRENGTH"),
  z.literal("IMPROVE CONDITIONING"),
  z.literal("GENERAL DISCIPLINE"),
]);

export const metricsSchema = z
  .object({
    height: z.number().nonnegative().max(131), // in inches
    weight: z.number().nonnegative().max(1000),
    bodyFatPercentage: z.number().nonnegative().max(100),
    system: z.union([z.literal("IMPERIAL"), z.literal("METRIC")]),
  })
  .optional();

export const weeklyTargetDaysSchema = z.union([
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);

// Keep MVP timezone validation simple.
// Later you can tighten this if needed.
export const homeTimezoneSchema = z.string().min(1).max(100);

export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z0-9._]+$/, {
    message: "Username can only contain letters, numbers, dots, and underscores.",
  });

export const usernameLowerSchema = z
  .string()
  .trim()
  .min(3)
  .max(20)
  .regex(/^[a-z0-9._]+$/, {
    message: "usernameLower must be normalized lowercase.",
  });

export const displayNameSchema = z.string().trim().min(1).max(40);

export const avatarUrlSchema = z.string().url().max(500).optional();

export const createUserProfileRequestSchema = z.object({
  username: usernameSchema,
  goal: goalSchema,
  metrics: metricsSchema,
  displayName: displayNameSchema,
  avatarUrl: avatarUrlSchema,
  homeTimezone: homeTimezoneSchema,
  weeklyTargetDays: weeklyTargetDaysSchema,
});

export const createUserProfileResponseSchema = z.object({
  uid: z.string().min(1),
  username: usernameSchema,
  goal: goalSchema,
  metrics: metricsSchema,
  displayName: displayNameSchema,
  avatarUrl: avatarUrlSchema,
  homeTimezone: homeTimezoneSchema,
  officialStartWeekId: z.string().min(1),
  weeklyTargetDays: weeklyTargetDaysSchema,
  isPracticeWeek: z.boolean(),
});

export const updateProfileRequestSchema = z.object({
  displayName: displayNameSchema.optional(),
  avatarUrl: avatarUrlSchema,
});

export const updateProfileResponseSchema = z.object({
  uid: z.string().min(1),
  displayName: displayNameSchema,
  avatarUrl: avatarUrlSchema,
});

export const updateWeeklyTargetRequestSchema = z.object({
  weeklyTargetDays: weeklyTargetDaysSchema,
});

export const updateWeeklyTargetResponseSchema = z.object({
  weeklyTargetDays: weeklyTargetDaysSchema,
  effectiveWeekId: z.string().min(1),
});

export const updateHomeTimezoneRequestSchema = z.object({
  homeTimezone: homeTimezoneSchema,
});

export const updateHomeTimezoneResponseSchema = z.object({
  homeTimezone: homeTimezoneSchema,
  effectiveWeekId: z.string().min(1),
});

export const friendRequestStatusSchema = z.enum(["pending", "accepted", "blocked"]);

export const friendSummarySchema = z.object({
  uid: z.string().min(1),
  username: usernameSchema,
  displayName: displayNameSchema,
  avatarUrl: avatarUrlSchema,
  status: friendRequestStatusSchema,
});

export type WeeklyTargetDays = z.infer<typeof weeklyTargetDaysSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Metrics = z.infer<typeof metricsSchema>;
export type HomeTimezone = z.infer<typeof homeTimezoneSchema>;
export type CreateUserProfileRequest = z.infer<typeof createUserProfileRequestSchema>;
export type CreateUserProfileResponse = z.infer<typeof createUserProfileResponseSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type UpdateProfileResponse = z.infer<typeof updateProfileResponseSchema>;
export type UpdateWeeklyTargetRequest = z.infer<typeof updateWeeklyTargetRequestSchema>;
export type UpdateWeeklyTargetResponse = z.infer<typeof updateWeeklyTargetResponseSchema>;
export type UpdateHomeTimezoneRequest = z.infer<typeof updateHomeTimezoneRequestSchema>;
export type UpdateHomeTimezoneResponse = z.infer<typeof updateHomeTimezoneResponseSchema>;
export type FriendRequestStatus = z.infer<typeof friendRequestStatusSchema>;
export type FriendSummary = z.infer<typeof friendSummarySchema>;
