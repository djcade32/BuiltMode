/// <reference types="jest" />
import { handleBlockUser, handleUnblockUser, removeBlockedFeedItems, isBlockedBetween } from "../../functions/blocking.js";
import { fanoutFeedItemToFriends, handleSendFriendRequest, handleRespondToFriendRequest, handleSearchUserByUsername, handleRespectFeedPost } from "../../functions/social.js";
import { db } from "../../lib/firebaseAdmin.js";

jest.mock("@builtmode/shared/schemas/social", () => jest.requireActual("../../../../packages/shared/src/schemas/social.ts"));
jest.mock("../../lib/firebaseAdmin.js", () => ({ db: { doc: jest.fn(), collection: jest.fn(), runTransaction: jest.fn() } }));
jest.mock("../../services/notificationService.js", () => ({ sendPushNotificationToUser: jest.fn() }));
jest.mock("firebase-functions/v2/firestore", () => ({ onDocumentCreated: (_options: unknown, handler: unknown) => handler }));

let records: Map<string, any>;
let failQuery: boolean;
const ref = (path: string): any => ({ path, get: async () => snap(path) });
const snap = (path: string): any => ({
  exists: records.has(path), ref: ref(path), id: path.split("/").at(-1),
  data: () => records.get(path), get: (key: string) => records.get(path)?.[key],
});
const query = (path: string, filters: [string, unknown][] = [], size = Infinity): any => ({
  where: (key: string, _operator: string, value: unknown) => query(path, [...filters, [key, value]], size),
  limit: (limit: number) => query(path, filters, limit),
  doc: (id: string) => ref(`${path}/${id}`),
  get: async () => {
    if (failQuery) throw new Error("Temporary cleanup failure");
    const docs = [...records.keys()].filter((key) => key.split("/").slice(0, -1).join("/") === path
      && filters.every(([field, value]) => records.get(key)[field] === value)).slice(0, size).map(snap);
    return { docs, size: docs.length, empty: docs.length === 0 };
  },
});
beforeEach(() => {
  jest.clearAllMocks();
  failQuery = false;
  records = new Map([
    ["users/alice", { uid: "alice", username: "alice", displayName: "Alice" }],
    ["users/bob", { uid: "bob", username: "bob", displayName: "Bob" }],
    ["users/alice/friends/bob", { uid: "bob" }], ["users/bob/friends/alice", { uid: "alice" }],
    ["friendRequests/alice_bob", { fromUid: "alice", toUid: "bob", status: "pending" }],
    ["friendRequests/bob_alice", { fromUid: "bob", toUid: "alice", status: "pending" }],
    ["userFeeds/alice/items/b1", { actorUid: "bob" }], ["userFeeds/bob/items/a1", { actorUid: "alice" }],
    ["userFeeds/alice/items/c1", { actorUid: "charlie" }], ["feedItems/b1", { actorUid: "bob" }],
    ["usernames/bob", { uid: "bob" }],
  ]);
  (db.doc as jest.Mock).mockImplementation(ref);
  (db.collection as jest.Mock).mockImplementation(query);
  (db.runTransaction as jest.Mock).mockImplementation(async (callback) => {
    const writes: (() => void)[] = [];
    const tx = {
      get: async (reference: any) => {
        if (writes.length) throw new Error("Read after transaction write");
        return reference.get();
      },
      create: (reference: any, value: any) => writes.push(() => {
        if (records.has(reference.path)) throw new Error("Already exists");
        records.set(reference.path, value);
      }),
      set: (reference: any, value: any) => writes.push(() => records.set(reference.path, value)),
      delete: (reference: any) => writes.push(() => records.delete(reference.path)),
    };
    const result = await callback(tx);
    writes.forEach((write) => write());
    return result;
  });
});
const block = () => handleBlockUser("alice", { targetUid: "bob" });
const generation = () => records.get("users/alice/blockedUsers/bob").generation;

test("blocking saves server identities, a private review record, and removes friendship and requests", async () => {
  await expect(block()).resolves.toEqual({ status: "blocked" });
  expect(records.get("users/alice/blockedUsers/bob")).toMatchObject({ uid: "bob", username: "bob" });
  for (const path of ["users/alice/friends/bob", "users/bob/friends/alice", "friendRequests/alice_bob", "friendRequests/bob_alice"]) expect(records.has(path)).toBe(false);
  const reports = [...records.entries()].filter(([path]) => path.startsWith("contentReports/"));
  expect(reports).toHaveLength(1);
  expect(reports[0][1]).toMatchObject({ type: "user_block", reporterUid: "alice", reportedUid: "bob", status: "pending" });
  await block();
  expect([...records.keys()].filter((path) => path.startsWith("contentReports/"))).toHaveLength(1);
});

test.each([undefined, null, {}, { targetUid: "" }, { targetUid: "../bob" }, { targetUid: "." }, { targetUid: "bob", uid: "charlie" }, { targetUid: "alice" }])("rejects invalid input %p", async (input) => {
  await expect(handleBlockUser("alice", input)).rejects.toMatchObject({ code: "invalid-argument" });
});
test("requires authentication", async () => {
  await expect(handleBlockUser(undefined, { targetUid: "bob" })).rejects.toMatchObject({ code: "unauthenticated" });
});
test.each(["alice", "bob"])("rejects deleting account %s", async (uid) => {
  records.set(`accountDeletions/${uid}`, {});
  await expect(block()).rejects.toMatchObject({ code: "failed-precondition" });
});
test("rejects a missing target", async () => {
  records.delete("users/bob");
  await expect(block()).rejects.toMatchObject({ code: "not-found" });
});
test("cleanup pages through all posts in both feeds, preserves other posts and canonical content", async () => {
  for (let index = 0; index < 405; index++) records.set(`userFeeds/alice/items/b${index}`, { actorUid: "bob" });
  await block();
  await removeBlockedFeedItems("alice", "bob", generation());
  expect([...records.keys()].filter((path) => path.startsWith("userFeeds/alice/items/b"))).toHaveLength(0);
  expect(records.has("userFeeds/bob/items/a1")).toBe(false);
  expect(records.has("userFeeds/alice/items/c1")).toBe(true);
  expect(records.has("feedItems/b1")).toBe(true);
});
test("failed cleanup retains the block and can be retried", async () => {
  await block();
  failQuery = true;
  await expect(handleUnblockUser("alice", { targetUid: "bob" })).rejects.toThrow("Temporary cleanup failure");
  expect(records.has("users/alice/blockedUsers/bob")).toBe(true);
  failQuery = false;
  await handleUnblockUser("alice", { targetUid: "bob" });
  expect(records.has("users/alice/blockedUsers/bob")).toBe(false);
  expect(records.has("userFeeds/alice/items/b1")).toBe(false);
  expect(records.has("users/alice/friends/bob")).toBe(false);
});
test("stale cleanup after unblock or reblock does not delete new posts", async () => {
  await block();
  const oldGeneration = generation();
  await handleUnblockUser("alice", { targetUid: "bob" });
  records.set("userFeeds/alice/items/new", { actorUid: "bob" });
  await removeBlockedFeedItems("alice", "bob", oldGeneration);
  expect(records.has("userFeeds/alice/items/new")).toBe(true);
  await block();
  await removeBlockedFeedItems("alice", "bob", oldGeneration);
  expect(records.has("userFeeds/alice/items/new")).toBe(true);
});
test("unblock is idempotent and does not remove the other user's block", async () => {
  await block();
  await handleBlockUser("bob", { targetUid: "alice" });
  await handleUnblockUser("alice", { targetUid: "bob" });
  await handleUnblockUser("alice", { targetUid: "bob" });
  expect(records.has("users/bob/blockedUsers/alice")).toBe(true);
  expect(await db.runTransaction((tx) => isBlockedBetween(tx, "alice", "bob"))).toBe(true);
});
test("blocked pairs cannot send or accept requests, find each other, or respect posts", async () => {
  await block();
  for (const [from, to] of [["alice", "bob"], ["bob", "alice"]]) {
    await expect(handleSendFriendRequest(from, to)).rejects.toMatchObject({ code: "permission-denied" });
  }
  records.set("friendRequests/bob_alice", { fromUid: "bob", toUid: "alice", status: "pending" });
  await expect(handleRespondToFriendRequest("alice", "bob_alice", "accepted")).rejects.toMatchObject({ code: "permission-denied" });
  await expect(handleSearchUserByUsername("alice", "bob")).resolves.toBeNull();
  await expect(handleRespectFeedPost("alice", "b1")).rejects.toMatchObject({ code: "permission-denied" });
});
test("fanout rechecks blocks even if friendship copies are stale", async () => {
  await block();
  records.set("users/bob/friends/alice", { uid: "alice" });
  await fanoutFeedItemToFriends("bob", { feedItemId: "new", actorUid: "bob" } as any);
  expect(records.has("userFeeds/alice/items/new")).toBe(false);
  expect(records.has("userFeeds/bob/items/new")).toBe(true);
});
test("fanout started before block rechecks the current friendship after unblock", async () => {
  const original = db.runTransaction as jest.Mock;
  const implementation = original.getMockImplementation()!;
  let first = true;
  original.mockImplementation(async (callback) => {
    if (first) {
      first = false;
      records.delete("users/bob/friends/alice");
    }
    return implementation(callback);
  });
  await fanoutFeedItemToFriends("bob", { feedItemId: "new", actorUid: "bob" } as any);
  expect(records.has("userFeeds/alice/items/new")).toBe(false);
});
test("new posts can be delivered after unblock and a new friendship", async () => {
  await block();
  await handleUnblockUser("alice", { targetUid: "bob" });
  records.set("users/bob/friends/alice", { uid: "alice" });
  await fanoutFeedItemToFriends("bob", { feedItemId: "new", actorUid: "bob" } as any);
  expect(records.has("userFeeds/alice/items/new")).toBe(true);
});
