import type { WorkoutLiveActivityState } from "@/packages/shared/src";
import { CompleteCurrentSetPayload, useWorkoutStore } from "@/stores/workout-store";
import { getWorkoutWidgetLogoUri } from "@/widgets/getWorkoutWidgetLogoUri";
import WorkoutLiveActivity, { WorkoutLiveActivityProps } from "@/widgets/WorkoutLiveActivity";
import { addUserInteractionListener } from "expo-widgets";
import { Platform } from "react-native";

type WorkoutLiveActivityInstance = ReturnType<typeof WorkoutLiveActivity.start>;
type UserInteractionSubscription = ReturnType<typeof addUserInteractionListener>;

export interface WorkoutLiveActivityService {
  sync(state: WorkoutLiveActivityState): Promise<void>;
  end(): Promise<void>;
}

const COMPLETE_CURRENT_SET_ACTION = "builtmode.complete-current-set";

let activeInstance: WorkoutLiveActivityInstance | null = null;
let activeWorkoutId: string | null = null;
let logoUriPromise: Promise<string> | null = null;
let lastPayloadSignature: string | null = null;
let lastSyncedState: WorkoutLiveActivityState | null = null;
let userInteractionSubscription: UserInteractionSubscription | null = null;

/*
 * Serializes native activity operations.
 *
 * This prevents a rapid set completion, exercise change, and pause event
 * from racing against one another.
 */
let operationQueue: Promise<void> = Promise.resolve();

const enqueueOperation = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = operationQueue.then(operation, operation);

  operationQueue = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
};

const getLogoUri = (): Promise<string> => {
  if (!logoUriPromise) {
    logoUriPromise = getWorkoutWidgetLogoUri().catch((error) => {
      logoUriPromise = null;
      throw error;
    });
  }

  return logoUriPromise;
};

const parseCompleteCurrentSetTarget = (target: string): CompleteCurrentSetPayload | null => {
  const [action, encodedWorkoutId, encodedExerciseId, encodedSetId, ...extraParts] = target.split("|");

  if (
    action !== COMPLETE_CURRENT_SET_ACTION ||
    !encodedWorkoutId ||
    !encodedExerciseId ||
    !encodedSetId ||
    extraParts.length > 0
  ) {
    return null;
  }

  try {
    return {
      workoutId: decodeURIComponent(encodedWorkoutId),
      exerciseId: decodeURIComponent(encodedExerciseId),
      setId: decodeURIComponent(encodedSetId),
    };
  } catch {
    return null;
  }
};

const createWidgetProps = async (state: WorkoutLiveActivityState): Promise<WorkoutLiveActivityProps> => {
  const logoUri = await getLogoUri();
  const workoutState = useWorkoutStore.getState();
  const activeWorkoutDraft = workoutState.activeWorkoutDraft;

  if (!activeWorkoutDraft || activeWorkoutDraft.sessionId !== state.workoutId) {
    return {
      ...state,
      exerciseNumber: 0,
      totalExercises: 0,
      isWorkoutComplete: false,
      currentExerciseId: null,
      currentSetId: null,
      canCompleteCurrentSet: false,
      logoUri,
    };
  }

  const totalExercises = activeWorkoutDraft.exercises.length;
  const currentExercise = activeWorkoutDraft.exercises[workoutState.currentExerciseIndex];
  const currentExerciseProgress = currentExercise ? workoutState.workoutProgress?.[currentExercise.id] : undefined;
  const completedSetIds = new Set((currentExerciseProgress?.sets ?? []).map((completedSet) => completedSet.id));
  const currentSet = currentExercise?.sets.find((exerciseSet) => !completedSetIds.has(exerciseSet.id));
  const currentSetIndex =
    currentExercise && currentSet
      ? currentExercise.sets.findIndex((exerciseSet) => exerciseSet.id === currentSet.id)
      : -1;

  return {
    ...state,
    exerciseName: currentExercise?.name ?? null,
    exerciseNumber: currentExercise ? workoutState.currentExerciseIndex + 1 : 0,
    totalExercises,
    isWorkoutComplete: workoutState.isWorkoutComplete,
    setNumber: currentSetIndex >= 0 ? currentSetIndex + 1 : (currentExercise?.sets.length ?? 0),
    totalSets: currentExercise?.sets.length ?? 0,
    weight: currentSet?.weight,
    reps: currentSet?.reps,
    durationSeconds: currentSet?.durationSec,
    distance: currentSet?.distanceMiles,
    distanceUnit: currentSet?.distanceUnit,
    currentExerciseId: currentExercise?.id ?? null,
    currentSetId: currentSet?.id ?? null,
    canCompleteCurrentSet: Boolean(currentExercise && currentSet && currentExerciseProgress?.completed !== true),
    logoUri,
  };
};

const getPayloadSignature = (props: WorkoutLiveActivityProps): string => JSON.stringify(props);

const clearCachedActivity = () => {
  activeInstance = null;
  activeWorkoutId = null;
  lastPayloadSignature = null;
  lastSyncedState = null;
};

const endInstances = async (instances: WorkoutLiveActivityInstance[]): Promise<void> => {
  await Promise.allSettled(instances.map((instance) => instance.end("immediate")));
};

const endInternal = async (): Promise<void> => {
  const instances = activeInstance ? [activeInstance] : WorkoutLiveActivity.getInstances();

  if (instances.length > 0) {
    await endInstances(instances);
  }

  clearCachedActivity();
};

const ensureActivity = async (
  state: WorkoutLiveActivityState,
  props: WorkoutLiveActivityProps,
): Promise<WorkoutLiveActivityInstance> => {
  if (activeInstance && activeWorkoutId === state.workoutId) {
    return activeInstance;
  }

  /*
   * A different workout was started while an old activity
   * was still cached.
   */
  if (activeInstance && activeWorkoutId && activeWorkoutId !== state.workoutId) {
    await endInternal();
  }

  /*
   * Recover an activity after the app process or screen remounts.
   *
   * BuiltMode only permits one active workout, so the first
   * existing WorkoutLiveActivity is the one we recover.
   */
  const existingActivities = WorkoutLiveActivity.getInstances();

  if (existingActivities.length > 0) {
    const [existingActivity, ...duplicateActivities] = existingActivities;

    activeInstance = existingActivity;
    activeWorkoutId = state.workoutId;

    /*
     * Force one synchronization after recovery because the service
     * does not know which payload the extension currently displays.
     */
    lastPayloadSignature = null;

    if (duplicateActivities.length > 0) {
      await endInstances(duplicateActivities);
    }

    return existingActivity;
  }
  console.log("props: ", props);
  const instance = WorkoutLiveActivity.start(props, `builtmode://active-workout/${state.workoutId}`);

  activeInstance = instance;
  activeWorkoutId = state.workoutId;
  lastPayloadSignature = getPayloadSignature(props);

  console.log("Workout Live Activity started:", state.workoutId);

  return instance;
};

const sync = async (state: WorkoutLiveActivityState): Promise<void> => {
  if (Platform.OS !== "ios") {
    return;
  }

  lastSyncedState = state;
  ensureUserInteractionListener();

  return enqueueOperation(async () => {
    const props = await createWidgetProps(state);
    const instance = await ensureActivity(state, props);

    const nextSignature = getPayloadSignature(props);

    /*
     * Avoid asking WidgetKit to render when nothing visible changed.
     */
    if (nextSignature === lastPayloadSignature) {
      return;
    }

    await instance.update(props);

    lastPayloadSignature = nextSignature;

    console.log("Workout Live Activity updated:", {
      workoutId: props.workoutId,
      exerciseName: props.exerciseName,
      setNumber: props.setNumber,
      totalSets: props.totalSets,
      exerciseNumber: props.exerciseNumber,
      totalExercises: props.totalExercises,
      isWorkoutComplete: props.isWorkoutComplete,
      isPaused: props.isPaused,
      isResting: props.isResting,
      canCompleteCurrentSet: props.canCompleteCurrentSet,
    });
  });
};

const handleUserInteraction = (target: string) => {
  const completionAction = parseCompleteCurrentSetTarget(target);

  if (!completionAction) {
    return;
  }

  const result = useWorkoutStore.getState().completeCurrentSet(completionAction);

  if (!result.completedSet) {
    console.warn("Ignored stale Workout Live Activity action:", completionAction);
    return;
  }

  console.log("Workout Live Activity set completed:", {
    ...completionAction,
    completedExercise: result.completedExercise,
    completedWorkout: result.completedWorkout,
  });

  /*
   * The mounted hook will also sync after Zustand updates. Triggering a
   * service-level sync here makes the Live Activity advance immediately,
   * while the payload signature prevents a duplicate native update.
   */
  if (lastSyncedState) {
    void sync(lastSyncedState).catch((error) => {
      console.error("Failed to sync after Workout Live Activity interaction:", error);
    });
  }
};

function ensureUserInteractionListener(): void {
  if (Platform.OS !== "ios" || userInteractionSubscription) {
    return;
  }

  userInteractionSubscription = addUserInteractionListener((event) => {
    handleUserInteraction(event.target);
  });
}

const end = async (): Promise<void> => {
  if (Platform.OS !== "ios") {
    return;
  }

  return enqueueOperation(async () => {
    await endInternal();

    console.log("Workout Live Activity ended");
  });
};

/*
 * Register as soon as this service is imported so an interaction that wakes
 * the app can be handled before the Active Workout screen finishes mounting.
 */
ensureUserInteractionListener();

export const workoutLiveActivityService: WorkoutLiveActivityService = {
  sync,
  end,
};
