/// <reference types="jest" />
import { Timestamp } from "firebase-admin/firestore";
import { handleAcceptTerms } from "../../functions/legal.js";
import { db } from "../../lib/firebaseAdmin.js";

jest.mock("@builtmode/shared/schemas/legal", () => jest.requireActual("../../../../packages/shared/src/schemas/legal.ts"));
jest.mock("../../lib/firebaseAdmin.js", () => ({ db: { doc: jest.fn(), runTransaction: jest.fn() } }));
let records: Map<string, any>;
let write: jest.Mock;
const now = Timestamp.fromDate(new Date("2026-11-12T15:00:00Z"));
const input = { accepted: true, termsVersion: "2026-11-12" };
beforeEach(() => {
  jest.clearAllMocks();
  records = new Map();
  jest.spyOn(Timestamp, "now").mockReturnValue(now);
  (db.doc as jest.Mock).mockImplementation((path) => path);
  write = jest.fn((path, data) => records.set(path, data));
  (db.runTransaction as jest.Mock).mockImplementation((callback) => callback({
    get: async (path: string) => ({ exists: records.has(path), get: (field: string) => records.get(path)?.[field] }),
    set: write,
  }));
});
afterEach(() => jest.restoreAllMocks());
test("records server time for the authenticated account before its profile exists", async () => {
  await expect(handleAcceptTerms("alice", input)).resolves.toEqual({ termsVersion: input.termsVersion });
  expect(records.get("users/alice/legalAcceptance/terms")).toEqual({ termsVersion: input.termsVersion, acceptedAt: now });
  expect(records.has("users/alice")).toBe(false);
});
test("requires authentication", async () => {
  await expect(handleAcceptTerms(undefined, input)).rejects.toMatchObject({ code: "unauthenticated" });
  expect(write).not.toHaveBeenCalled();
});
test.each([undefined, {}, { accepted: false, termsVersion: "2026-11-12" }, { accepted: true, termsVersion: "2026-10-03" }, { ...input, uid: "bob" }, { ...input, acceptedAt: 1 }])("rejects missing, outdated, or forged consent %p", async (value) => {
  await expect(handleAcceptTerms("alice", value)).rejects.toMatchObject({ code: "invalid-argument" });
  expect(write).not.toHaveBeenCalled();
});
test("retries preserve the original acceptance timestamp", async () => {
  await handleAcceptTerms("alice", input);
  jest.spyOn(Timestamp, "now").mockReturnValue(Timestamp.fromMillis(now.toMillis() + 1000));
  await handleAcceptTerms("alice", input);
  expect(write).toHaveBeenCalledTimes(1);
  expect(records.get("users/alice/legalAcceptance/terms").acceptedAt).toEqual(now);
});
test("accepting a revised version replaces the previous version and timestamp", async () => {
  records.set("users/alice/legalAcceptance/terms", { termsVersion: "2026-10-03", acceptedAt: Timestamp.fromMillis(1) });
  await handleAcceptTerms("alice", input);
  expect(records.get("users/alice/legalAcceptance/terms")).toEqual({ termsVersion: "2026-11-12", acceptedAt: now });
});
test("deleting accounts cannot save acceptance", async () => {
  records.set("accountDeletions/alice", {});
  await expect(handleAcceptTerms("alice", input)).rejects.toMatchObject({ code: "failed-precondition" });
  expect(write).not.toHaveBeenCalled();
});
test("database errors propagate rather than returning success", async () => {
  (db.runTransaction as jest.Mock).mockRejectedValue(new Error("Unavailable"));
  await expect(handleAcceptTerms("alice", input)).rejects.toThrow("Unavailable");
});
