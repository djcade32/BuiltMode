import { z } from "zod";
import { firestoreTimestampSchema } from "./firestore.js";

export const leaderboardEntrySchema = z.object({
  uid: z.string().min(1),
  username: z.string().min(1),
  usernameLower: z.string().min(1),
  displayName: z.string().min(1),
  avatarUrl: z.string().optional(),

  modeScore: z.number().min(0).max(100),
  weekId: z.string().min(1),
  streakWeeks: z.number().min(0),
  isRanked: z.boolean(),
  updatedAt: firestoreTimestampSchema,
});

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
