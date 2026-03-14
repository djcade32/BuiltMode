import { Timestamp } from "firebase-admin/firestore";

export type LeaderboardEntry = {
  uid: string;
  weekId: string;
  isRanked: boolean;
  modeScore: number;
  streakWeeks: number;
  usernameLower: string;
  displayName: string;
  avatarUrl?: string;
  updatedAt: Timestamp;
};
