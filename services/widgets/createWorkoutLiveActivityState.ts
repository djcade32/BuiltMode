import { firstLetterToUpperCase } from "@/lib/utils/string";
import type { ActiveWorkoutDraft, WorkoutLiveActivityState } from "@/packages/shared/src";

export type WorkoutProgressSnapshot =
  | Record<
      string,
      {
        sets: readonly unknown[];
        completed: boolean;
      }
    >
  | null
  | undefined;

type CreateWorkoutLiveActivityStateArgs = {
  workout: ActiveWorkoutDraft;
  workoutProgress: WorkoutProgressSnapshot;
  currentExerciseIndex: number;

  elapsedSeconds: number;
  nowMs: number;

  isPaused: boolean;
  isResting?: boolean;
};

export const createWorkoutLiveActivityState = ({
  workout,
  workoutProgress,
  currentExerciseIndex,
  elapsedSeconds,
  nowMs,
  isPaused,
  isResting = false,
}: CreateWorkoutLiveActivityStateArgs): WorkoutLiveActivityState => {
  const currentExercise = workout.exercises[currentExerciseIndex] ?? null;

  const completedSetCount = currentExercise ? (workoutProgress?.[currentExercise.id]?.sets.length ?? 0) : 0;

  const totalSets = currentExercise?.sets.length ?? 0;

  const currentSetIndex = totalSets > 0 ? Math.min(completedSetCount, totalSets - 1) : -1;

  const currentSet = currentExercise && currentSetIndex >= 0 ? currentExercise.sets[currentSetIndex] : undefined;

  const displayedSetNumber = totalSets > 0 ? Math.min(completedSetCount + 1, totalSets) : 0;

  const safeElapsedSeconds = Math.max(0, Math.floor(elapsedSeconds));

  /*
   * Build an effective timer start point from the stopwatch's
   * current elapsed duration.
   *
   * Example:
   * now = 3:30 PM
   * elapsed = 10 minutes
   * timerStartedAtMs = 3:20 PM
   */
  const timerStartedAtMs = nowMs - safeElapsedSeconds * 1000;

  return {
    workoutId: workout.sessionId,
    workoutName: workout.name ?? `${firstLetterToUpperCase(workout.workoutType ?? "")} Workout`,

    startedAtMs: workout.startedAtMs,

    timerStartedAtMs,
    elapsedSeconds: safeElapsedSeconds,

    exerciseName: currentExercise?.name ?? null,
    setNumber: displayedSetNumber,
    totalSets,

    weight: currentSet?.weight,
    reps: currentSet?.reps,
    units: currentExercise?.units ?? null,

    isResting,
    isPaused,
  };
};
