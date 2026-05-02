import { Exercise, WorkoutType } from "@/packages/shared/src";

export const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: overrides.id ?? "exercise-1",
  name: overrides.name ?? "Bench Press",
  metricType: overrides.metricType ?? "weight_reps",
  sets: overrides.sets ?? [
    {
      id: "set-1",
      weight: 135,
      reps: 8,
    } as any,
  ],
  ...overrides,
});

export const makeExercises = (): Exercise[] => [
  makeExercise({ id: "exercise-1", name: "Bench Press" }),
  makeExercise({ id: "exercise-2", name: "Pull Ups", metricType: "reps_only" }),
];

export const makeInitialWorkout = (overrides?: {
  name?: string;
  exercises?: Exercise[];
  workoutType?: WorkoutType;
}) => ({
  name: overrides?.name ?? "Strength Workout",
  exercises: overrides?.exercises ?? makeExercises(),
  workoutType: overrides?.workoutType ?? "strength",
});

export const makeActiveWorkoutDraft = () => ({
  sessionId: "session-1",
  uid: "user-1",
  exercises: makeExercises(),
  startedAtMs: Date.now(),
  status: "active" as const,
  lastEditedAtMs: Date.now(),
  workoutType: "strength" as const,
});

export const makeCompleteWorkoutResponse = () => ({
  modeScore: 82,
  modeScoreDifference: 2,
  activeDaysThisWeek: 3,
  weeklyTargetDays: 4,
});
