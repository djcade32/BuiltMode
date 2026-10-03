/// <reference types="jest" />
import { Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { auth, db } from "../../lib/firebaseAdmin.js";
import { processAccountDeletion } from "../../functions/deleteAccount.js";

const project = process.env.GCLOUD_PROJECT;
if (project !== "demo-builtmode" || !process.env.FIRESTORE_EMULATOR_HOST
  || !process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
  throw new Error("These deletion tests require the demo-builtmode Firestore, Auth and Storage emulators.");
}

describe("account deletion with Firebase emulators", () => {
  const uid = "deletion-test-owner";
  const otherUid = "deletion-test-friend";
  const bucket = getStorage().bucket();
  let token: string;

  beforeAll(async () => {
    await auth.createUser({ uid, email: "delete@example.test", password: "Testing12345!" });
    const response = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "delete@example.test", password: "Testing12345!", returnSecureToken: true }),
    });
    token = (await response.json() as { idToken: string }).idToken;
    expect(token).toBeTruthy();
    for (const [path, data] of Object.entries({
      [`users/${uid}`]: { uid }, [`users/${otherUid}`]: { uid: otherUid },
      [`users/${otherUid}/friends/${uid}`]: { uid },
      [`workouts/deletion-test-session`]: { uid },
      [`userWeekDays/${uid}_2026-10-05/days/2026-10-06`]: { uid },
      [`feedItems/deletion-test-post`]: { actorUid: uid },
      [`feedItems/deletion-test-post/respects/${otherUid}`]: { actorUid: otherUid },
      [`userFeeds/${otherUid}/items/deletion-test-post`]: { actorUid: uid },
      [`userStats/${uid}`]: { uid }, [`publicProfiles/${uid}`]: { uid },
      [`leaderboardEntries/${uid}`]: { uid }, [`usernames/deletion-test`]: { uid },
    })) await db.doc(path).set(data);
    await bucket.file(`user-avatars/${uid}`).save("avatar");
    await bucket.file(`workouts/${uid}_deletion-test-session`).save("photo");
  });

  const patch = (path: string, fields: object, authenticated = true) => fetch(
    `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${project}/databases/(default)/documents/${path}`,
    { method: "PATCH", headers: { "Content-Type": "application/json", ...(authenticated ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ fields }) },
  );

  test("clients cannot forge deletion jobs or mutate account data", async () => {
    expect((await patch(`accountDeletions/${otherUid}`, { status: { stringValue: "pending" } })).status).toBe(403);
    expect((await patch(`users/${uid}`, { uid: { stringValue: uid } })).status).toBe(403);
    expect((await patch(`accountDeletions/${otherUid}`, {}, false)).status).toBe(403);
    expect((await patch("pushTokens/deletion-test-token", { uid: { stringValue: uid } })).status).toBe(200);
    expect((await patch(`users/${uid}/pushTokens/deletion-test-token`, { uid: { stringValue: uid } })).status).toBe(200);
  });

  test("cleans nested data, photos and auth; blocks stale-token writes; final sweep removes the job", async () => {
    await db.doc(`accountDeletions/${uid}`).set({ status: "pending", nextAttemptAt: Timestamp.now() });
    expect((await patch("pushTokens/deletion-test-token", { uid: { stringValue: uid } })).status).toBe(403);
    expect(await processAccountDeletion(uid)).toBe(true);
    await expect(auth.getUser(uid)).rejects.toMatchObject({ code: "auth/user-not-found" });
    expect((await db.doc(`users/${otherUid}`).get()).exists).toBe(true);
    expect((await db.doc(`users/${otherUid}/friends/${uid}`).get()).exists).toBe(false);
    expect((await db.collectionGroup("days").where("uid", "==", uid).get()).empty).toBe(true);
    expect((await db.doc(`feedItems/deletion-test-post/respects/${otherUid}`).get()).exists).toBe(false);
    expect((await db.doc(`userFeeds/${otherUid}/items/deletion-test-post`).get()).exists).toBe(false);
    expect((await bucket.file(`user-avatars/${uid}`).exists())[0]).toBe(false);
    expect((await bucket.file(`workouts/${uid}_deletion-test-session`).exists())[0]).toBe(false);
    await db.doc(`accountDeletions/${uid}`).update({ nextAttemptAt: Timestamp.fromMillis(0) });
    expect(await processAccountDeletion(uid)).toBe(true);
    expect((await db.doc(`accountDeletions/${uid}`).get()).exists).toBe(false);
  });
});
