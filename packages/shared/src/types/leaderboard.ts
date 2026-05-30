import { firestoreTimestamp } from "./firestore.js";

export type LeaderboardEntry = {
  uid: string;
  weekId: string;
  isRanked: boolean;
  modeScore: number;
  streakWeeks: number;
  usernameLower: string;
  displayName: string;
  avatarUrl?: string;
  updatedAt: firestoreTimestamp;
};
