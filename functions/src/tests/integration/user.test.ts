import type { CreateUserProfileRequest } from "@builtmode/shared/types/user";
import { handleCreateUserProfile } from "../../functions/user.js";
import { db } from "../../lib/firebaseAdmin.js";
import { clearFirestore } from "../utils/clearFirestore.js";

describe("handleCreateUserProfile", () => {
  const uid = "test-user-123";
  const uid2 = "other-user-456";
  const usernameLower = "djcade32";

  const input: CreateUserProfileRequest = {
    username: "djcade32",
    displayName: "Norman",
    homeTimezone: "America/New_York",
    weeklyTargetDays: 4,
  };

  beforeEach(async () => {
    await clearFirestore();
  });

  test("creates user doc, username index, and leaderboard entry", async () => {
    await handleCreateUserProfile(uid, input);

    const [userSnap, leaderboardSnap, usernameSnap] = await Promise.all([
      db.doc(`users/${uid}`).get(),
      db.doc(`leaderboardEntries/${uid}`).get(),
      db.doc(`usernames/${usernameLower}`).get(),
    ]);

    expect(userSnap.exists).toBe(true);
    expect(leaderboardSnap.exists).toBe(true);
    expect(usernameSnap.exists).toBe(true);

    expect(userSnap.data()).toMatchObject({
      uid,
      username: input.username,
      usernameLower,
      displayName: input.displayName,
      homeTimezone: input.homeTimezone,
      weeklyTargetDays: input.weeklyTargetDays,
    });

    expect(leaderboardSnap.data()).toMatchObject({
      uid,
      usernameLower,
      displayName: input.displayName,
      isRanked: false,
      modeScore: 0,
      streakWeeks: 0,
    });

    expect(usernameSnap.data()).toMatchObject({
      uid,
    });
  });

  test("throws if user profile already exists", async () => {
    await handleCreateUserProfile(uid, input);

    await expect(handleCreateUserProfile(uid, input)).rejects.toThrow();

    const [userSnap, leaderboardSnap, usernameSnap] = await Promise.all([
      db.doc(`users/${uid}`).get(),
      db.doc(`leaderboardEntries/${uid}`).get(),
      db.doc(`usernames/${usernameLower}`).get(),
    ]);

    expect(userSnap.exists).toBe(true);
    expect(leaderboardSnap.exists).toBe(true);
    expect(usernameSnap.exists).toBe(true);
  });

  test("throws if username is already taken by another user", async () => {
    await handleCreateUserProfile(uid2, input);

    await expect(handleCreateUserProfile(uid, input)).rejects.toThrow();

    const originalUserSnap = await db.doc(`users/${uid2}`).get();
    const duplicateUserSnap = await db.doc(`users/${uid}`).get();

    expect(originalUserSnap.exists).toBe(true);
    expect(duplicateUserSnap.exists).toBe(false);
  });
});
