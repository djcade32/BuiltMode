import type { Exercise, ExerciseSet } from "@/packages/shared/src/types/workout";

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  return [hours ? `${hours} hr` : "", minutes ? `${minutes} min` : "", remainder ? `${remainder} sec` : ""]
    .filter(Boolean).join(" ") || "0 sec";
}

const recorded = (value: number | undefined): value is number => typeof value === "number" && Number.isFinite(value);

function formatSet(exercise: Exercise, set: ExerciseSet): string {
  const reps = recorded(set.reps) ? `${set.reps} rep${set.reps === 1 ? "" : "s"}` : "";
  switch (exercise.metricType) {
    case "weight_reps": {
      const unit = exercise.units === "kg" || exercise.units === "lbs" ? exercise.units : set.weightUnit ?? "lbs";
      const weight = recorded(set.weight) ? `${set.weight} ${unit}` : "";
      return [reps, weight].filter(Boolean).join(" at ");
    }
    case "reps_only": return reps;
    case "duration":
    case "time": {
      const seconds = exercise.metricType === "time" ? set.timeSeconds ?? set.durationSec : set.durationSec ?? set.timeSeconds;
      return recorded(seconds) ? formatDuration(seconds) : "";
    }
    case "distance": {
      const unit = exercise.units && ["mi", "km", "m", "yd"].includes(exercise.units) ? exercise.units : set.distanceUnit ?? "mi";
      const distance = recorded(set.distanceMiles) ? `${set.distanceMiles} ${unit}` : "";
      const time = recorded(set.durationSec) ? formatDuration(set.durationSec) : "";
      return [distance, time].filter(Boolean).join(" in ");
    }
    case "calories": return recorded(set.calories) ? `${set.calories} cal` : "";
    default: return "";
  }
}

export function formatWorkoutShareMessage({ name, durationSeconds, exercises }: {
  name?: string;
  durationSeconds?: number;
  exercises: Exercise[];
}): string {
  const title = name?.trim() || "Workout";
  const heading = recorded(durationSeconds) ? `${title} — ${formatDuration(durationSeconds)}` : title;
  const details = exercises.map((exercise) => {
    const sets = exercise.sets.map((set) => formatSet(exercise, set));
    if (!sets.length) return `${exercise.name}: no sets recorded`;
    if (sets[0] && sets.every((set) => set === sets[0])) {
      return `${exercise.name}: ${sets.length} set${sets.length === 1 ? "" : "s"} × ${sets[0]}`;
    }
    return `${exercise.name}:\n${sets.map((set, index) => `  Set ${index + 1}: ${set || "details not recorded"}`).join("\n")}`;
  });
  return ["Check out this workout I just completed! 💪", "", heading, ...details, "", "Logged with BuiltMode"].join("\n");
}
