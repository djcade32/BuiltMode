/// <reference types="jest" />
import { Timestamp } from "firebase-admin/firestore";
import { deleteAccountData, processAccountDeletion, validateDeletionRequest } from "../../functions/deleteAccount.js";
import { auth, db } from "../../lib/firebaseAdmin.js";
import { getStorage } from "firebase-admin/storage";
import { assertAccountActive } from "../../services/accountDeletionGuard.js";

jest.mock("../../lib/firebaseAdmin.js", () => ({
  db: { doc: jest.fn(), collection: jest.fn(), collectionGroup: jest.fn(), recursiveDelete: jest.fn(), runTransaction: jest.fn() },
  auth: { updateUser: jest.fn(), revokeRefreshTokens: jest.fn(), deleteUser: jest.fn() },
}));
jest.mock("firebase-admin/storage", () => ({ getStorage: jest.fn() }));
jest.mock("firebase-functions/v2/scheduler", () => ({ onSchedule: jest.fn() }));

// Small in-memory adapter exercises the real cleanup orchestration and queries.
// It deliberately includes missing parents and records owned by another account.
describe("account deletion", () => {
  let records: Map<string, any>;
  let photos: Set<string>;
  let failStorage: boolean;
  const value = (data: any, field: string) => field.split(".").reduce((v, key) => v?.[key], data);
  const ref = (path: string): any => ({
    path, id: path.split("/").pop(),
    parent: { parent: path.split("/").length > 2 ? ref(path.split("/").slice(0, -2).join("/")) : null },
    get: async () => snapshot(path),
    update: async (data: object) => records.set(path, { ...records.get(path), ...data }),
    set: async (data: object) => records.set(path, data),
    delete: async () => { records.delete(path); },
  });
  const snapshot = (path: string): any => ({
    id: path.split("/").pop(), ref: ref(path), exists: records.has(path),
    data: () => records.get(path), get: (key: string) => value(records.get(path), key),
  });
  const query = (name: string, group = false, filters: ((path: string) => boolean)[] = [], limit = Infinity): any => ({
    where: (field: string, _op: string, expected: unknown) => query(name, group, [...filters, (path) => value(records.get(path), field) === expected], limit),
    orderBy: () => query(name, group, filters, limit),
    startAt: (start: string) => query(name, group, [...filters, (path) => ref(path).id >= start], limit),
    endBefore: (end: string) => query(name, group, [...filters, (path) => ref(path).id < end], limit),
    startAfter: (last: any) => query(name, group, [...filters, (path) => path > last.ref.path], limit),
    limit: (size: number) => query(name, group, filters, size),
    get: async () => {
      const docs = [...records.keys()].sort().filter((path) => {
        const parts = path.split("/");
        return (group ? parts.at(-2) === name : parts.slice(0, -1).join("/") === name) && filters.every((filter) => filter(path));
      }).slice(0, limit).map(snapshot);
      return { docs, empty: !docs.length };
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    failStorage = false;
    records = new Map([
      ["users/alice", { uid: "alice" }], ["users/bob", { uid: "bob" }],
      ["users/alice/friends/bob", { uid: "bob" }], ["users/bob/friends/alice", { uid: "alice" }],
      ["users/bob/friends/carol", { uid: "carol" }],
      ["friendRequests/incoming", { fromUid: "bob", toUid: "alice" }],
      ["friendRequests/outgoing", { fromUid: "alice", toUid: "bob" }],
      ["friendRequests/other", { fromUid: "bob", toUid: "carol" }],
      ["userWeekDays/alice_2026-10-05/days/2026-10-06", { uid: "alice" }],
      ["userWeekDays/alice_other_2026-10-05", { uid: "alice_other" }],
      ["feedItems/own", { actorUid: "alice", respectCount: 1 }],
      ["feedItems/own/respects/bob", { actorUid: "bob" }],
      ["feedItems/other", { actorUid: "bob", respectCount: 2 }],
      ["feedItems/other/respects/alice", { actorUid: "alice" }],
      ["feedItems/other/respects/carol", { actorUid: "carol" }],
      ["userFeeds/bob/items/own", { actorUid: "alice" }],
      ["userFeeds/alice/items/other", { actorUid: "bob" }],
      ["users/alice/pushTokens/token", { uid: "alice" }],
      ["users/bob/notifications/n1", { data: { fromUid: "alice" } }],
      ["users/bob/notifications/n2", { data: { fromUid: "carol" } }],
      ["workouts/session1", { uid: "alice" }], ["workouts/session2", { uid: "bob" }],
    ]);
    for (const name of ["templates", "userMonthAggregates", "userWeekAggregates", "usernames", "pushTokens"]) {
      records.set(`${name}/alice-record`, { uid: "alice" });
      records.set(`${name}/bob-record`, { uid: "bob" });
    }
    for (const name of ["userStats", "publicProfiles", "leaderboardEntries"]) records.set(`${name}/alice`, { uid: "alice" });
    photos = new Set(["workouts/alice_session1", "workouts/bob_session2", "workouts/alice_other_session3", "user-avatars/alice", "user-avatars/bob"]);
    (db.doc as jest.Mock).mockImplementation(ref);
    (db.collection as jest.Mock).mockImplementation((name) => query(name));
    (db.collectionGroup as jest.Mock).mockImplementation((name) => query(name, true));
    (db.recursiveDelete as jest.Mock).mockImplementation(async ({ path }) => {
      for (const key of records.keys()) if (key === path || key.startsWith(path + "/")) records.delete(key);
    });
    (db.runTransaction as jest.Mock).mockImplementation(async (callback) => callback({
      get: async (reference: any) => snapshot(reference.path),
      update: (reference: any, data: object) => records.set(reference.path, { ...records.get(reference.path), ...data }),
      delete: (reference: any) => records.delete(reference.path),
      create: (reference: any, data: object) => records.set(reference.path, data),
    }));
    (getStorage as jest.Mock).mockReturnValue({ bucket: () => ({ file: (path: string) => ({ delete: async () => {
      if (failStorage) throw new Error("Storage unavailable");
      photos.delete(path);
    } }) }) });
  });

  test("removes owned and cross-user records, nested orphans and photos while preserving other accounts", async () => {
    await deleteAccountData("alice");
    expect(records.has("users/alice")).toBe(false);
    expect([...records.keys()].some((path) => !path.startsWith("accountDeletions/") && path.includes("/alice") && !path.includes("alice_other"))).toBe(false);
    expect(records.has("userFeeds/bob/items/own")).toBe(false);
    expect(records.has("feedItems/own/respects/bob")).toBe(false);
    expect(records.get("feedItems/other").respectCount).toBe(1);
    expect(records.has("users/bob/friends/carol")).toBe(true);
    expect(records.has("friendRequests/other")).toBe(true);
    expect(records.has("users/bob/notifications/n2")).toBe(true);
    expect(records.has("userWeekDays/alice_other_2026-10-05")).toBe(true);
    expect(photos).toEqual(new Set(["workouts/bob_session2", "workouts/alice_other_session3", "user-avatars/bob"]));
    await deleteAccountData("alice");
    expect(records.get("feedItems/other").respectCount).toBe(1);
    photos.add("workouts/alice_session1");
    await deleteAccountData("alice");
    expect(photos.has("workouts/alice_session1")).toBe(false);
  });

  test("paginates beyond a single batch", async () => {
    for (let i = 0; i < 205; i++) records.set(`templates/t${i}`, { uid: "alice" });
    await deleteAccountData("alice");
    expect([...records.keys()].filter((key) => key.startsWith("templates/"))).toEqual(["templates/bob-record"]);
  });

  test("retries partial cleanup and deletes Authentication only after data cleanup succeeds", async () => {
    records.set("accountDeletions/alice", { status: "pending", nextAttemptAt: Timestamp.now() });
    failStorage = true;
    expect(await processAccountDeletion("alice")).toBe(false);
    expect(auth.deleteUser).not.toHaveBeenCalled();
    expect(records.has("workouts/session1")).toBe(true);
    failStorage = false;
    (auth.deleteUser as jest.Mock).mockImplementation(async () => expect(records.has("users/alice")).toBe(false));
    expect(await processAccountDeletion("alice")).toBe(true);
    expect(auth.deleteUser).toHaveBeenCalledWith("alice");
    expect(records.get("accountDeletions/alice").status).toBe("completed");
    expect(records.get("feedItems/other").respectCount).toBe(1);
  });

  test("does not overlap an existing deletion worker", async () => {
    records.set("accountDeletions/alice", { status: "pending", leaseUntil: Timestamp.fromMillis(Date.now() + 60000) });
    expect(await processAccountDeletion("alice")).toBe(false);
    expect(auth.deleteUser).not.toHaveBeenCalled();
  });

  test("blocks activity after deletion is requested", async () => {
    records.set("accountDeletions/alice", { status: "pending" });
    await expect(assertAccountActive("alice")).rejects.toMatchObject({ code: "failed-precondition" });
    await expect(assertAccountActive("bob")).resolves.toBeUndefined();
  });

  test("requires authentication, explicit confirmation and recent sign-in; ignores supplied UID", () => {
    const request: any = { auth: { uid: "alice", token: { auth_time: Date.now() / 1000 } }, data: { confirmation: "DELETE", uid: "bob" } };
    expect(validateDeletionRequest(request)).toBe("alice");
    expect(() => validateDeletionRequest({ ...request, auth: undefined })).toThrow();
    expect(() => validateDeletionRequest({ ...request, data: {} })).toThrow();
    request.auth.token.auth_time -= 301;
    expect(() => validateDeletionRequest(request)).toThrow();
  });
});
