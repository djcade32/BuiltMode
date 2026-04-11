import { useWorkoutStore } from "@/stores/workout-store";

export const resetWorkoutStore = () => {
  useWorkoutStore.setState({
    duration: undefined,
    isLoggingWorkout: false,
    initialWorkout: null,
    activeWorkoutDraft: null,
    workoutProgress: null,
    isWorkoutComplete: false,
    currentExerciseIndex: 0,
    completeWorkoutResponse: undefined,
  });
};
