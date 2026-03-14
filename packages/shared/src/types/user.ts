export type HomeTimezone = string;

export type WeeklyTargetDays = 2 | 3 | 4 | 5 | 6 | 7;

export type User = {
  uid: string;

  // Identity
  username: string;
  usernameLower: string;
  displayName: string;
  avatarUrl?: string;

  // Discipline / eligibility
  homeTimezone: HomeTimezone;
  officialStartWeekId: string;
  weeklyTargetDays: WeeklyTargetDays;

  // Meta
  createdAt: string;
  homeTimezoneSetAt: string;
  homeTimezoneUpdatedAt?: string;
};

export type PublicUserProfile = {
  uid: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
};

export type CreateUserProfileRequest = {
  username: string;
  displayName: string;
  avatarUrl?: string;
  homeTimezone: HomeTimezone;
  weeklyTargetDays: WeeklyTargetDays;
};

export type CreateUserProfileResponse = {
  uid: string;
  username: string;
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
