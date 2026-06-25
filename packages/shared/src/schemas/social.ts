import { z } from "zod";
import { firestoreTimestampSchema } from "./firestore.js";

export const friendSchema = z.object({
  uid: z.string().min(1),
  createdAt: firestoreTimestampSchema,
  updatedAt: firestoreTimestampSchema,
});

export const friendListItemSchema = z.object({
  uid: z.string().min(1),
  username: z.string().min(1),
  usernameLower: z.string().min(1),
  displayName: z.string().min(1),
  avatarUrl: z.string().optional(),

  modeScore: z.number().min(0).max(100),
  weeklyTargetDays: z.number().min(2).max(7),
  weeklyProgress: z.number().min(0),
  currentWeekStreak: z.number().min(0),
  bestWeekStreak: z.number().min(0),
  isDeloadWeek: z.boolean(),
});

export const relationshipStatusSchema = z.enum([
  "self",
  "none",
  "request_sent",
  "request_received",
  "friends",
]);

export const searchUserResultSchema = z.object({
  uid: z.string().min(1),

  username: z.string().min(1),
  usernameLower: z.string().min(1),
  displayName: z.string().min(1),
  avatarUrl: z.string().optional(),

  relationshipStatus: relationshipStatusSchema,
});

export const feedItemTypeSchema = z.enum([
  "workout_completed",
  "weekly_target_met",
  "week_streak_milestone",
  "mode_score_milestone",
  "deload_declared",
]);

export const feedVisibilitySchema = z.enum(["friends"]);

export const feedItemSchema = z.object({
  feedItemId: z.string(),

  actorUid: z.string(),
  actorUsername: z.string(),
  actorDisplayName: z.string(),
  actorAvatarUrl: z.string().nullable(),

  type: feedItemTypeSchema,
  visibility: feedVisibilitySchema,

  workoutId: z.string().optional(),
  workoutType: z.string().nullable(),
  workoutName: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  exerciseCount: z.number().nullable(),
  totalSets: z.number().nullable(),
  isPracticeWeek: z.boolean(),
  completedAt: firestoreTimestampSchema,

  weekId: z.string(),
  localDateKey: z.string().nullable(),

  modeScore: z.number().nullable(),
  weeklyTargetDays: z.number().nullable(),
  weeklyProgress: z.number().nullable(),
  currentWeekStreak: z.number().nullable(),

  caption: z.string().nullable(),
  photoUrl: z.string().nullable(),

  createdAt: firestoreTimestampSchema,
  updatedAt: firestoreTimestampSchema,
});

export type Friend = z.infer<typeof friendSchema>;
export type FriendListItem = z.infer<typeof friendListItemSchema>;
export type SearchUserResult = z.infer<typeof searchUserResultSchema>;
export type RelationshipStatus = z.infer<typeof relationshipStatusSchema>;
export type FeedItem = z.infer<typeof feedItemSchema>;
