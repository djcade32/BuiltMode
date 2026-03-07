import { handleCreateUserProfile } from "../../functions/user.js";
import { db } from "../../lib/firebaseAdmin.js";
import { UserDoc } from "../../types.js";

const userDoc: Partial<UserDoc> = {
  uid: "123",
  displayName: "Norman",
  username: "djcade32",
  usernameLower: "djcade32",
  homeTimezone: "America/New_York",
};

describe("handleCreateUserProfile", () => {
  beforeEach(async () => {
    await db
      .doc(`users/${userDoc.uid}`)
      .delete()
      .catch(() => null);
    await db
      .doc(`leaderboardEntries/${userDoc.uid}`)
      .delete()
      .catch(() => null);
  });

  test("creates user doc in users/{uid} and leaderboardEntries/{uid}", async () => {
    const currentDate = new Date();

    await handleCreateUserProfile(currentDate, userDoc as UserDoc);

    const userSnap = await db.doc(`users/${userDoc.uid}`).get();
    const leaderboardSnap = await db.doc(`leaderboardEntries/${userDoc.uid}`).get();

    expect(userSnap.exists).toBe(true);
    expect(leaderboardSnap.exists).toBe(true);

    expect(userSnap.data()).toMatchObject({
      uid: userDoc.uid,
      displayName: userDoc.displayName,
      username: userDoc.username,
      usernameLower: userDoc.usernameLower,
      homeTimezone: userDoc.homeTimezone,
    });

    expect(leaderboardSnap.data()).toMatchObject({
      uid: userDoc.uid,
      usernameLower: userDoc.usernameLower,
    });
  });

  test("throws if user profile already exists", async () => {
    const currentDate = new Date();

    await handleCreateUserProfile(currentDate, userDoc as UserDoc);

    await expect(handleCreateUserProfile(currentDate, userDoc as UserDoc)).rejects.toThrow();

    const userSnap = await db.doc(`users/${userDoc.uid}`).get();
    const leaderboardSnap = await db.doc(`leaderboardEntries/${userDoc.uid}`).get();

    expect(userSnap.exists).toBe(true);
    expect(leaderboardSnap.exists).toBe(true);

    expect(userSnap.data()).toMatchObject({
      uid: userDoc.uid,
      displayName: userDoc.displayName,
      username: userDoc.username,
      usernameLower: userDoc.usernameLower,
      homeTimezone: userDoc.homeTimezone,
    });

    expect(leaderboardSnap.data()).toMatchObject({
      uid: userDoc.uid,
      usernameLower: userDoc.usernameLower,
    });
  });
});
