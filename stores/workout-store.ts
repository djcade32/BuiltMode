import {
  CompleteWorkoutRequest,
  CompleteWorkoutResponse,
  Exercise,
  ExerciseSet,
  WorkoutType,
} from "@/packages/shared/src";
import { createCompleteWorkout } from "@/services/workout-service";
import type { ActiveWorkoutDraft } from "@builtmode/shared/types/workout";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./mmkv-storage-wrapper";

export interface WorkoutState {
  duration?: number;
  isLoggingWorkout: boolean;
  initialWorkout: {
    exercises: Exercise[];
    workoutType: WorkoutType;
  } | null;
  activeWorkoutDraft: ActiveWorkoutDraft | null;
  workoutProgress: Record<string, { sets: ExerciseSet[]; completed: boolean }> | null;
  isWorkoutComplete: boolean;
  currentExerciseIndex: number;
  completeWorkoutResponse?: CompleteWorkoutResponse;
  startWorkout: (payload: {
    sessionId: string;
    uid: string;
    exercises: Exercise[];
    workoutType: WorkoutType;
  }) => void;
  updateWorkout: (payload: { sessionId: string; uid: string; exercises: Exercise[] }) => void;
  updateWorkoutProgress: (payload: {
    exerciseId: string;
    sets: ExerciseSet[];
    completed?: boolean;
  }) => void;
  setInitialWorkout: (payload: { exercises: Exercise[]; workoutType: WorkoutType }) => void;
  setCurrentExerciseIndex: (value: number) => void;
  logWorkout: (duration: number) => Promise<CompleteWorkoutResponse | undefined>;
  clearWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      isLoggingWorkout: false,
      initialWorkout: null,
      activeWorkoutDraft: null,
      workoutProgress: null,
      isWorkoutComplete: false,
      currentExerciseIndex: 0,

      startWorkout: ({ sessionId, uid, exercises, workoutType }) =>
        set({
          activeWorkoutDraft: {
            sessionId,
            uid,
            exercises,
            startedAtMs: Date.now(),
            status: "active",
            lastEditedAtMs: Date.now(),
            workoutType,
          },
        }),

      updateWorkout: ({ sessionId, uid, exercises }) =>
        set({
          activeWorkoutDraft: {
            ...get().activeWorkoutDraft,
            sessionId,
            uid,
            exercises,
            startedAtMs: Date.now(),
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

      updateWorkoutProgress: ({ exerciseId, sets, completed = false }) => {
        const workoutProgress = get().workoutProgress;
        const updatedWorkoutProgress = {
          ...workoutProgress,
          [exerciseId]: {
            sets: sets,
            completed: completed,
          },
        };

        const isWorkoutComplete = get().activeWorkoutDraft?.exercises.every(
          (exercise) =>
            updatedWorkoutProgress[exercise.id] &&
            updatedWorkoutProgress[exercise.id].completed === true,
        );
        set({
          workoutProgress: updatedWorkoutProgress,
          isWorkoutComplete,
        });
      },

      setCurrentExerciseIndex: (value) => {
        set({
          currentExerciseIndex: value,
        });
      },

      logWorkout: async (duration) => {
        set({
          isLoggingWorkout: true,
        });
        const activeWorkoutDraft = get().activeWorkoutDraft;
        if (!activeWorkoutDraft) return;
        const { sessionId, name, notes, exercises, workoutType } = activeWorkoutDraft;
        try {
          const request: CompleteWorkoutRequest = {
            sessionId,
            name: name ?? "",
            duration,
            exercises,
            notes: notes ?? "",
            workoutType,
          };
          console.log("Sending complete request: ", request);
          const response = await createCompleteWorkout(request);
          if (response) {
            set({
              activeWorkoutDraft: {
                ...activeWorkoutDraft,
                status: "finishing",
              },
              duration,
              completeWorkoutResponse: response,
            });
            return response;
          }
          return;
        } catch (error) {
          throw error;
        } finally {
          set({
            isLoggingWorkout: false,
          });
        }
      },

      clearWorkout: () =>
        set({
          activeWorkoutDraft: null,
          initialWorkout: null,
          workoutProgress: null,
          isWorkoutComplete: false,
          currentExerciseIndex: 0,
          duration: undefined,
          completeWorkoutResponse: undefined,
        }),
    }),
    {
      name: "workout-store",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        activeWorkoutDraft: state.activeWorkoutDraft,
        workoutProgress: state.workoutProgress,
        isWorkoutComplete: state.isWorkoutComplete,
        currentExerciseIndex: state.currentExerciseIndex,
        duration: state.duration,
        completeWorkoutResponse: state.completeWorkoutResponse,
      }),
    },
  ),
);
