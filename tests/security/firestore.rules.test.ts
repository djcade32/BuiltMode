import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

// Refuse to run against a real project or a non-local server.
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const emulator = new URL(`http://${emulatorHost ?? "127.0.0.1:8080"}`);
if (!["127.0.0.1", "localhost", "[::1]"].includes(emulator.hostname)) {
  throw new Error("Security tests require a local Firestore emulator.");
}

// The regular Expo test suite discovers this file too; emulator tests run separately.
const describeRules = emulatorHost ? describe : describe.skip;
describeRules("Firestore security", () => {
let env: RulesTestEnvironment;
const dbFor = (uid: string) => env.authenticatedContext(uid).firestore();
const seed = async (documents: Record<string, object>) => env.withSecurityRulesDisabled(async (context) => {
  const batch = context.firestore().batch();
  for (const [path, data] of Object.entries(documents)) batch.set(context.firestore().doc(path), data);
  await batch.commit();
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-builtmode-rules",
    firestore: { host: emulator.hostname, port: Number(emulator.port), rules: readFileSync(resolve("firestore.rules"), "utf8") },
  });
});
afterAll(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await seed({
    "users/alice": { uid: "alice", homeTimezone: "America/New_York", metrics: { weight: 150 } },
    "users/bob": { uid: "bob", homeTimezone: "America/New_York" },
    "users/alice/friends/bob": { uid: "bob", createdAt: 1 },
    "users/bob/friends/alice": { uid: "alice", createdAt: 1 },
    "publicProfiles/alice": { uid: "alice", username: "alice" },
    "publicProfiles/bob": { uid: "bob", username: "bob" },
    "usernames/alice": { uid: "alice" },
    "leaderboardEntries/alice": { uid: "alice", modeScore: 50 },
    "leaderboardEntries/bob": { uid: "bob", modeScore: 60 },
    "userStats/alice": { uid: "alice", currentWeekStreak: 3 },
    "userStats/bob": { uid: "bob", currentWeekStreak: 2 },
    "userWeekAggregates/alice_2026-11-09": { uid: "alice", activeDaysThisWeek: 2 },
    "userWeekAggregates/bob_2026-11-09": { uid: "bob", activeDaysThisWeek: 1 },
    "userMonthAggregates/alice_2026-11": { uid: "alice", activeDaysCount: 2 },
    "userWeekDays/alice_2026-11-09/days/2026-11-11": { uid: "alice" },
    "workouts/a1": { uid: "alice", completedAt: 1, status: "completed", feedStatus: "pending_publish" },
    "workouts/b1": { uid: "bob", completedAt: 2, status: "completed" },
    "workouts/c1": { uid: "charlie", completedAt: 3, status: "completed" },
    "templates/t1": { uid: "alice", completedAt: 1 },
    "templates/t2": { uid: "bob", completedAt: 1 },
    "friendRequests/request1": { fromUid: "alice", toUid: "charlie", status: "pending", updatedAt: 1 },
    "feedItems/post1": { actorUid: "alice", respectCount: 1 },
    "feedItems/post1/respects/bob": { actorUid: "bob", createdAt: 1 },
    "userFeeds/alice/items/post1": { actorUid: "alice", createdAt: 1 },
    "userFeeds/bob/items/post1": { actorUid: "alice", createdAt: 1 },
    "users/alice/notifications/n1": { recipientUid: "alice", body: "Friend request" },
    "pushTokens/token1": { uid: "alice", token: "private-token" },
    "users/alice/pushTokens/token1": { uid: "alice", token: "private-token" },
    "contentReports/report1": { reporterUid: "alice", reportedUid: "bob", status: "pending" },
    "accountDeletions/deleting": { uid: "deleting" },
  });
});

test.each([
  "users/alice", "publicProfiles/alice", "usernames/alice", "leaderboardEntries/alice",
  "userStats/alice", "userWeekAggregates/alice_2026-11-09", "workouts/a1", "templates/t1",
  "friendRequests/request1", "userFeeds/alice/items/post1", "feedItems/post1", "contentReports/report1",
])("signed-out users cannot read %s", async (path) => {
  await assertFails(env.unauthenticatedContext().firestore().doc(path).get());
});

test("onboarding can check usernames and read its missing profile without listing private accounts", async () => {
  const db = dbFor("new-user");
  expect((await assertSucceeds(db.doc("users/new-user").get())).exists).toBe(false);
  expect((await assertSucceeds(db.doc("usernames/available-name").get())).exists).toBe(false);
  await assertSucceeds(db.doc("usernames/alice").get());
  await assertFails(db.collection("users").get());
  await assertFails(db.collection("usernames").get());
});

test("private account details are owner-only even for accepted friends", async () => {
  await assertSucceeds(dbFor("alice").doc("users/alice").get());
  await assertFails(dbFor("bob").doc("users/alice").get());
  await assertFails(dbFor("charlie").doc("users/alice").get());
});

test("signed-in users can read public profiles and leaderboard batches", async () => {
  const db = dbFor("charlie");
  await assertSucceeds(db.doc("publicProfiles/alice").get());
  await assertSucceeds(db.collection("leaderboardEntries").where("uid", "in", ["alice", "bob"]).get());
  await assertSucceeds(db.collection("leaderboardEntries").get());
});

test("owners and accepted friends can read progress and paginated workout history", async () => {
  for (const uid of ["alice", "bob"]) {
    const db = dbFor(uid);
    await assertSucceeds(db.doc("userStats/alice").get());
    await assertSucceeds(db.doc("userWeekAggregates/alice_2026-11-09").get());
    await assertSucceeds(db.doc("workouts/a1").get());
    const page = await assertSucceeds(db.collection("workouts").where("uid", "==", "alice").orderBy("completedAt", "desc").limit(3).get());
    expect(page.size).toBe(1);
    await assertSucceeds(db.collection("workouts").where("uid", "==", "alice").orderBy("completedAt", "desc").startAfter(page.docs[0]).limit(3).get());
  }
});

test("missing aggregate reads succeed so empty states keep working", async () => {
  for (const path of ["userWeekAggregates/alice_2026-11-16", "userMonthAggregates/alice_2026-12", "workouts/missing"]) {
    expect((await assertSucceeds(dbFor("alice").doc(path).get())).exists).toBe(false);
  }
});

test("strangers and unfiltered workout queries cannot access workout history", async () => {
  const db = dbFor("charlie");
  await assertFails(db.doc("workouts/a1").get());
  await assertFails(db.doc("userStats/alice").get());
  await assertFails(db.doc("userWeekAggregates/alice_2026-11-09").get());
  await assertFails(db.collection("workouts").where("uid", "==", "alice").get());
  await assertFails(dbFor("alice").collection("workouts").get());
});

test("pending friendship does not grant access and removing a friendship revokes it", async () => {
  await assertFails(dbFor("charlie").doc("workouts/a1").get());
  await env.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc("users/bob/friends/alice").delete();
  });
  await assertFails(dbFor("bob").doc("workouts/a1").get());
  await assertFails(dbFor("bob").doc("feedItems/post1").get());
});

test("only the owner reads templates, monthly progress, daily markers, and notifications", async () => {
  for (const path of ["templates/t1", "userMonthAggregates/alice_2026-11", "userWeekDays/alice_2026-11-09/days/2026-11-11", "users/alice/notifications/n1"]) {
    await assertSucceeds(dbFor("alice").doc(path).get());
    await assertFails(dbFor("bob").doc(path).get());
  }
  await assertSucceeds(dbFor("alice").collection("templates").where("uid", "==", "alice").orderBy("completedAt", "desc").limit(15).get());
  await assertFails(dbFor("alice").collection("templates").get());
});

test("pending-publish query remains accessible to its owner", async () => {
  await assertSucceeds(dbFor("alice").collection("workouts")
    .where("uid", "==", "alice").where("status", "==", "completed").where("feedStatus", "==", "pending_publish")
    .where("completedAt", "<=", 10).orderBy("completedAt", "asc").limit(5).get());
});

test("friend lists and feeds are private to their viewer", async () => {
  const db = dbFor("alice");
  await assertSucceeds(db.collection("users/alice/friends").orderBy("createdAt", "desc").limit(20).get());
  await assertSucceeds(db.doc("users/alice/friends/missing").get());
  await assertSucceeds(db.collection("userFeeds/alice/items").orderBy("createdAt", "desc").limit(15).get());
  await assertFails(dbFor("bob").collection("users/alice/friends").get());
  await assertFails(dbFor("bob").collection("userFeeds/alice/items").get());
});

test("friend requests are accessible only to the sender and recipient with scoped queries", async () => {
  await assertSucceeds(dbFor("alice").doc("friendRequests/request1").get());
  await assertSucceeds(dbFor("charlie").doc("friendRequests/request1").get());
  await assertFails(dbFor("bob").doc("friendRequests/request1").get());
  await assertSucceeds(dbFor("alice").collection("friendRequests").where("fromUid", "==", "alice").where("status", "==", "pending").orderBy("updatedAt", "desc").get());
  await assertSucceeds(dbFor("charlie").collection("friendRequests").where("toUid", "==", "charlie").where("status", "==", "pending").orderBy("updatedAt", "desc").get());
  await assertFails(dbFor("alice").collection("friendRequests").get());
});

test("respects follow parent-post access, including an absent viewer respect", async () => {
  for (const uid of ["alice", "bob"]) {
    const db = dbFor(uid);
    await assertSucceeds(db.doc("feedItems/post1").get());
    await assertSucceeds(db.doc(`feedItems/post1/respects/${uid}`).get());
    await assertSucceeds(db.collection("feedItems/post1/respects").orderBy("createdAt", "desc").limit(20).get());
  }
  await assertFails(dbFor("charlie").collection("feedItems/post1/respects").get());
  await assertFails(dbFor("charlie").doc("feedItems/post1/respects/bob").get());
});

test.each(["alice", "bob", "charlie"])("%s cannot access reports, tokens, or deletion jobs", async (uid) => {
  const db = dbFor(uid);
  for (const path of ["contentReports/report1", "pushTokens/token1", "users/alice/pushTokens/token1", "accountDeletions/deleting"]) {
    await assertFails(db.doc(path).get());
    await assertFails(db.doc(path).set({ uid, status: "reviewed" }));
    await assertFails(db.doc(path).delete());
  }
  await assertFails(db.collection("contentReports").get());
  await assertFails(db.collectionGroup("pushTokens").get());
});

test.each([
  "users/alice", "publicProfiles/alice", "usernames/alice", "leaderboardEntries/alice", "userStats/alice",
  "userWeekAggregates/alice_2026-11-09", "userMonthAggregates/alice_2026-11", "workouts/a1", "templates/t1",
  "friendRequests/request1", "feedItems/post1", "feedItems/post1/respects/bob", "userFeeds/alice/items/post1",
  "users/alice/friends/bob", "users/alice/notifications/n1",
])("direct client writes cannot modify or delete %s", async (path) => {
  const ref = dbFor("alice").doc(path);
  await assertFails(ref.set({ uid: "alice", modeScore: 100 }));
  await assertFails(ref.update({ modeScore: 100 }));
  await assertFails(ref.delete());
});

test("unknown collections, nested report data, and forged admin claims are denied", async () => {
  const db = env.authenticatedContext("alice", { admin: true }).firestore();
  await assertFails(db.doc("contentReports/report1").get());
  await assertFails(db.doc("contentReports/report1/notes/private").get());
  await assertFails(db.doc("unknown/private").get());
  await assertFails(db.doc("users/alice/unlisted/private").set({ uid: "alice" }));
  await assertFails(db.doc("users/alice/friends/charlie").set({ uid: "charlie" }));
});

test("deleting accounts lose access immediately, including public reads", async () => {
  await seed({ "accountDeletions/alice": { uid: "alice" } });
  for (const path of ["users/alice", "publicProfiles/bob", "workouts/a1", "leaderboardEntries/bob", "userFeeds/alice/items/post1"]) {
    await assertFails(dbFor("alice").doc(path).get());
  }
  await assertFails(dbFor("bob").doc("workouts/a1").get());
});


test("block lists are owner-readable and all client block mutations are denied", async () => {
  await seed({ "users/alice/blockedUsers/bob": { uid: "bob" } });
  await assertSucceeds(dbFor("alice").collection("users/alice/blockedUsers").get());
  await assertFails(dbFor("bob").doc("users/alice/blockedUsers/bob").get());
  await assertFails(dbFor("charlie").collection("users/alice/blockedUsers").get());
  await assertFails(dbFor("alice").doc("users/alice/blockedUsers/bob").delete());
  await assertFails(dbFor("alice").doc("users/alice/blockedUsers/charlie").set({ uid: "charlie" }));
});
test.each(["users/alice/blockedUsers/bob", "users/bob/blockedUsers/alice"])("a block at %s overrides stale friendships", async (path) => {
  await seed({ [path]: { uid: path.split("/").at(-1) } });
  await assertFails(dbFor("bob").doc("userStats/alice").get());
  await assertFails(dbFor("bob").doc("feedItems/post1").get());
  await assertFails(dbFor("bob").doc("feedItems/post1/respects/bob").get());
  await assertFails(dbFor("bob").collection("workouts").where("uid", "==", "alice").get());
  await assertSucceeds(dbFor("alice").doc("userStats/alice").get());
});

test("acceptance is owner-readable before onboarding and cannot be forged", async () => {
  const path = "users/new-user/legalAcceptance/terms";
  await assertSucceeds(dbFor("new-user").doc(path).get());
  await seed({ [path]: { termsVersion: "2026-11-12", acceptedAt: 1 } });
  await assertSucceeds(dbFor("new-user").doc(path).get());
  await assertFails(dbFor("alice").doc(path).get());
  await assertFails(env.unauthenticatedContext().firestore().doc(path).get());
  await assertFails(dbFor("new-user").doc(path).set({ termsVersion: "2026-11-12", acceptedAt: 2 }));
  await assertFails(dbFor("new-user").doc(path).delete());
  await assertFails(dbFor("new-user").collection("users/new-user/legalAcceptance").get());
});
});
