import { Timestamp } from "firebase-admin/firestore";

export type WeeklyTargetDays = 2 | 3 | 4 | 5 | 6 | 7;

export type UserDoc = {
  uid: string;

  // Identity
  username: string;
  usernameLower: string;
  displayName: string;
  avatarUrl?: string;

  // Time & eligibility
  homeTimezone: string;
  officialStartWeekId: string;
  weeklyTargetDays: WeeklyTargetDays;

  // Meta
  createdAt: Timestamp;
  updatedAt: Timestamp;
  homeTimezoneSetAt: Timestamp;
  homeTimezoneUpdatedAt?: Timestamp;
};

export type UsernameIndexDoc = {
  uid: string;
  createdAt: Timestamp;
};

export type FriendDoc = {
  uid: string;
  friendUid: string;
  status: "pending" | "accepted" | "blocked";
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type PendingTimezoneChange = {
  uid: string;
  nextHomeTimezone: string;
  effectiveWeekId: string;
  requestedAt: Timestamp;
};

export type PendingWeeklyTargetChange = {
  uid: string;
  nextWeeklyTargetDays: WeeklyTargetDays;
  effectiveWeekId: string;
  requestedAt: Timestamp;
};
