/// <reference types="jest" />
import { Timestamp } from "firebase-admin/firestore";
import { handleCancelDeloadWeek } from "../../functions/user.js";
import { db } from "../../lib/firebaseAdmin.js";

jest.mock("../../lib/firebaseAdmin.js", () => ({
  db: { collection: jest.fn(), runTransaction: jest.fn() },
}));
jest.mock("../../firestore/user.js", () => ({}));
jest.mock("../../firestore/leaderboard.js", () => ({}));

describe("handleCancelDeloadWeek", () => {
  const now = Timestamp.fromDate(new Date("2026-10-05T08:00:00Z"));
  let user: { pendingDeloadWeekStartsAt?: Timestamp | null; lastDeloadWeekStartedAt: Timestamp };
  let exists: boolean;
  let tx: { get: jest.Mock; update: jest.Mock };

  beforeEach(() => {
    jest.spyOn(Timestamp, "now").mockReturnValue(now);
    exists = true;
    user = {
      pendingDeloadWeekStartsAt: Timestamp.fromMillis(now.toMillis() + 1),
      lastDeloadWeekStartedAt: Timestamp.fromMillis(0),
    };
    tx = {
      get: jest.fn(async () => ({ exists, data: () => user })),
      update: jest.fn((_ref, data) => Object.assign(user, data)),
    };
    (db.collection as jest.Mock).mockReturnValue({ doc: (uid: string) => `users/${uid}` });
    (db.runTransaction as jest.Mock).mockImplementation((callback) => callback(tx));
  });

  afterEach(() => jest.restoreAllMocks());

  test("cancels before the start boundary without changing the cooldown", async () => {
    expect((await handleCancelDeloadWeek("u1")).success).toBe(true);
    expect(user.pendingDeloadWeekStartsAt).toBeNull();
    expect(user.lastDeloadWeekStartedAt.toMillis()).toBe(0);
    expect(tx.update).toHaveBeenCalledWith("users/u1", {
      pendingDeloadWeekStartsAt: null, updatedAt: expect.anything(),
    });
  });

  test.each([0, -1, -60_000])("rejects cancellation at or after the start (%i ms)", async (offset) => {
    user.pendingDeloadWeekStartsAt = Timestamp.fromMillis(now.toMillis() + offset);
    expect((await handleCancelDeloadWeek("u1")).success).toBe(false);
    expect(tx.update).not.toHaveBeenCalled();
  });

  test.each([null, undefined])("rejects cancellation without a pending start (%s)", async (pending) => {
    user.pendingDeloadWeekStartsAt = pending;
    expect((await handleCancelDeloadWeek("u1")).success).toBe(false);
    expect(tx.update).not.toHaveBeenCalled();
  });

  test("repeated cancellation leaves user data unchanged", async () => {
    await handleCancelDeloadWeek("u1");
    tx.update.mockClear();
    expect((await handleCancelDeloadWeek("u1")).success).toBe(false);
    expect(tx.update).not.toHaveBeenCalled();
  });

  test("rejects a missing user", async () => {
    exists = false;
    await expect(handleCancelDeloadWeek("u1")).rejects.toMatchObject({ code: "not-found" });
    expect(tx.update).not.toHaveBeenCalled();
  });

  test("rechecks the boundary when Firestore retries the transaction", async () => {
    (db.runTransaction as jest.Mock).mockImplementation(async (callback) => {
      // Simulate a discarded first attempt without committing its writes.
      await callback({ ...tx, update: jest.fn() });
      jest.spyOn(Timestamp, "now").mockReturnValue(user.pendingDeloadWeekStartsAt!);
      return callback(tx);
    });
    expect((await handleCancelDeloadWeek("u1")).success).toBe(false);
    expect(tx.update).not.toHaveBeenCalled();
  });
});
