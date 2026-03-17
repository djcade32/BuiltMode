import { act } from "react";
import { storage } from "../../stores/mmkv-storage-wrapper";
import { useWorkoutStore } from "../../stores/workout-store";

describe("workout store", () => {
  beforeEach(() => {
    storage.clearAll();
    useWorkoutStore.setState({
      activeWorkoutDraft: null,
    });
  });

  test("startWorkout sets activeWorkoutDraft", () => {
    const workout = {
      sessionId: "abc123",
      uid: "user1",
    };

    act(() => {
      useWorkoutStore.getState().startWorkout(workout);
    });

    expect(useWorkoutStore.getState().activeWorkoutDraft).toMatchObject({
      sessionId: "abc123",
      uid: "user1",
      exercises: [],
      status: "active",
    });

    expect(useWorkoutStore.getState().activeWorkoutDraft?.startedAtMs).toEqual(expect.any(Number));
    expect(useWorkoutStore.getState().activeWorkoutDraft?.lastEditedAtMs).toEqual(
      expect.any(Number),
    );
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

    act(() => {
      useWorkoutStore.getState().startWorkout(workout);
    });

    const raw = storage.getString("workout-store");

    expect(raw).toBeTruthy();
    expect(raw).toContain("abc123");
  });
});
