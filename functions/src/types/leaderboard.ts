import { Timestamp } from "firebase-admin/firestore";

export type LeaderboardEntry = {
  uid: string;
  weekId: string;
  isRanked: boolean;
  modeScore: number;
  streakWeeks: number;
  displayName: string;
  usernameLower: string;
  updatedAt: Timestamp;
};
