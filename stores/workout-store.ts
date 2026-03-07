import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./mmkvStorageWrapper";

export interface WorkoutState {
  activeWorkoutDraft: {
    sessionId: string;
    uid: string;
    startedAtMs: number;
    workoutType?: string;
    notes?: string;
    exercises: any[];
    status: "active" | "finishing";
    lastEditedAtMs: number;
  } | null;

  startWorkout: (payload: { sessionId: string; uid: string }) => void;

  clearWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      activeWorkoutDraft: null,

      startWorkout: ({ sessionId, uid }) =>
        set({
          activeWorkoutDraft: {
            sessionId,
            uid,
            startedAtMs: Date.now(),
            exercises: [],
            status: "active",
            lastEditedAtMs: Date.now(),
          },
        }),

      clearWorkout: () =>
        set({
          activeWorkoutDraft: null,
        }),
    }),
    {
      name: "workout-store",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        activeWorkoutDraft: state.activeWorkoutDraft,
      }),
    },
  ),
);
