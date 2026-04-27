import {
  CompleteWorkoutRequest,
  CompleteWorkoutResponse,
  Exercise,
  ExerciseSet,
  SaveAsTemplateResponse,
  WorkoutType,
} from "@/packages/shared/src";
import { saveAsTemplate } from "@/services/template-service";
import { createCompleteWorkout } from "@/services/workout-service";
import type { ActiveWorkoutDraft } from "@builtmode/shared/types/workout";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./mmkv-storage-wrapper";

export interface WorkoutState {
  duration?: number;
  isLoggingWorkout: boolean;
  initialWorkout: {
    name: string;
    exercises: Exercise[];
    workoutType: WorkoutType;
  } | null;
  activeWorkoutDraft: ActiveWorkoutDraft | null;
  workoutProgress: Record<string, { sets: ExerciseSet[]; completed: boolean }> | null;
  isWorkoutComplete: boolean;
  currentExerciseIndex: number;
  completeWorkoutResponse?: CompleteWorkoutResponse;
  startWorkout: (payload: {
    name: string;
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
  setInitialWorkout: (
    payload: {
      name: string;
      exercises: Exercise[];
      workoutType: WorkoutType;
    } | null,
  ) => void;
  setCurrentExerciseIndex: (value: number) => void;
  logWorkout: (duration: number) => Promise<CompleteWorkoutResponse | undefined>;
  clearWorkout: () => void;
  saveWorkoutAsTemplate: (template: any) => Promise<SaveAsTemplateResponse | undefined>;
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

      startWorkout: ({ name, sessionId, uid, exercises, workoutType }) =>
        set({
          activeWorkoutDraft: {
            name,
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
            startedAtMs: get().activeWorkoutDraft?.startedAtMs ?? Date.now(),
            status: "active",
            lastEditedAtMs: Date.now(),
          },
        }),

      setInitialWorkout: (
        payload: { name: string; exercises: Exercise[]; workoutType: WorkoutType } | null,
      ) =>
        set({
          initialWorkout: payload
            ? {
                name: payload.name,
                workoutType: payload.workoutType,
                exercises: payload.exercises,
              }
            : null,
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

        const isWorkoutComplete =
          get().activeWorkoutDraft?.exercises.every(
            (exercise) =>
              updatedWorkoutProgress[exercise.id] &&
              updatedWorkoutProgress[exercise.id].completed === true,
          ) ?? false;
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

      saveWorkoutAsTemplate: async (template) => {
        const request: SaveAsTemplateResponse = {
          id: template.id ? `${template.id}-template` : `${uuidv4()}-template`,
          name: template.name,
          exercises: template.exercises,
          notes: template.notes,
          workoutType: template.workoutType,
        };
        try {
          console.log("Sending save template request: ", request);
          const response = saveAsTemplate(request);
          if (response) return response;
          return;
        } catch (error) {
          throw error;
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
