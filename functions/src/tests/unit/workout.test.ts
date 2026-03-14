import { calculateModeScore, getLast30DayDateKeys } from "../../firestore/workout.js";
import { ModeScoreInput } from "../../types/workout.js";

describe("calculateModeScore", () => {
  test("returns proper metrics and mode score calculations", () => {
    const input: ModeScoreInput = {
      weeklyAdherenceStreak: 0,
      completedWorkoutsThisWeek: 2,
      completedWorkoutsLast30Days: 1,
      weeklyTarget: 4,
    };
    const metrics = calculateModeScore(input);
    expect(metrics).toMatchObject({
      modeScore: 16,
      streakScore: 0,
      weeklyAdherenceRateScore: 50,
      activity30DayScore: 3,
      activeDaysLast30: 1,
    });
  });
});

describe("returns the previous 30 local date keys including today", () => {
  test("returns proper metrics and mode score calculations", () => {
    const localDateKey = "2026-03-12";
    const last30DateKeys = getLast30DayDateKeys(localDateKey);
    const expected = new Set([
      "2026-03-12",
      "2026-03-11",
      "2026-03-10",
      "2026-03-09",
      "2026-03-08",
      "2026-03-07",
      "2026-03-06",
      "2026-03-05",
      "2026-03-04",
      "2026-03-03",
      "2026-03-02",
      "2026-03-01",
      "2026-02-28",
      "2026-02-27",
      "2026-02-26",
      "2026-02-25",
      "2026-02-24",
      "2026-02-23",
      "2026-02-22",
      "2026-02-21",
      "2026-02-20",
      "2026-02-19",
      "2026-02-18",
      "2026-02-17",
      "2026-02-16",
      "2026-02-15",
      "2026-02-14",
      "2026-02-13",
      "2026-02-12",
      "2026-02-11",
    ]);
    expect(last30DateKeys).toEqual(expected);
  });
});
