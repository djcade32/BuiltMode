import { Goal, Metrics } from "@builtmode/shared/types/user";
import { Timestamp } from "firebase-admin/firestore";

export type WeeklyTargetDays = 2 | 3 | 4 | 5 | 6 | 7;
export type OfficialWeekStatus = "practice" | "official";

export type UserDoc = {
  uid: string;

  // Identity
  username: string;
  usernameLower: string;
  displayName: string;
  avatarUrl?: string;
  goal: Goal;
  metrics?: Metrics | null;

  // Time & eligibility
  homeTimezone: string;
  officialStartWeekId: string;
  weeklyTargetDays: WeeklyTargetDays;
  officialStartAt: Timestamp;
  officialWeekStatus: OfficialWeekStatus;
  officialStartedAt: Timestamp | null;
  currentWeekId: string;
  lastEnsuredWeekId: string | null;

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
