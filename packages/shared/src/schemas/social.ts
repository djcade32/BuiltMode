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

export type Friend = z.infer<typeof friendSchema>;
export type FriendListItem = z.infer<typeof friendListItemSchema>;
export type SearchUserResult = z.infer<typeof searchUserResultSchema>;
export type RelationshipStatus = z.infer<typeof relationshipStatusSchema>;
