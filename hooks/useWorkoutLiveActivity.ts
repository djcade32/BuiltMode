import type { ActiveWorkoutDraft } from "@/packages/shared/src";
import { createWorkoutLiveActivityState } from "@/services/widgets/createWorkoutLiveActivityState";
import { workoutLiveActivityService } from "@/services/widgets/workout-live-activity-service";
import { useCallback, useEffect, useRef } from "react";

type WorkoutProgressSnapshot =
  | Record<
      string,
      {
        sets: readonly unknown[];
        completed: boolean;
      }
    >
  | null
  | undefined;

type UseWorkoutLiveActivityArgs = {
  workout: ActiveWorkoutDraft | null;
  workoutProgress: WorkoutProgressSnapshot;
  currentExerciseIndex: number;

  elapsedSeconds: number;

  isPaused: boolean;
  isResting?: boolean;
};

type UseWorkoutLiveActivityResult = {
  endWorkoutLiveActivity: () => Promise<void>;
};

export const useWorkoutLiveActivity = ({
  workout,
  workoutProgress,
  currentExerciseIndex,
  elapsedSeconds,
  isPaused,
  isResting = false,
}: UseWorkoutLiveActivityArgs): UseWorkoutLiveActivityResult => {
  /*
   * Keep the freshest stopwatch value without causing a native
   * Live Activity update every time the stopwatch ticks.
   */
  const elapsedSecondsRef = useRef(elapsedSeconds);

  elapsedSecondsRef.current = elapsedSeconds;

  useEffect(() => {
    if (!workout?.startedAtMs) {
      return;
    }

    const liveActivityState = createWorkoutLiveActivityState({
      workout,
      workoutProgress,
      currentExerciseIndex,

      elapsedSeconds: elapsedSecondsRef.current,
      nowMs: Date.now(),

      isPaused,
      isResting,
    });

    void workoutLiveActivityService.sync(liveActivityState).catch((error) => {
      console.error("Failed to synchronize Workout Live Activity:", error);
    });
  }, [workout, workoutProgress, currentExerciseIndex, isPaused, isResting]);

  const endWorkoutLiveActivity = useCallback(() => {
    return workoutLiveActivityService.end();
  }, []);

  return {
    endWorkoutLiveActivity,
  };
};
