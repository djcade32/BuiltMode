import { firestoreTimestamp } from "./firestore.js";

export type Goal =
  | "BUILD MUSCLE"
  | "CUT BODY FAT"
  | "INCREASE STRENGTH"
  | "IMPROVE CONDITIONING"
  | "GENERAL DISCIPLINE";

export type Metrics = {
  height: number; // in inches
  weight: number;
  bodyFatPercentage: number;
  system: "IMPERIAL" | "METRIC";
};

export type HomeTimezone = string;

export type WeeklyTargetDays = 2 | 3 | 4 | 5 | 6 | 7;

export type User = {
  uid: string;

  // Identity
  username: string;
  usernameLower: string;
  displayName: string;
  avatarUrl?: string;
  goal: Goal;
  metrics?: Metrics;

  // Discipline / eligibility
  homeTimezone: HomeTimezone;
  officialStartWeekId: string;
  weeklyTargetDays: WeeklyTargetDays;

  // Meta
  createdAt: string;
  homeTimezoneSetAt: string;
  homeTimezoneUpdatedAt?: string;
  updatedAt: string;
};

export type UserWeekAggregate = {
  uid: string;
  weekId: string;
  isOfficialWeek: boolean;
  weeklyTargetDays: number;
  activeDaysThisWeek: number;
  metTargetThisWeek: boolean;
  streakWeeks: number;
  streakStatus: "inactive" | "active";
  isDeloadWeek: boolean;
  modeScore: number | null;
  scoreVersion: number;
  updatedAt: string;
};

export type UserStats = {
  currentWeekStreak: number;
  bestWeekStreak: number;
  totalWorkoutsLogged: number;
  modeScore: number | null;
  weeklyTargetDays: number;
  updatedAt: firestoreTimestamp;
};

export type UserMonthAggregate = {
  uid: string;
  monthId: string; // "2026-05"
  totalWorkouts: number;
  activeDaysCount: number;
  workoutCountByDate: Record<string, number>; // localDateKey -> workout count
  createdAt: firestoreTimestamp;
  updatedAt: firestoreTimestamp;
};

export type PublicUserProfile = {
  uid: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
};

export type CreateUserProfileRequest = {
  username: string;
  goal: Goal;
  metrics?: Metrics;
  weeklyTargetDays: WeeklyTargetDays;
  avatarUrl?: string;
  homeTimezone: HomeTimezone;
  displayName: string;
};

export type CreateUserProfileResponse = {
  uid: string;
  username: string;
  goal: Goal;
  metrics?: Metrics;
  displayName: string;
  avatarUrl?: string;
  homeTimezone: HomeTimezone;
  officialStartWeekId: string;
  weeklyTargetDays: WeeklyTargetDays;
  isPracticeWeek: boolean;
};

export type UpdateProfileRequest = {
  displayName?: string;
  avatarUrl?: string;
};

export type UpdateProfileResponse = {
  uid: string;
  displayName: string;
  avatarUrl?: string;
};

export type UpdateWeeklyTargetRequest = {
  weeklyTargetDays: WeeklyTargetDays;
};

export type UpdateWeeklyTargetResponse = {
  weeklyTargetDays: WeeklyTargetDays;
  effectiveWeekId: string;
};

export type UpdateHomeTimezoneRequest = {
  homeTimezone: HomeTimezone;
};

export type UpdateHomeTimezoneResponse = {
  homeTimezone: HomeTimezone;
  effectiveWeekId: string;
};

export type FriendRequestStatus = "pending" | "accepted" | "blocked";

export type FriendSummary = {
  uid: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: FriendRequestStatus;
};
