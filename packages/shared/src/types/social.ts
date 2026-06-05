import { firestoreTimestamp } from "./firestore.js";

export type FriendRequest = {
  requestId: string;
  fromUid: string;
  toUid: string;

  fromUsername: string;
  fromDisplayName: string;
  fromAvatarUrl?: string;

  toUsername: string;
  toDisplayName: string;
  toAvatarUrl?: string;

  status: "pending" | "accepted" | "declined" | "cancelled";

  createdAt: firestoreTimestamp;
  updatedAt: firestoreTimestamp;
  respondedAt?: firestoreTimestamp | null;
};

export type FeedItemType =
  | "workout_completed"
  | "weekly_target_met"
  | "week_streak_milestone"
  | "mode_score_milestone"
  | "deload_declared";

export type FeedItem = {
  feedItemId: string;

  actorUid: string;
  actorUsername: string;
  actorDisplayName: string;
  actorAvatarUrl: string | null;

  type: FeedItemType;

  visibility: "friends";

  workoutId?: string;
  workoutType: string | null;
  workoutName: string | null;
  durationSeconds: number | null;
  exerciseCount: number | null;
  totalSets: number | null;
  isPracticeWeek: boolean;
  completedAt: firestoreTimestamp;

  weekId: string;
  localDateKey: string | null;

  modeScore: number | null;
  weeklyTargetDays: number | null;
  weeklyProgress: number | null;
  currentWeekStreak: number | null;

  caption: string | null;

  createdAt: firestoreTimestamp;
  updatedAt: firestoreTimestamp;
};

export type Friend = {
  uid: string;
  createdAt: firestoreTimestamp;
  updatedAt: firestoreTimestamp;
};

export type FriendListItem = {
  uid: string;
  username: string;
  usernameLower: string;
  displayName: string;
  avatarUrl: string;

  modeScore: number;
  weeklyTargetDays: number;
  weeklyProgress: number;
  currentWeekStreak: number;
  bestWeekStreak: number;
  isDeloadWeek: boolean;
};

export type RelationshipStatus = "self" | "none" | "request_sent" | "request_received" | "friends";

export type SearchUserResult = {
  uid: string;

  username: string;
  usernameLower: string;
  displayName: string;
  avatarUrl: string;

  relationshipStatus: RelationshipStatus;
};
