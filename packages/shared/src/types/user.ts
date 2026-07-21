import { firestoreTimestamp, firestoreTimestampV2 } from "./firestore.js";
import { WeeklyAdherenceResult } from "./workout.js";

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

export type OfficialWeekStatus = "practice" | "official";

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
  metrics?: Metrics | null;

  // Discipline / eligibility
  homeTimezone: HomeTimezone;
  officialStartWeekId: string;
  currentWeekId: string;
  officialWeekStatus: OfficialWeekStatus;
  officialStartAt: firestoreTimestamp;
  weeklyTargetDays: WeeklyTargetDays;
  pendingWeeklyTargetDays?: WeeklyTargetDays | null;
  pendingWeeklyTargetStartsAt?: firestoreTimestamp | firestoreTimestampV2 | null;

  // Meta
  createdAt: firestoreTimestamp;
  homeTimezoneSetAt: firestoreTimestamp;
  homeTimezoneUpdatedAt?: firestoreTimestamp;
  updatedAt: firestoreTimestamp;
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
  updatedAt: firestoreTimestamp;
};

export type UserStats = {
  currentWeekStreak: number;
  bestWeekStreak: number;
  last30DayWeeklyAdherenceRate: WeeklyAdherenceResult;
  activity30DayRate: number; // Percentage
  totalWorkoutsLogged: number;
  totalTargetsMet: number;
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
  metrics?: Metrics | null;
  displayName: string;
  avatarUrl?: string;
  homeTimezone: HomeTimezone;
  officialStartWeekId: string;
  officialStartAt: firestoreTimestamp;
  officialWeekStatus: OfficialWeekStatus;
  currentWeekId: string;
  weeklyTargetDays: WeeklyTargetDays;
  pendingWeeklyTargetDays?: WeeklyTargetDays | null;
  pendingWeeklyTargetStartsAt?: firestoreTimestamp | firestoreTimestampV2 | null;
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

export type PublicProfile = {
  uid: string;
  username: string;
  displayName?: string;
  avatarUrl: string | null;
  avatarVersion: number;
  avatarUpdatedAt?: firestoreTimestamp;
};
