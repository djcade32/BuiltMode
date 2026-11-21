/// <reference types="jest" />
import { saveAsTemplateRequestSchema } from "../../../../packages/shared/src/schemas/template";
import { completeWorkoutRequestSchema } from "../../../../packages/shared/src/schemas/workout";
import { normalizeExerciseUnits } from "../../../../packages/shared/src/utils/exerciseUnits";

const exercise = { id: "e1", name: "Bench Press", metricType: "weight_reps" as const, sets: [{ id: "s1", weight: 225, reps: 10 }] };
const parse = (value: any) => completeWorkoutRequestSchema.safeParse({ sessionId: "w1", duration: 14, exercises: [value] });
test("legacy copied/template exercises without units pass and gain historic defaults", () => {
  const result = parse(exercise);
  expect(result.success).toBe(true);
  if (result.success) expect(result.data.exercises[0]).toEqual({ ...exercise, units: "lbs" });
  expect(exercise).not.toHaveProperty("units");
});
test.each(["kg", "lbs", null])("explicit units %s are preserved", (units) => {
  const result = parse({ ...exercise, units });
  expect(result.success).toBe(true);
  if (result.success) expect(result.data.exercises[0].units).toBe(units);
});
test("legacy set units take precedence over defaults without converting values", () => {
  const input = { ...exercise, sets: [{ id: "s1", weight: 100, weightUnit: "kg" as const, reps: 5 }] };
  expect(normalizeExerciseUnits(input)).toEqual({ ...input, units: "kg" });
});
test.each(["km", "m", "yd", "mi"] as const)("preserves legacy distance unit %s", (distanceUnit) => {
  const input = { ...exercise, metricType: "distance" as const, sets: [{ id: "s1", distanceMiles: 10, distanceUnit }] };
  expect(normalizeExerciseUnits(input)).toEqual({ ...input, units: distanceUnit });
});
test.each(["reps_only", "duration", "calories", "time"])("unitless %s receives null", (metricType) => {
  const result = parse({ ...exercise, metricType });
  expect(result.success).toBe(true);
  if (result.success) expect(result.data.exercises[0].units).toBeNull();
});
test("conflicting legacy set units are preserved rather than guessed or converted", () => {
  const input = { ...exercise, sets: [{ id: "a", weight: 100, weightUnit: "kg" as const }, { id: "b", weight: 225, weightUnit: "lbs" as const }] };
  expect(normalizeExerciseUnits(input)).toEqual({ ...input, units: null });
});
test.each([
  { ...exercise, units: "invalid" },
  { ...exercise, sets: [{ id: "s1", weight: -10 }] },
  { ...exercise, sets: [{ id: "s1", reps: "10" }] },
  { ...exercise, sets: [{ id: "s1", reps: 1.5 }] },
])("invalid data remains rejected", (value) => expect(parse(value).success).toBe(false));

test("the template callable accepts the same legacy exercise data", () => {
  const result = saveAsTemplateRequestSchema.safeParse({ id: "t1", name: "Test", workoutType: "strength", exercises: [exercise] });
  expect(result.success).toBe(true);
  if (result.success) expect(result.data.exercises[0].units).toBe("lbs");
});
