import type { ExerciseMetricType, ExerciseSet, ExerciseUnit } from "../types/workout.js";

// Older workouts predate exercise-level units. Preserve explicit values (even
// null) and infer only missing units without converting any recorded numbers.
export function normalizeExerciseUnits<T extends {
  metricType: ExerciseMetricType;
  units?: ExerciseUnit | null;
  sets: ExerciseSet[];
}>(exercise: T): T & { units: ExerciseUnit | null } {
  if (exercise.units !== undefined) return { ...exercise, units: exercise.units };
  const field = exercise.metricType === "weight_reps" ? "weightUnit"
    : exercise.metricType === "distance" ? "distanceUnit" : null;
  const recorded = new Set(field ? exercise.sets.map((set) => set[field]).filter((unit) => unit !== undefined) : []);
  const units = recorded.size === 1 ? [...recorded][0]!
    : recorded.size > 1 ? null
    : exercise.metricType === "weight_reps" ? "lbs"
    : exercise.metricType === "distance" ? "mi" : null;
  return { ...exercise, units };
}
