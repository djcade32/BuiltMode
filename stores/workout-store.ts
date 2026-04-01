import { Exercise, WorkoutType } from "@/packages/shared/src";
import type { ActiveWorkoutDraft } from "@builtmode/shared/types/workout";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./mmkv-storage-wrapper";

export interface WorkoutState {
  initialWorkout: {
    exercises: Exercise[];
    workoutType: WorkoutType;
  } | null;
  activeWorkoutDraft: ActiveWorkoutDraft | null;
  startWorkout: (payload: { sessionId: string; uid: string }) => void;
  updateWorkout: (payload: { sessionId: string; uid: string }) => void;
  setInitialWorkout: (payload: { exercises: Exercise[]; workoutType: WorkoutType }) => void;
  clearWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      initialWorkout: null,
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

      updateWorkout: ({ sessionId, uid }) =>
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

      setInitialWorkout: ({ exercises, workoutType }) =>
        set({
          initialWorkout: {
            workoutType,
            exercises,
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
