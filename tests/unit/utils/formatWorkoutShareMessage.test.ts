import { formatWorkoutShareMessage } from "@/lib/utils/formatWorkoutShareMessage";
import type { Exercise } from "@/packages/shared/src/types/workout";
const exercise = (values: Partial<Exercise> = {}): Exercise => ({ id: "e1", name: "Bench Press", metricType: "weight_reps", units: "lbs", sets: [{ id: "s1", reps: 10, weight: 135 }], ...values });
const format = (exercises: Exercise[]) => formatWorkoutShareMessage({ name: "Upper Body", durationSeconds: 2700, exercises });
test("formats a complete message and groups matching sets", () => {
  const item = exercise();
  item.sets = [1, 2, 3].map((id) => ({ id: String(id), reps: 10, weight: 135 }));
  expect(format([item])).toBe("Check out this workout I just completed! 💪\n\nUpper Body — 45 min\nBench Press: 3 sets × 10 reps at 135 lbs\n\nLogged with BuiltMode");
});
test("different sets retain their individual values", () => {
  const text = format([exercise({ units: "kg", sets: [{ id: "1", reps: 10, weight: 50 }, { id: "2", reps: 8, weight: 55 }] })]);
  expect(text).toContain("Set 1: 10 reps at 50 kg\n  Set 2: 8 reps at 55 kg");
});
test("uses legacy set units when exercise units are absent", () => {
  expect(format([exercise({ units: null, sets: [{ id: "1", reps: 5, weight: 80, weightUnit: "kg" }] })])).toContain("80 kg");
});
test.each(["mi", "km", "m", "yd"] as const)("formats distance in %s without conversion", (units) => {
  expect(format([exercise({ metricType: "distance", units, sets: [{ id: "1", distanceMiles: 5, durationSec: 1800 }] })])).toContain(`5 ${units} in 30 min`);
});
test("formats reps, duration, time, calories, and zero values", () => {
  expect(format([
    exercise({ name: "Pull-ups", metricType: "reps_only", units: null, sets: [{ id: "1", reps: 8 }] }),
    exercise({ name: "Plank", metricType: "duration", units: null, sets: [{ id: "1", durationSec: 90 }] }),
    exercise({ name: "Sprint", metricType: "time", units: null, sets: [{ id: "1", timeSeconds: 42 }] }),
    exercise({ name: "Row", metricType: "calories", units: null, sets: [{ id: "1", calories: 25 }] }),
    exercise({ sets: [{ id: "1", reps: 1, weight: 0 }] }),
  ])).toEqual(expect.stringContaining("Pull-ups: 1 set × 8 reps\nPlank: 1 set × 1 min 30 sec\nSprint: 1 set × 42 sec\nRow: 1 set × 25 cal\nBench Press: 1 set × 1 rep at 0 lbs"));
});
test("omits personal notes and handles missing details without inventing values", () => {
  const text = format([exercise({ notes: "Private injury details", sets: [{ id: "1" }] }), exercise({ name: "Empty", sets: [] })]);
  expect(text).not.toContain("Private injury");
  expect(text).not.toMatch(/undefined|NaN/);
  expect(text).toContain("details not recorded");
  expect(text).toContain("Empty: no sets recorded");
});
test("handles missing name and duration and longer workout durations", () => {
  expect(formatWorkoutShareMessage({ exercises: [] })).toContain("\nWorkout\n");
  expect(formatWorkoutShareMessage({ durationSeconds: 3671, exercises: [] })).toContain("1 hr 1 min 11 sec");
});
