import { useWorkoutStore } from "@/stores/workout-store";
import { resetWorkoutStore } from "../test-utils/reset-workout-store";
import { makeCompleteWorkoutResponse, makeExercises } from "../test-utils/workout-fixtures";

jest.mock("@/services/workout-service", () => ({
  createCompleteWorkout: jest.fn(),
}));

import { createCompleteWorkout } from "@/services/workout-service";

describe("Start Workout Flow integration", () => {
  beforeEach(() => {
    resetWorkoutStore();
    jest.clearAllMocks();
  });

  it("moves from built workout to completed workout summary state", async () => {
    const exercises = makeExercises();
    (createCompleteWorkout as jest.Mock).mockResolvedValue(makeCompleteWorkoutResponse());

    useWorkoutStore.getState().setInitialWorkout({
      workoutType: "strength",
      exercises,
    });

    expect(useWorkoutStore.getState().initialWorkout?.exercises).toHaveLength(2);

    useWorkoutStore.getState().startWorkout({
      sessionId: "session-1",
      uid: "user-1",
      exercises,
      workoutType: "strength",
    });

    expect(useWorkoutStore.getState().activeWorkoutDraft?.status).toBe("active");

    useWorkoutStore.getState().updateWorkoutProgress({
      exerciseId: exercises[0].id,
      sets: exercises[0].sets,
      completed: true,
    });

    useWorkoutStore.getState().updateWorkoutProgress({
      exerciseId: exercises[1].id,
      sets: exercises[1].sets,
      completed: true,
    });

    expect(useWorkoutStore.getState().isWorkoutComplete).toBe(true);

    const response = await useWorkoutStore.getState().logWorkout(600);

    expect(response).toEqual(makeCompleteWorkoutResponse());
    expect(useWorkoutStore.getState().completeWorkoutResponse).toEqual(
      makeCompleteWorkoutResponse(),
    );
    expect(useWorkoutStore.getState().duration).toBe(600);
    expect(useWorkoutStore.getState().activeWorkoutDraft?.status).toBe("finishing");
  });
});
