import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { AddUserToLeaderboard, createUserDoc } from "../firestore/user.js";
import { db } from "../lib/firebaseAdmin.js";
import { LeaderboardDoc, UserDoc } from "../types.js";
import { assertValidTimezone } from "../utils.js";
import { handleGetNextOfficialStartWeekId } from "../utils/weekId.js";

/** 
  Create new user profile.

  Add User to `user/{uid}` and `leaderboardEntries/{uid}` in Firestore
  @param {Date | string} date 
  @param {UserDoc} user User object to save in Firestore
*/
export async function handleCreateUserProfile(date: Date | string, user: UserDoc) {
  const { homeTimezone } = user;
  const batch: FirebaseFirestore.WriteBatch = db.batch();
  assertValidTimezone(homeTimezone);

  const officialStartWeekId = handleGetNextOfficialStartWeekId(date, homeTimezone);
  const now = FieldValue.serverTimestamp() as Timestamp;
  const userPayload: UserDoc = {
    ...user,
    officialStartWeekId,
    homeTimezoneSetAt: now,
    createdAt: now,
    homeTimezoneUpdatedAt: now,
  };
  const { displayName, avatarUrl, usernameLower, uid } = user;
  const leaderboardPayload: LeaderboardDoc = {
    uid,
    displayName,
    usernameLower,
    weekId: officialStartWeekId,
    streakWeeks: 0,
    isRanked: false,
    updatedAt: now,
    modeScore: 0,
  };
  if (avatarUrl) {
    leaderboardPayload["avatarUrl"] = avatarUrl;
  }

  try {
    createUserDoc(batch, userPayload);
    AddUserToLeaderboard(batch, leaderboardPayload);
    await batch.commit();
    return userPayload;
  } catch (error) {
    console.error("Error creating new user: ", error);
    return null;
  }
}
