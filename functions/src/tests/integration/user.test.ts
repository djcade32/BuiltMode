import { handleCreateUserProfile } from "../../functions/user.js";
import { db } from "../../lib/firebaseAdmin.js";
import { UserDoc } from "../../types.js";

const userDoc: UserDoc = {
  uid: "123",
  displayName: "Norman",
  username: "djcade32",
  usernameLower: "djcade32",
  homeTimezone: "America/New_York",
} as UserDoc;

describe("handleCreateUserProfile", () => {
  test("creates user doc and leaderboard entry", async () => {
    const currentDate = new Date();

    await handleCreateUserProfile(currentDate, userDoc);

    const userSnap = await db.doc("users/123").get();
    const leaderboardSnap = await db.doc("leaderboardEntries/123").get();

    expect(userSnap.exists).toBe(true);
    expect(leaderboardSnap.exists).toBe(true);

    expect(userSnap.data()).toMatchObject({
      uid: "123",
      displayName: "Norman",
      username: "djcade32",
      usernameLower: "djcade32",
      homeTimezone: "America/New_York",
    });

    expect(leaderboardSnap.data()).toMatchObject({
      uid: "123",
      usernameLower: "djcade32",
    });
  }, 50000);
});
