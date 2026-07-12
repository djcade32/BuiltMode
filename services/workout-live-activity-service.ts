import { ActiveWorkoutDraft, WorkoutLiveActivityState } from "@/packages/shared/src";

export interface WorkoutLiveActivityService {
  start(state: WorkoutLiveActivityState): Promise<string | null>;

  update(activityId: string, state: WorkoutLiveActivityState): Promise<void>;

  end(activityId: string): Promise<void>;
}

function startWorkout(workout: ActiveWorkoutDraft) {
  return createWorkoutLiveActivityState(workout).workoutId;
}

function updateWorkout() {}

function endWorkout() {}

// HELPERS

function createWorkoutLiveActivityState(workout: ActiveWorkoutDraft): WorkoutLiveActivityState {
  const currentExercise = workout.exercises[0];
  const currentSet = currentExercise.sets[0];

  return {
    workoutId: workout.sessionId,
    workoutName: workout.name || "",
    startedAtMs: workout.startedAtMs,
    exerciseId: currentExercise?.id ?? null,
    exerciseName: currentExercise?.name ?? null,
    setId: currentSet?.id ?? null,
    setNumber: 1,
    totalSets: currentExercise?.sets.length ?? 0,
    weight: currentSet?.weight,
    reps: currentSet?.reps,
    durationSeconds: currentSet?.durationSec,
    isPaused: false,
    isComplete: false,
  };
}

export const workoutLiveActivityService = {
  startWorkout,
  updateWorkout,
  endWorkout,
};
