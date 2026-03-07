import { Timestamp } from "firebase-admin/firestore";

export type UserDoc = {
  uid: string;
  username: string;
  usernameLower: string;
  displayName: string;
  avatarUrl?: string;
  homeTimezone: string;
  officialStartWeekId: string;
  createdAt: Timestamp;
  homeTimezoneSetAt: Timestamp;
  homeTimezoneUpdatedAt?: Timestamp;
};

export type UserDTO = {
  uid: string;
  username: string;
  usernameLower: string;
  displayName: string;
  avatarUrl?: string;
  homeTimezone: string;
  officialStartWeekId: string;
};

export type LeaderboardDoc = {
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
