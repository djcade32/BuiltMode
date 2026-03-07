import { act } from "react";
import { storage } from "../../stores/mmkvStorageWrapper";
import { useWorkoutStore } from "../../stores/workout-store";

describe("workout store", () => {
  beforeEach(() => {
    storage.clearAll();
    useWorkoutStore.setState({
      activeWorkoutDraft: null,
    });
  });

  test("startWorkout sets activeWorkout", () => {
    const workout = {
      sessionId: "abc123",
      uid: "user1",
      startedAtMs: Date.now(),
      exercises: [],
      status: "active" as const,
      lastEditedAtMs: Date.now(),
    };

    act(() => {
      useWorkoutStore.getState().startWorkout(workout);
    });

    expect(useWorkoutStore.getState().activeWorkoutDraft).toEqual(workout);
  });
});

describe("workout persistence", () => {
  beforeEach(() => {
    storage.clearAll();
    useWorkoutStore.setState({
      activeWorkoutDraft: null,
    });
  });

  test("startWorkout persists active workout", () => {
    const workout = {
      sessionId: "abc123",
      uid: "user1",
      startedAtMs: 123456,
      exercises: [],
      status: "active" as const,
      lastEditedAtMs: 123456,
    };

    useWorkoutStore.getState().startWorkout(workout);

    const raw = storage.getString("workout-store");
    expect(raw).toBeTruthy();
    expect(raw).toContain("abc123");
  });
});
