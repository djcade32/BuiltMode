import {
  CompleteWorkoutRequest,
  CompleteWorkoutResponse,
  Exercise,
  ExerciseSet,
  SaveAsTemplateRequest,
  SaveAsTemplateResponse,
  WorkoutType,
} from "@/packages/shared/src";
import { saveAsTemplate } from "@/services/template-service";
import { workoutLiveActivityService } from "@/services/workout-live-activity-service";
import { createCompleteWorkout } from "@/services/workout-service";
import type { ActiveWorkoutDraft } from "@builtmode/shared/types/workout";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./mmkv-storage-wrapper";

export type PersistedDurationSetTimerStatus = "running" | "paused" | "expired";

export type PersistedDurationSetTimer = {
  exerciseId: string;
  setId: string;
  status: PersistedDurationSetTimerStatus;
  startedAtMs: number | null;
  expiresAtMs: number | null;
  durationSeconds: number;
  pausedRemainingSeconds: number | null;
  notificationId?: string | null;
};

export interface WorkoutState {
  duration?: number;
  isLoggingWorkout: boolean;
  initialWorkout: {
    name: string;
    exercises: Exercise[];
    workoutType: WorkoutType;
    notes?: string;
  } | null;
  activeWorkoutDraft: ActiveWorkoutDraft | null;
  workoutProgress: Record<string, { sets: ExerciseSet[]; completed: boolean }> | null;
  isWorkoutComplete: boolean;
  currentExerciseIndex: number;
  durationSetTimer: PersistedDurationSetTimer | null;
  completeWorkoutResponse?: CompleteWorkoutResponse;
  liveActivityId?: string | null;
  startWorkout: (payload: {
    name: string;
    sessionId: string;
    uid: string;
    exercises: Exercise[];
    workoutType: WorkoutType;
    notes?: string;
  }) => void;
  updateWorkout: (payload: { sessionId: string; uid: string; exercises: Exercise[]; notes?: string }) => void;
  updateWorkoutProgress: (payload: { exerciseId: string; sets: ExerciseSet[]; completed?: boolean }) => void;
  removeExerciseFromWorkoutProgress: (exerciseId: string) => void;
  setInitialWorkout: (
    payload: {
      name: string;
      exercises: Exercise[];
      workoutType: WorkoutType;
      notes?: string;
    } | null,
  ) => void;
  setCurrentExerciseIndex: (value: number) => void;
  logWorkout: (duration: number) => Promise<CompleteWorkoutResponse | undefined>;
  clearWorkout: () => void;
  saveWorkoutAsTemplate: (template: any) => Promise<SaveAsTemplateResponse | undefined>;
  setIsWorkoutComplete: (value: boolean) => void;
  setDurationSetTimer: (timer: PersistedDurationSetTimer | null) => void;
  startLiveWorkoutWidget: () => void;
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
      durationSetTimer: null,
      liveActivityId: null,

      startWorkout: ({ name, sessionId, uid, exercises, workoutType, notes }) => {
        const activeWorkout: ActiveWorkoutDraft = {
          name,
          sessionId,
          uid,
          exercises,
          startedAtMs: Date.now(),
          status: "active",
          lastEditedAtMs: Date.now(),
          workoutType,
          notes,
        };

        set({
          activeWorkoutDraft: activeWorkout,
        });

        get().startLiveWorkoutWidget();
      },

      updateWorkout: ({ sessionId, uid, exercises, notes }) => {
        set({
          activeWorkoutDraft: {
            ...get().activeWorkoutDraft,
            sessionId,
            uid,
            exercises,
            startedAtMs: get().activeWorkoutDraft?.startedAtMs ?? Date.now(),
            status: "active",
            lastEditedAtMs: Date.now(),
            notes: notes ?? undefined,
          },
        });
      },

      setInitialWorkout: (
        payload: { name: string; exercises: Exercise[]; workoutType: WorkoutType; notes?: string } | null,
      ) =>
        set({
          initialWorkout: payload
            ? {
                name: payload.name,
                workoutType: payload.workoutType,
                exercises: payload.exercises,
                notes: payload.notes,
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
              updatedWorkoutProgress[exercise.id] && updatedWorkoutProgress[exercise.id].completed === true,
          ) ?? false;
        set({
          workoutProgress: updatedWorkoutProgress,
          isWorkoutComplete,
        });
      },

      removeExerciseFromWorkoutProgress: (exerciseId) => {
        const workoutProgress = get().workoutProgress;
        const activeWorkoutDraft = get().activeWorkoutDraft;

        if (!workoutProgress) return null;
        if (!workoutProgress[exerciseId]) return null;

        const updatedWorkoutProgress: Record<string, { sets: ExerciseSet[]; completed: boolean }> = {};
        let isWorkoutComplete = true;
        Object.keys(workoutProgress).forEach((id) => {
          if (exerciseId !== id) {
            updatedWorkoutProgress[id] = workoutProgress[id];
            if (!updatedWorkoutProgress[id].completed) {
              isWorkoutComplete = false;
            }
          }
        });

        const isLastExerciseInList =
          exerciseId === activeWorkoutDraft?.exercises[activeWorkoutDraft?.exercises.length - 1].id;
        set({
          workoutProgress: updatedWorkoutProgress,
          isWorkoutComplete,
          currentExerciseIndex: isLastExerciseInList
            ? activeWorkoutDraft?.exercises.length - 2
            : get().currentExerciseIndex,
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
        const request: SaveAsTemplateRequest = {
          id: template.id ? `${template.id}-template` : `${uuidv4()}-template`,
          name: template.name,
          exercises: template.exercises,
          notes: template.notes,
          workoutType: template.workoutType,
        };
        try {
          console.log("Sending save template request: ", request);
          const response = await saveAsTemplate(request);
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
          durationSetTimer: null,
          liveActivityId: null,
        }),
      setIsWorkoutComplete: (value) =>
        set({
          isWorkoutComplete: value,
        }),

      setDurationSetTimer: (value) => {
        set({ durationSetTimer: value });
      },

      startLiveWorkoutWidget: () => {
        const activeWorkout = get().activeWorkoutDraft;
        if (!activeWorkout) return;

        const liveActivityId = workoutLiveActivityService.startWorkout(activeWorkout);
        set({ liveActivityId });
      },
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
        durationSetTimer: state.durationSetTimer,
      }),
    },
  ),
);
