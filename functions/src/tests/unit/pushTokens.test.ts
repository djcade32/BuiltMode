/// <reference types="jest" />
import { Timestamp } from "firebase-admin/firestore";
import { handleRegisterPushToken, handleUnregisterPushToken } from "../../functions/pushTokens.js";
import { db } from "../../lib/firebaseAdmin.js";

jest.mock("../../lib/firebaseAdmin.js", () => ({ db: { doc: jest.fn(), runTransaction: jest.fn() } }));
jest.mock("firebase-functions/v2/https", () => {
  const actual = jest.requireActual("firebase-functions/v2/https");
  return { ...actual, onCall: (handler: unknown) => handler };
});

const token = "example_fcm_device_token:123456789";
const globalPath = `pushTokens/${token}`;
const userPath = (uid: string) => `users/${uid}/pushTokens/${token}`;
let documents: Record<string, Record<string, any>>;
let tx: { get: jest.Mock; set: jest.Mock; update: jest.Mock; delete: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();
  documents = {};
  tx = {
    get: jest.fn(async (path: string) => ({ exists: !!documents[path], data: () => documents[path] })),
    set: jest.fn((path, data) => { documents[path] = data; }),
    update: jest.fn((path, data) => Object.assign(documents[path], data)),
    delete: jest.fn((path) => { delete documents[path]; }),
  };
  (db.doc as jest.Mock).mockImplementation((path) => path);
  (db.runTransaction as jest.Mock).mockImplementation((callback) => callback(tx));
});

const register = (uid = "alice") => handleRegisterPushToken(uid, { token, platform: "ios" });

test("registration creates both token records for the authenticated account", async () => {
  expect(await register()).toEqual({ success: true });
  expect(documents[globalPath]).toMatchObject({ uid: "alice", token, tokenId: token, platform: "ios", enabled: true });
  expect(documents[userPath("alice")]).toEqual(documents[globalPath]);
});

test("re-registration preserves creation timestamps and updates the platform", async () => {
  const createdAt = Timestamp.fromMillis(1000);
  documents[globalPath] = { uid: "alice", createdAt };
  documents[userPath("alice")] = { uid: "alice", createdAt };
  await handleRegisterPushToken("alice", { token, platform: "android" });
  expect(documents[globalPath]).toMatchObject({ uid: "alice", createdAt, platform: "android" });
  expect(documents[userPath("alice")].createdAt).toBe(createdAt);
});

test("switching accounts removes the previous user's token atomically", async () => {
  await register();
  await register("bob");
  expect(documents[userPath("alice")]).toBeUndefined();
  expect(documents[globalPath].uid).toBe("bob");
  expect(documents[userPath("bob")]).toMatchObject({ uid: "bob", enabled: true });
});

test("logout disables the current assignment and is idempotent", async () => {
  await register();
  await handleUnregisterPushToken("alice", { token });
  expect(documents[userPath("alice")]).toBeUndefined();
  expect(documents[globalPath]).toMatchObject({ uid: null, lastUid: "alice", enabled: false });
  expect(await handleUnregisterPushToken("alice", { token })).toEqual({ success: true });
});

test("a delayed or unrelated logout cannot disable another user's registration", async () => {
  await register("bob");
  await handleUnregisterPushToken("alice", { token });
  expect(documents[globalPath]).toMatchObject({ uid: "bob", enabled: true });
  expect(documents[userPath("bob")]).toBeDefined();
});

test("unregistering a missing token does not create a global record", async () => {
  await handleUnregisterPushToken("alice", { token });
  expect(documents[globalPath]).toBeUndefined();
  expect(tx.set).not.toHaveBeenCalled();
});

test("unauthenticated callers cannot register or unregister", async () => {
  await expect(handleRegisterPushToken(undefined, { token, platform: "ios" })).rejects.toMatchObject({ code: "unauthenticated" });
  await expect(handleUnregisterPushToken(undefined, { token })).rejects.toMatchObject({ code: "unauthenticated" });
  expect(db.runTransaction).not.toHaveBeenCalled();
});

test.each([
  undefined, null, [], {}, { token: "short", platform: "ios" }, { token: "x".repeat(1401), platform: "ios" },
  { token: "../users/alice/private", platform: "ios" }, { token: token + "\n", platform: "ios" },
  { token, platform: "desktop" }, { token }, { token, platform: "ios", uid: "bob" },
  { token, platform: "ios", previousUid: "bob" },
])("invalid registration payload is rejected: %p", async (data) => {
  await expect(handleRegisterPushToken("alice", data)).rejects.toMatchObject({ code: "invalid-argument" });
  expect(db.runTransaction).not.toHaveBeenCalled();
});

test("accounts being deleted cannot register or unregister tokens", async () => {
  documents["accountDeletions/alice"] = { uid: "alice" };
  await expect(register()).rejects.toMatchObject({ code: "failed-precondition" });
  await expect(handleUnregisterPushToken("alice", { token })).rejects.toMatchObject({ code: "failed-precondition" });
  expect(tx.set).not.toHaveBeenCalled();
  expect(tx.delete).not.toHaveBeenCalled();
});

test("token registration does not overwrite unrelated tokens", async () => {
  documents["pushTokens/another-token"] = { uid: "bob", enabled: true };
  await register();
  expect(documents["pushTokens/another-token"]).toEqual({ uid: "bob", enabled: true });
});
