import {
  CreateUserProfileRequest,
  CreateUserProfileResponse,
} from "@builtmode/shared/schemas/user";
import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";
import { createInitialEntry } from "../firestore/leaderboard.js";
import {
  createUser,
  createUsernameIndex,
  getUserByUid,
  getUsernameIndex,
} from "../firestore/user.js";
import { db } from "../lib/firebaseAdmin.js";
import { LeaderboardEntry } from "../types/leaderboard.js";
import { UserDoc } from "../types/user.js";
import { handleGetNextOfficialStartWeekId, handleGetWeekId } from "../utils/weekId.js";

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
  const usernameLower = user.username.trim().toLowerCase();
  const now = Timestamp.now();
  const currentWeekId = handleGetWeekId(now.toDate(), homeTimezone);
  const officialStartWeekId = handleGetNextOfficialStartWeekId(now.toDate(), homeTimezone);

  const isPracticeWeek = currentWeekId < officialStartWeekId;

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
      metrics: metrics ?? undefined,
      avatarUrl: avatarUrl ?? "",
      homeTimezone: homeTimezone,
      officialStartWeekId,
      weeklyTargetDays: weeklyTargetDays,
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
      usernameLower,
      displayName: userDoc.displayName,
      avatarUrl: userDoc.avatarUrl,
      updatedAt: now,
    };

    createUser(tx, userDoc);
    createUsernameIndex(tx, usernameLower, uid, now);
    createInitialEntry(tx, leaderboardEntry);
  });

  return {
    uid,
    username: username.trim(),
    displayName: displayName.trim(),
    avatarUrl: avatarUrl ?? "",
    goal,
    metrics: metrics ?? undefined,
    homeTimezone: homeTimezone,
    officialStartWeekId,
    weeklyTargetDays: weeklyTargetDays,
    isPracticeWeek,
  };
}
