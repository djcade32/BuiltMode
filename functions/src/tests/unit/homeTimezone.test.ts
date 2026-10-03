/// <reference types="jest" />
import { Timestamp } from "firebase-admin/firestore";
import { handleUpdateHomeTimezone } from "../../functions/homeTimezone.js";
import { handleCompleteWorkout } from "../../functions/workout.js";
import { CompleteWorkoutRequest } from "@builtmode/shared/types/workout";
import { handleStartDeloadWeek } from "../../functions/user.js";
import { processUserDeloadWeek } from "../../scheduled/processDeloadWeeks.js";
import { db } from "../../lib/firebaseAdmin.js";
import { processUserHomeTimezone } from "../../scheduled/changeUsersHomeTimezone.js";
import { UserDoc } from "../../types/user.js";
import { getHomeTimezoneChangeSchedule } from "../../utils/homeTimezoneChange.js";

jest.mock("../../lib/firebaseAdmin.js", () => ({ db: { doc: jest.fn(), collection: jest.fn(), runTransaction: jest.fn() } }));
jest.mock("../../functions/social.js", () => ({}));
jest.mock("firebase-functions/v2/scheduler", () => ({ onSchedule: jest.fn() }));
const timestamp = (iso: string) => Timestamp.fromDate(new Date(iso));
const requestTime = timestamp("2026-10-03T12:00:00Z");
const switchTime = timestamp("2026-10-05T11:01:00Z");
const oldZone = "America/New_York";
const newZone = "America/Los_Angeles";

const user = (overrides = {}) => ({
  homeTimezone: oldZone, officialWeekStatus: "official", weeklyTargetDays: 5,
  currentWeekId: "2026-09-28", ...overrides,
} as UserDoc);

describe("timezone change scheduling", () => {
  test.each([
    [oldZone, newZone, "2026-10-05T11:00:00.000Z"],
    [newZone, oldZone, "2026-10-05T11:00:00.000Z"],
    ["Pacific/Kiritimati", "Pacific/Honolulu", "2026-10-05T14:00:00.000Z"],
    [oldZone, "Asia/Kathmandu", "2026-10-05T08:00:00.000Z"],
  ])("waits for both weekly resets from %s to %s", (from, to, expected) => {
    const pending = getHomeTimezoneChangeSchedule(user({ homeTimezone: from }), to, requestTime.toDate());
    expect(pending.pendingHomeTimezoneWeekId).toBe("2026-10-05");
    expect(pending.pendingHomeTimezoneStartsAt.toDate().toISOString()).toBe(expected);
  });

  test("resolves DST for the effective Monday", () => {
    const pending = getHomeTimezoneChangeSchedule(user(), newZone, new Date("2026-10-30T12:00:00Z"));
    expect(pending.pendingHomeTimezoneStartsAt.toDate().toISOString()).toBe("2026-11-02T12:00:00.000Z");
  });

  test("waits until a pending deload has finished", () => {
    const pending = getHomeTimezoneChangeSchedule(user({ pendingDeloadWeekStartsAt: timestamp("2026-10-05T08:00:00Z") }), newZone, requestTime.toDate());
    expect(pending.pendingHomeTimezoneWeekId).toBe("2026-10-12");
    expect(pending.pendingHomeTimezoneStartsAt.toDate().toISOString()).toBe("2026-10-12T11:00:00.000Z");
  });

  test("waits until an active deload has finished", () => {
    const pending = getHomeTimezoneChangeSchedule(user({ deloadWeekEndsAt: timestamp("2026-10-12T08:00:00Z") }), newZone, requestTime.toDate());
    expect(pending.pendingHomeTimezoneWeekId).toBe("2026-10-12");
  });
});

describe("timezone change transactions", () => {
  let documents: Record<string, any>;
  let tx: { get: jest.Mock; update: jest.Mock; set: jest.Mock };
  beforeEach(() => {
    jest.spyOn(Timestamp, "now").mockReturnValue(requestTime);
    documents = {
      "users/u1": user(),
      "userWeekAggregates/u1_2026-09-28": { finalizedAt: requestTime, totalWorkouts: 4, isDeloadWeek: true },
      "userWeekAggregates/u1_2026-10-05": { finalizedAt: null, totalWorkouts: 1, weekStartAt: timestamp("2026-10-05T08:00:00Z") },
      "workouts/w1": { workoutTimezone: oldZone, weekId: "2026-09-28" },
    };
    tx = {
      get: jest.fn(async (path: string) => ({ exists: !!documents[path], id: path.split("/").pop(), data: () => documents[path], get: (field: string) => documents[path]?.[field] })),
      update: jest.fn((path: string, patch: object) => Object.assign(documents[path], patch)),
      set: jest.fn((path: string, value: object) => { documents[path] = value; }),
    };
    (db.doc as jest.Mock).mockImplementation((path) => path);
    (db.collection as jest.Mock).mockImplementation((path: string) => ({ doc: (id: string) => `${path}/${id}` }));
    (db.runTransaction as jest.Mock).mockImplementation((callback) => callback(tx));
  });
  afterEach(() => jest.restoreAllMocks());

  const schedule = () => handleUpdateHomeTimezone("u1", newZone);

  test("saves only a pending request, and duplicate requests retain their date", async () => {
    const first = await schedule();
    expect(first).toMatchObject({ homeTimezone: newZone, effectiveWeekId: "2026-10-05" });
    expect(documents["users/u1"].homeTimezone).toBe(oldZone);
    tx.update.mockClear();
    expect(await schedule()).toEqual(first);
    expect(tx.update).not.toHaveBeenCalled();
  });

  test("selecting the active timezone cancels the request", async () => {
    await schedule();
    expect(await handleUpdateHomeTimezone("u1", oldZone)).toMatchObject({ effectiveAt: null });
    expect(documents["users/u1"]).toMatchObject({ homeTimezone: oldZone, pendingHomeTimezone: null });
  });

  test("rejects invalid timezones and deleting accounts", async () => {
    await expect(handleUpdateHomeTimezone("u1", "Not/AZone")).rejects.toMatchObject({ code: "invalid-argument" });
    documents["accountDeletions/u1"] = {};
    await expect(schedule()).rejects.toMatchObject({ code: "failed-precondition" });
    expect(tx.update).not.toHaveBeenCalled();
  });

  test("does not apply before the later boundary", async () => {
    await schedule();
    expect(await processUserHomeTimezone("users/u1", timestamp("2026-10-05T08:01:00Z"))).toBe("skipped");
    expect(documents["users/u1"].homeTimezone).toBe(oldZone);
  });

  test("preserves workout history, finalized weeks, and new-week progress; retries are harmless", async () => {
    await schedule();
    const history = { ...documents["userWeekAggregates/u1_2026-09-28"] };
    tx.update.mockClear();
    expect(await processUserHomeTimezone("users/u1", switchTime)).toBe("updated");
    expect(documents["users/u1"]).toMatchObject({ homeTimezone: newZone, pendingHomeTimezone: null, currentWeekId: "2026-10-05" });
    expect(documents["userWeekAggregates/u1_2026-10-05"]).toMatchObject({ totalWorkouts: 1, weekEndAt: timestamp("2026-10-12T11:00:00Z"), weekStartAt: timestamp("2026-10-05T08:00:00Z") });
    expect(documents["userWeekAggregates/u1_2026-09-28"]).toEqual(history);
    expect(documents["workouts/w1"]).toEqual({ workoutTimezone: oldZone, weekId: "2026-09-28" });
    tx.update.mockClear();
    expect(await processUserHomeTimezone("users/u1", switchTime)).toBe("skipped");
    expect(tx.update).not.toHaveBeenCalled();
  });

  test.each([
    { pendingDeloadWeekStartsAt: timestamp("2026-10-05T08:00:00Z") },
    { deloadWeekEndsAt: timestamp("2026-10-05T08:00:00Z") },
    { pendingWeeklyTargetStartsAt: timestamp("2026-10-05T08:00:00Z") },
    { officialWeekStatus: "practice" },
  ])("waits for existing transitions regardless of job order: %o", async (fields) => {
    await schedule();
    Object.assign(documents["users/u1"], fields);
    expect(await processUserHomeTimezone("users/u1", switchTime)).toBe("skipped");
    expect(documents["users/u1"].homeTimezone).toBe(oldZone);
  });

  test("rebases a future weekly target without changing the target itself", async () => {
    await schedule();
    Object.assign(documents["users/u1"], { pendingWeeklyTargetDays: 3, pendingWeeklyTargetStartsAt: timestamp("2026-10-12T08:00:00Z") });
    await processUserHomeTimezone("users/u1", switchTime);
    expect(documents["users/u1"]).toMatchObject({ pendingWeeklyTargetDays: 3, pendingWeeklyTargetStartsAt: timestamp("2026-10-12T11:00:00Z") });
  });

  test("defers a missed week and never switches into a finalized week", async () => {
    await schedule();
    documents["userWeekAggregates/u1_2026-10-05"].finalizedAt = requestTime;
    expect(await processUserHomeTimezone("users/u1", switchTime)).toBe("deferred");
    expect(documents["users/u1"].pendingHomeTimezoneWeekId).toBe("2026-10-12");
    expect(await processUserHomeTimezone("users/u1", timestamp("2026-10-20T12:00:00Z"))).toBe("deferred");
    expect(documents["users/u1"].homeTimezone).toBe(oldZone);
    expect(documents["users/u1"].pendingHomeTimezoneWeekId).toBe("2026-10-26");
  });


  test("a deload requested later postpones the timezone change until after recovery", async () => {
    jest.useFakeTimers().setSystemTime(requestTime.toDate());
    try {
      await schedule();
      await handleStartDeloadWeek("u1");
      expect(documents["users/u1"].pendingHomeTimezoneWeekId).toBe("2026-10-12");
      expect(await processUserDeloadWeek("users/u1", "start", timestamp("2026-10-05T08:01:00Z"))).toEqual({ status: "started" });
      expect(await processUserHomeTimezone("users/u1", switchTime)).toBe("skipped");
      documents["userWeekAggregates/u1_2026-10-12"] = { finalizedAt: null, totalWorkouts: 0 };
      expect(await processUserDeloadWeek("users/u1", "end", timestamp("2026-10-12T08:01:00Z"))).toEqual({ status: "ended" });
      expect(await processUserHomeTimezone("users/u1", timestamp("2026-10-12T11:01:00Z"))).toBe("updated");
      expect(documents["userWeekAggregates/u1_2026-10-05"].isDeloadWeek).toBe(true);
      expect(documents["userWeekAggregates/u1_2026-10-12"].isDeloadWeek).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  test("a deload worker with a pre-switch clock cannot change a previous week", async () => {
    documents["users/u1"].homeTimezoneUpdatedAt = switchTime;
    tx.update.mockClear();
    expect(await processUserDeloadWeek("users/u1", "end", timestamp("2026-10-05T08:01:00Z")))
      .toEqual({ status: "skipped", reason: "timezone_changed_during_run" });
    expect(tx.update).not.toHaveBeenCalled();
  });


  test("workout completion cannot reopen a finalized week", async () => {
    documents["userStats/u1"] = {};
    await expect(handleCompleteWorkout("u1", { sessionId: "w2" } as CompleteWorkoutRequest))
      .rejects.toMatchObject({ code: "failed-precondition" });
    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.set).not.toHaveBeenCalled();
    expect(documents["userWeekAggregates/u1_2026-09-28"].totalWorkouts).toBe(4);
  });

  test("lets the aggregate job create a missing current week", async () => {
    await schedule();
    delete documents["userWeekAggregates/u1_2026-10-05"];
    expect(await processUserHomeTimezone("users/u1", switchTime)).toBe("updated");
    expect(documents["users/u1"].lastEnsuredWeekId).toBeNull();
  });

  test("skips deleted users and account deletions", async () => {
    expect(await processUserHomeTimezone("users/missing", switchTime)).toBe("skipped");
    await schedule();
    documents["accountDeletions/u1"] = {};
    expect(await processUserHomeTimezone("users/u1", switchTime)).toBe("skipped");
  });
});
