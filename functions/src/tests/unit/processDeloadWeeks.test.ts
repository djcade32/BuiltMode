/// <reference types="jest" />
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../../lib/firebaseAdmin.js";
import { processUserDeloadWeek } from "../../scheduled/processDeloadWeeks.js";

jest.mock("../../lib/firebaseAdmin.js", () => ({ db: { doc: jest.fn(), runTransaction: jest.fn() } }));
jest.mock("firebase-functions/v2/scheduler", () => ({ onSchedule: jest.fn() }));

const timestamp = (iso: string) => Timestamp.fromDate(new Date(iso));
const start = timestamp("2026-10-05T08:00:00Z");
const now = timestamp("2026-10-05T08:01:00Z");

describe("processUserDeloadWeek", () => {
  let documents: Record<string, any>;
  let tx: { get: jest.Mock; update: jest.Mock; create: jest.Mock };

  beforeEach(() => {
    documents = {
      "users/u1": {
        officialWeekStatus: "official",
        homeTimezone: "America/New_York",
        weeklyTargetDays: 5,
        pendingDeloadWeekStartsAt: start,
      },
      "userStats/u1": { modeScore: 42, currentWeekStreak: 3 },
      "userWeekAggregates/u1_2026-10-05": { isDeloadWeek: false, totalWorkouts: 2 },
    };
    tx = {
      get: jest.fn(async (path: string) => ({
        exists: !!documents[path], id: path.split("/").pop(), data: () => documents[path],
      })),
      update: jest.fn((path: string, data: object) => Object.assign(documents[path], data)),
      create: jest.fn((path: string, data: object) => { documents[path] = data; }),
    };
    (db.doc as jest.Mock).mockImplementation((path) => path);
    (db.runTransaction as jest.Mock).mockImplementation((callback) => callback(tx));
  });

  test("starts a due deload atomically and preserves existing workout data", async () => {
    expect(await processUserDeloadWeek("users/u1", "start", now)).toEqual({ status: "started" });
    expect(documents["userWeekAggregates/u1_2026-10-05"]).toMatchObject({
      isDeloadWeek: true, totalWorkouts: 2,
    });
    expect(documents["users/u1"]).toMatchObject({
      pendingDeloadWeekStartsAt: null, lastDeloadWeekStartedAt: start,
      deloadWeekEndsAt: timestamp("2026-10-12T08:00:00Z"),
    });
    tx.update.mockClear();
    expect(await processUserDeloadWeek("users/u1", "start", now)).toEqual({ status: "skipped" });
    expect(tx.update).not.toHaveBeenCalled();
  });

  test("waits until one minute after the boundary", async () => {
    expect(await processUserDeloadWeek("users/u1", "start", timestamp("2026-10-05T08:00:59Z")))
      .toEqual({ status: "skipped" });
    expect(tx.update).not.toHaveBeenCalled();
  });

  test("does not activate a Los Angeles user when New York becomes due", async () => {
    Object.assign(documents["users/u1"], {
      homeTimezone: "America/Los_Angeles",
      pendingDeloadWeekStartsAt: timestamp("2026-10-05T11:00:00Z"),
    });
    expect(await processUserDeloadWeek("users/u1", "start", now)).toEqual({ status: "skipped" });
    expect(await processUserDeloadWeek("users/u1", "start", timestamp("2026-10-05T11:01:00Z")))
      .toEqual({ status: "started" });
  });

  test("creates a complete aggregate if the hourly job has not created it", async () => {
    delete documents["userWeekAggregates/u1_2026-10-05"];
    await processUserDeloadWeek("users/u1", "start", now);
    expect(tx.create).toHaveBeenCalledTimes(1);
    expect(documents["userWeekAggregates/u1_2026-10-05"]).toMatchObject({
      isDeloadWeek: true, totalWorkouts: 0, modeScore: 42, streakWeeks: 3, finalizedAt: null,
    });
  });

  test("keeps the pending start when required stats are missing", async () => {
    delete documents["userWeekAggregates/u1_2026-10-05"];
    delete documents["userStats/u1"];
    expect(await processUserDeloadWeek("users/u1", "start", now))
      .toEqual({ status: "skipped", reason: "user_stats_not_found" });
    expect(tx.update).not.toHaveBeenCalled();
  });

  test("ends the deload on the new aggregate without changing historical deload status", async () => {
    await processUserDeloadWeek("users/u1", "start", now);
    expect(await processUserDeloadWeek("users/u1", "end", timestamp("2026-10-12T08:01:00Z")))
      .toEqual({ status: "ended" });
    expect(documents["userWeekAggregates/u1_2026-10-05"].isDeloadWeek).toBe(true);
    expect(documents["userWeekAggregates/u1_2026-10-12"].isDeloadWeek).toBe(false);
    expect(documents["users/u1"].deloadWeekEndsAt).toBeNull();
    tx.update.mockClear();
    expect(await processUserDeloadWeek("users/u1", "end", timestamp("2026-10-12T08:02:00Z")))
      .toEqual({ status: "skipped" });
    expect(tx.update).not.toHaveBeenCalled();
  });

  test("does not shift an expired pending deload into a later week", async () => {
    expect(await processUserDeloadWeek("users/u1", "start", timestamp("2026-10-12T08:01:00Z")))
      .toEqual({ status: "expired", reason: "scheduled_week_has_passed" });
    expect(documents["users/u1"].pendingDeloadWeekStartsAt).toBeNull();
    expect(tx.create).not.toHaveBeenCalled();
  });
});
