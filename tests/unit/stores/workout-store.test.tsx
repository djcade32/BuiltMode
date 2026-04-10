import { useWorkoutStore } from "@/stores/workout-store";
import { resetWorkoutStore } from "../../test-utils/reset-workout-store";
import {
  makeActiveWorkoutDraft,
  makeCompleteWorkoutResponse,
  makeExercises,
  makeInitialWorkout,
} from "../../test-utils/workout-fixtures";

jest.mock("@/services/workout-service", () => ({
  createCompleteWorkout: jest.fn(),
}));

import { createCompleteWorkout } from "@/services/workout-service";

describe("workout-store", () => {
  beforeEach(() => {
    resetWorkoutStore();
    jest.clearAllMocks();
  });

  it("sets initial workout", () => {
    const payload = makeInitialWorkout();

    useWorkoutStore.getState().setInitialWorkout(payload);

    const state = useWorkoutStore.getState();
    expect(state.initialWorkout).toEqual(payload);
  });

  it("starts workout and sets active workout draft", () => {
    const exercises = makeExercises();

    useWorkoutStore.getState().startWorkout({
      sessionId: "session-1",
      uid: "user-1",
      exercises,
      workoutType: "strength",
    });

    const state = useWorkoutStore.getState();
    expect(state.activeWorkoutDraft).toMatchObject({
      sessionId: "session-1",
      uid: "user-1",
      exercises,
      status: "active",
      workoutType: "strength",
    });
  });

  it("updates workout progress and marks workout complete when all exercises are completed", () => {
    const activeWorkoutDraft = makeActiveWorkoutDraft();

    useWorkoutStore.setState({
      activeWorkoutDraft,
      workoutProgress: {},
    });

    useWorkoutStore.getState().updateWorkoutProgress({
      exerciseId: activeWorkoutDraft.exercises[0].id,
      sets: activeWorkoutDraft.exercises[0].sets,
      completed: true,
    });

    expect(useWorkoutStore.getState().isWorkoutComplete).toBe(false);

    useWorkoutStore.getState().updateWorkoutProgress({
      exerciseId: activeWorkoutDraft.exercises[1].id,
      sets: activeWorkoutDraft.exercises[1].sets,
      completed: true,
    });

    expect(useWorkoutStore.getState().isWorkoutComplete).toBe(true);
  });

  it("updates current exercise index", () => {
    useWorkoutStore.getState().setCurrentExerciseIndex(1);
    expect(useWorkoutStore.getState().currentExerciseIndex).toBe(1);
  });

  it("logs workout and stores response data", async () => {
    const response = makeCompleteWorkoutResponse();
    (createCompleteWorkout as jest.Mock).mockResolvedValue(response);

    useWorkoutStore.setState({
      activeWorkoutDraft: {
        ...makeActiveWorkoutDraft(),
        name: "Upper Body",
        notes: "Felt strong",
      } as any,
    });

    const result = await useWorkoutStore.getState().logWorkout(420);

    expect(createCompleteWorkout).toHaveBeenCalledWith({
      sessionId: "session-1",
      name: "Upper Body",
      duration: 420,
      exercises: expect.any(Array),
      notes: "Felt strong",
      workoutType: "strength",
    });

    expect(result).toEqual(response);
    expect(useWorkoutStore.getState().duration).toBe(420);
    expect(useWorkoutStore.getState().completeWorkoutResponse).toEqual(response);
    expect(useWorkoutStore.getState().activeWorkoutDraft?.status).toBe("finishing");
    expect(useWorkoutStore.getState().isLoggingWorkout).toBe(false);
  });

  it("clears workout state", () => {
    useWorkoutStore.setState({
      initialWorkout: makeInitialWorkout(),
      activeWorkoutDraft: makeActiveWorkoutDraft() as any,
      workoutProgress: { "exercise-1": { sets: [], completed: true } },
      isWorkoutComplete: true,
      currentExerciseIndex: 1,
      duration: 300,
      completeWorkoutResponse: makeCompleteWorkoutResponse() as any,
    });

    useWorkoutStore.getState().clearWorkout();

    const state = useWorkoutStore.getState();
    expect(state.initialWorkout).toBeNull();
    expect(state.activeWorkoutDraft).toBeNull();
    expect(state.workoutProgress).toBeNull();
    expect(state.isWorkoutComplete).toBe(false);
    expect(state.currentExerciseIndex).toBe(0);
    expect(state.duration).toBeUndefined();
    expect(state.completeWorkoutResponse).toBeUndefined();
  });
});
