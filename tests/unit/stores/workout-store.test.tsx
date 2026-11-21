import { saveAsTemplate } from "@/services/template-service";
import { useWorkoutStore } from "@/stores/workout-store";
import { resetWorkoutStore } from "../../test-utils/reset-workout-store";
import {
  makeActiveWorkoutDraft,
  makeCompleteWorkoutResponse,
  makeExercises,
  makeInitialWorkout,
} from "../../test-utils/workout-fixtures";

jest.mock("@/services/template-service", () => ({ saveAsTemplate: jest.fn() }));

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
    expect(state.initialWorkout).toEqual({ ...payload, exercises: payload.exercises.map((exercise) => ({ ...exercise, units: exercise.metricType === "weight_reps" ? "lbs" : null })) });
  });

  it("starts workout and sets active workout draft", () => {
    const exercises = makeExercises();

    useWorkoutStore.getState().startWorkout({
      name: "Strength Workout",
      sessionId: "session-1",
      uid: "user-1",
      exercises,
      workoutType: "strength",
    });

    const state = useWorkoutStore.getState();
    expect(state.activeWorkoutDraft).toMatchObject({
      sessionId: "session-1",
      uid: "user-1",
      exercises: exercises.map((exercise) => ({ ...exercise, units: exercise.metricType === "weight_reps" ? "lbs" : null })),
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

  it("normalizes a resumed legacy draft before completion without modifying its source", async () => {
    const draft = makeActiveWorkoutDraft();
    useWorkoutStore.setState({ activeWorkoutDraft: draft as any });
    (createCompleteWorkout as jest.Mock).mockResolvedValue(makeCompleteWorkoutResponse());
    await useWorkoutStore.getState().logWorkout(10);
    expect((createCompleteWorkout as jest.Mock).mock.calls[0][0].exercises.map((e: any) => e.units)).toEqual(["lbs", null]);
    expect(draft.exercises[0]).not.toHaveProperty("units");
  });
  it("retains the active draft and clears loading when save fails", async () => {
    const draft = makeActiveWorkoutDraft();
    useWorkoutStore.setState({ activeWorkoutDraft: draft as any });
    (createCompleteWorkout as jest.Mock).mockRejectedValue(new Error("Network failure"));
    await expect(useWorkoutStore.getState().logWorkout(10)).rejects.toThrow("Network failure");
    expect(useWorkoutStore.getState().activeWorkoutDraft).toEqual(draft);
    expect(useWorkoutStore.getState().isLoggingWorkout).toBe(false);
  });
  it("does not leave logging enabled when no draft exists", async () => {
    await expect(useWorkoutStore.getState().logWorkout(10)).rejects.toThrow("no active workout");
    expect(useWorkoutStore.getState().isLoggingWorkout).toBe(false);
  });

  it("normalizes legacy exercises when saving a template without mutating the source", async () => {
    const template = { id: "t1", ...makeInitialWorkout() };
    (saveAsTemplate as jest.Mock).mockResolvedValue({ id: "t1-template" });
    await useWorkoutStore.getState().saveWorkoutAsTemplate(template);
    expect((saveAsTemplate as jest.Mock).mock.calls[0][0].exercises.map((e: any) => e.units)).toEqual(["lbs", null]);
    expect(template.exercises[0]).not.toHaveProperty("units");
  });
});
