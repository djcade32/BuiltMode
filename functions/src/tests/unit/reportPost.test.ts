/// <reference types="jest" />
import { Timestamp } from "firebase-admin/firestore";
import { handleReportFeedPost, reportFeedPost } from "../../functions/reportPost.js";
import { db } from "../../lib/firebaseAdmin.js";

// Load the real shared schema source through ts-jest rather than its ESM build.
jest.mock("@builtmode/shared/schemas/social", () => jest.requireActual("../../../../packages/shared/src/schemas/social.ts"));
jest.mock("../../lib/firebaseAdmin.js", () => ({ db: { doc: jest.fn(), runTransaction: jest.fn() } }));
jest.mock("firebase-functions/v2/https", () => {
  const actual = jest.requireActual("firebase-functions/v2/https");
  return { ...actual, onCall: (handler: unknown) => handler };
});

const now = Timestamp.fromDate(new Date("2026-11-11T15:00:00Z"));
const input = { feedItemId: "workout_bob_w1", reason: "harassment", details: "  Repeated abusive caption  " };
const limitPath = "users/alice/reportLimits/workoutPosts";
let documents: Record<string, any>;
let tx: { get: jest.Mock; create: jest.Mock; set: jest.Mock };
let hasWritten: boolean;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Timestamp, "now").mockReturnValue(now);
  hasWritten = false;
  documents = {
    "users/alice": { username: "alice", displayName: "Alice" },
    "publicProfiles/bob": { username: "bob", displayName: "Bob" },
    "feedItems/workout_bob_w1": {
      actorUid: "bob", actorUsername: "old_bob", actorDisplayName: "Bob", type: "workout_completed",
      workoutId: "w1", workoutName: "Leg Day", caption: "caption", photoUrl: "https://example.com/photo.jpg", createdAt: now,
    },
    "userFeeds/alice/items/workout_bob_w1": { actorUid: "bob" },
  };
  tx = {
    get: jest.fn(async (path: string) => {
      if (hasWritten) throw new Error("Transaction reads must precede writes");
      return { exists: !!documents[path], data: () => documents[path] };
    }),
    create: jest.fn((path, data) => { if (documents[path]) throw new Error("Already exists"); hasWritten = true; documents[path] = data; }),
    set: jest.fn((path, data) => { hasWritten = true; documents[path] = data; }),
  };
  (db.doc as jest.Mock).mockImplementation((path) => path);
  (db.runTransaction as jest.Mock).mockImplementation((callback) => { hasWritten = false; return callback(tx); });
});
afterEach(() => jest.restoreAllMocks());

const report = () => handleReportFeedPost("alice", input);

test("saves private evidence and both server-verified identities", async () => {
  const result = await report();
  expect(result.status).toBe("submitted");
  expect(result.reportId).toMatch(/^[a-f0-9]{64}$/);
  expect(documents[`contentReports/${result.reportId}`]).toMatchObject({
    reporterUid: "alice", reporterUsername: "alice", reportedUid: "bob", reportedUsername: "bob",
    reason: "harassment", details: "Repeated abusive caption", status: "pending", createdAt: now,
    postSnapshot: { workoutId: "w1", caption: "caption", photoUrl: "https://example.com/photo.jpg" },
  });
  expect(documents[limitPath]).toMatchObject({ count: 1, windowStartedAt: now });
  expect(documents["feedItems/workout_bob_w1"].caption).toBe("caption");
});

test("duplicate submissions retain the original reason and do not consume the limit", async () => {
  const first = await report();
  const original = { ...documents[`contentReports/${first.reportId}`] };
  documents[limitPath].count = 10;
  const second = await handleReportFeedPost("alice", { ...input, reason: "spam" });
  expect(second).toEqual({ reportId: first.reportId, status: "already_reported" });
  expect(documents[`contentReports/${first.reportId}`]).toEqual(original);
  expect(tx.create).toHaveBeenCalledTimes(1);
  expect(documents[limitPath].count).toBe(10);
});

test("different reporters can independently report the same post", async () => {
  const first = await report();
  documents["users/charlie"] = { username: "charlie" };
  documents["userFeeds/charlie/items/workout_bob_w1"] = { actorUid: "bob" };
  const second = await handleReportFeedPost("charlie", input);
  expect(second.reportId).not.toBe(first.reportId);
  expect(documents[`contentReports/${second.reportId}`].reporterUid).toBe("charlie");
});

test("authentication is required at the callable boundary", async () => {
  await expect((reportFeedPost as any)({ data: input })).rejects.toMatchObject({ code: "unauthenticated" });
  expect(db.runTransaction).not.toHaveBeenCalled();
});

test.each([
  null, {}, { ...input, reason: "made-up" }, { ...input, reason: "other", details: "  " },
  { ...input, details: "x".repeat(1001) }, { ...input, feedItemId: "../private" },
  { ...input, feedItemId: "x".repeat(1501) }, { ...input, reporterUid: "victim" },
  { ...input, reportedUid: "victim" }, { ...input, photoUrl: "https://fake.example" },
])("rejects malformed or forged report data: %p", async (payload) => {
  await expect(handleReportFeedPost("alice", payload)).rejects.toMatchObject({ code: "invalid-argument" });
  expect(tx.create).not.toHaveBeenCalled();
});

test("Other requires details and accepts a description", async () => {
  const result = await handleReportFeedPost("alice", { ...input, reason: "other", details: "Specific concern" });
  expect(documents[`contentReports/${result.reportId}`].details).toBe("Specific concern");
});

test.each(["harassment", "hate_speech", "sexual_content", "violence", "spam"])("%s accepts optional details", async (reason) => {
  const result = await handleReportFeedPost("alice", { feedItemId: input.feedItemId, reason });
  expect(documents[`contentReports/${result.reportId}`].details).toBe("");
});

test("rejects self-reporting", async () => {
  documents["feedItems/workout_bob_w1"].actorUid = "alice";
  await expect(report()).rejects.toMatchObject({ code: "failed-precondition" });
  expect(tx.create).not.toHaveBeenCalled();
});

test("rejects nonexistent and unsupported posts", async () => {
  documents["feedItems/workout_bob_w1"].type = "weekly_target_met";
  await expect(report()).rejects.toMatchObject({ code: "failed-precondition" });
  delete documents["feedItems/workout_bob_w1"];
  await expect(report()).rejects.toMatchObject({ code: "not-found" });
});

test("rejects posts absent from the caller's feed or mismatched author data", async () => {
  documents["userFeeds/alice/items/workout_bob_w1"].actorUid = "someone-else";
  await expect(report()).rejects.toMatchObject({ code: "permission-denied" });
  delete documents["userFeeds/alice/items/workout_bob_w1"];
  await expect(report()).rejects.toMatchObject({ code: "permission-denied" });
  expect(tx.create).not.toHaveBeenCalled();
});

test("rejects deleting accounts and incomplete profiles", async () => {
  documents["accountDeletions/alice"] = {};
  await expect(report()).rejects.toMatchObject({ code: "failed-precondition" });
  delete documents["accountDeletions/alice"];
  delete documents["users/alice"];
  await expect(report()).rejects.toMatchObject({ code: "failed-precondition" });
});

test("accepts the tenth report and blocks further reports within the hour", async () => {
  documents[limitPath] = { count: 9, windowStartedAt: now };
  await report();
  expect(documents[limitPath].count).toBe(10);
  documents["feedItems/workout_bob_w2"] = { ...documents["feedItems/workout_bob_w1"] };
  documents["userFeeds/alice/items/workout_bob_w2"] = { actorUid: "bob" };
  await expect(handleReportFeedPost("alice", { ...input, feedItemId: "workout_bob_w2" })).rejects.toMatchObject({ code: "resource-exhausted" });
  expect(tx.create).toHaveBeenCalledTimes(1);
});

test("resets the rate limit after one hour", async () => {
  documents[limitPath] = { count: 10, windowStartedAt: Timestamp.fromMillis(now.toMillis() - 3600000) };
  await report();
  expect(documents[limitPath]).toMatchObject({ count: 1, windowStartedAt: now });
});

test("uses the server post's author snapshot when a public profile is missing", async () => {
  delete documents["publicProfiles/bob"];
  const result = await report();
  expect(documents[`contentReports/${result.reportId}`].reportedUsername).toBe("old_bob");
});

test("a storage failure is propagated so the client never receives false success", async () => {
  (db.runTransaction as jest.Mock).mockRejectedValueOnce(new Error("Unavailable"));
  await expect(report()).rejects.toThrow("Unavailable");
});
