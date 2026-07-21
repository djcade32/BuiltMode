import { CreateUserProfileRequest, CreateUserProfileResponse } from "@builtmode/shared/schemas/user";
import { firestoreTimestamp, firestoreTimestampV2 } from "@builtmode/shared/types/firestore";
import { PublicProfile, User, UserStats } from "@builtmode/shared/types/user";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";
import { createInitialEntry } from "../firestore/leaderboard.js";
import {
  changeUserAvatarUrl,
  changeWeeklyTarget,
  createPublicProfile,
  createUser,
  createUsernameIndex,
  createUserStats,
  getPublicProfile,
  getUserByUid,
  getUsernameIndex,
} from "../firestore/user.js";
import { db } from "../lib/firebaseAdmin.js";
import { LeaderboardEntry } from "../types/leaderboard.js";
import { UserDoc, WeeklyTargetDays } from "../types/user.js";
import { handleGetNextOfficialStartWeekId, handleGetWeekId } from "../utils/weekId.js";

dayjs.extend(utc);
dayjs.extend(timezone);

/** 
  Create new user profile.

  Add User to `user/{uid}` and `leaderboardEntries/{uid}` in Firestore
  @param {string} uid User's uid
  @param {CreateUserProfileRequest} user User object to save in Firestore
  @return On success return User else return null
*/
export async function handleCreateUserProfile(
  uid: string,
  user: CreateUserProfileRequest,
): Promise<CreateUserProfileResponse> {
  const { homeTimezone, username, displayName, avatarUrl, weeklyTargetDays, goal, metrics } = user;

  const usernameLower = username.trim().toLowerCase();
  const now = Timestamp.now();

  const currentWeekId = handleGetWeekId(now.toDate(), homeTimezone);
  const officialStartWeekId = handleGetNextOfficialStartWeekId(now.toDate(), homeTimezone);

  const isPracticeWeek = currentWeekId < officialStartWeekId;

  /**
   * This should represent the exact UTC timestamp for:
   * officialStartWeekId at Monday 4:00 AM in the user's homeTimezone.
   */
  const officialStartAt = handleGetOfficialStartAt(officialStartWeekId, homeTimezone);

  const officialWeekStatus: UserDoc["officialWeekStatus"] = isPracticeWeek ? "practice" : "official";

  const officialStartedAt = isPracticeWeek ? null : now;

  await db.runTransaction(async (tx) => {
    const existingUser = await getUserByUid(tx, uid);
    if (existingUser.exists) {
      throw new HttpsError("already-exists", "Profile already exists.");
    }

    const usernameTaken = await getUsernameIndex(tx, usernameLower);
    if (usernameTaken.exists) {
      throw new HttpsError("already-exists", "Username is already taken.");
    }

    const userDoc: UserDoc = {
      uid,
      username: username.trim(),
      usernameLower,
      displayName: displayName.trim(),
      goal,
      metrics: metrics ?? null,
      avatarUrl: avatarUrl ?? "",
      homeTimezone,

      weeklyTargetDays,
      currentWeekId,
      officialStartWeekId,
      officialStartAt,
      officialWeekStatus,
      lastEnsuredWeekId: null,

      /**
       * If the user signs up exactly inside their official week,
       * they are official immediately.
       *
       * If they are still in practice week, this stays null until the cron job
       * promotes them.
       */
      officialStartedAt,

      createdAt: now,
      updatedAt: now,
      homeTimezoneSetAt: now,
    };

    const leaderboardEntry: LeaderboardEntry = {
      uid,
      weekId: currentWeekId,
      isRanked: false,
      modeScore: 0,
      streakWeeks: 0,
      displayName: displayName.trim(),
      usernameLower,
      updatedAt: now,
    };

    const userStatsDoc: UserStats = {
      currentWeekStreak: 0,
      bestWeekStreak: 0,
      modeScore: null,
      last30DayWeeklyAdherenceRate: {
        adherenceRate: 0,
        completedDays: 0,
        targetDays: 0,
        weeks: [],
        weeksIncluded: 0,
      },
      activity30DayRate: 0,
      totalTargetsMet: 0,
      totalWorkoutsLogged: 0,
      weeklyTargetDays,
      updatedAt: now,
    };

    const publicProfileDoc: PublicProfile = {
      uid,
      username,
      displayName,
      avatarUrl: avatarUrl ?? "",
      avatarVersion: 0,
      avatarUpdatedAt: now,
    };

    createUser(tx, userDoc);
    createUsernameIndex(tx, usernameLower, uid, now);
    createInitialEntry(tx, leaderboardEntry);
    createUserStats(tx, uid, userStatsDoc);
    createPublicProfile(tx, uid, publicProfileDoc);
  });

  return {
    uid,
    username: username.trim(),
    displayName: displayName.trim(),
    avatarUrl: avatarUrl ?? "",
    goal,
    metrics: metrics ?? undefined,
    homeTimezone,
    currentWeekId,
    officialStartWeekId,
    officialStartAt,
    officialWeekStatus,
    weeklyTargetDays,
    isPracticeWeek,
  };
}

export async function handleFetchingUserHomeTimezone(userId: string): Promise<string | null> {
  return await db.runTransaction(async (tx) => {
    const user = await getUserByUid(tx, userId);
    if (!user.exists) return null;
    const homeTimezone = user.data()?.homeTimezone;
    return typeof homeTimezone === "string" ? homeTimezone : null;
  });
}

export async function handleChangingUserAvatarUrl(
  uid: string,
  avatarUrl: string | null,
): Promise<PublicProfile | undefined> {
  const result = await db.runTransaction(async (tx) => {
    const fetchedProfile = (await getPublicProfile(tx, uid)).data();
    if (!fetchedProfile) {
      throw new HttpsError("not-found", "Public profile not found.");
    }
    const avatarVersion = (fetchedProfile.avatarVersion ?? 0) + 1;

    const updatedProfile: PublicProfile = {
      uid,
      avatarUrl,
      avatarVersion,
      username: fetchedProfile.username,
      displayName: fetchedProfile.displayName,
    };

    changeUserAvatarUrl(tx, uid, updatedProfile);
    return updatedProfile;
  });
  return result;
}

export async function handleChangingWeeklyTarget(
  uid: string,
  weeklyTarget: WeeklyTargetDays,
): Promise<firestoreTimestampV2 | firestoreTimestamp | undefined | null> {
  const result = await db.runTransaction(async (tx) => {
    const fetchedUser = (await getUserByUid(tx, uid)).data();
    if (!fetchedUser || fetchedUser === undefined) return undefined;
    const { homeTimezone } = fetchedUser;
    const nextWeekId = handleGetNextOfficialStartWeekId(Timestamp.now().toDate(), homeTimezone);

    const updatedUserDoc: User = {
      ...(fetchedUser as User),
      pendingWeeklyTargetDays: weeklyTarget,
      pendingWeeklyTargetStartsAt: handleGetOfficialStartAt(nextWeekId, homeTimezone),
    };

    await changeWeeklyTarget(tx, uid, updatedUserDoc);
    return updatedUserDoc.pendingWeeklyTargetStartsAt;
  });
  return result;
}

export function handleGetOfficialStartAt(
  officialStartWeekId: string,
  homeTimezone: string,
): Timestamp | firestoreTimestampV2 {
  if (!officialStartWeekId.trim()) {
    throw new Error("officialStartWeekId is required.");
  }

  if (!homeTimezone.trim()) {
    throw new Error("homeTimezone is required.");
  }

  const isValidWeekId = /^\d{4}-\d{2}-\d{2}$/.test(officialStartWeekId);

  if (!isValidWeekId) {
    throw new Error(`Invalid officialStartWeekId: ${officialStartWeekId}. Expected YYYY-MM-DD.`);
  }

  /**
   * officialStartWeekId represents the local Monday date.
   * BuiltMode official weeks begin Monday at 4:00 AM
   * in the user's home timezone.
   *
   * Example:
   * officialStartWeekId = "2026-06-08"
   * homeTimezone = "America/New_York"
   *
   * Local:
   * 2026-06-08 04:00:00 America/New_York
   *
   * Stored:
   * Firestore Timestamp in UTC
   */
  const officialStartLocal = dayjs.tz(`${officialStartWeekId} 04:00:00`, "YYYY-MM-DD HH:mm:ss", homeTimezone);

  if (!officialStartLocal.isValid()) {
    throw new Error(`Unable to calculate officialStartAt for ${officialStartWeekId} in ${homeTimezone}.`);
  }

  return Timestamp.fromDate(officialStartLocal.toDate());
}
