import { Timestamp } from "firebase-admin/firestore";

export type LeaderboardEntry = {
  uid: string;
  weekId: string;
  isRanked: boolean;
  modeScore: number;
  streakWeeks: number;
  updatedAt: Timestamp;
};
