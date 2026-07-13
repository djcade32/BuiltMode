import type { WorkoutLiveActivityState } from "@/packages/shared/src";
import { getWorkoutWidgetLogoUri } from "@/widgets/getWorkoutWidgetLogoUri";
import WorkoutLiveActivity, { WorkoutLiveActivityProps } from "@/widgets/WorkoutLiveActivity";
import { Platform } from "react-native";

type WorkoutLiveActivityInstance = ReturnType<typeof WorkoutLiveActivity.start>;

export interface WorkoutLiveActivityService {
  sync(state: WorkoutLiveActivityState): Promise<void>;
  end(): Promise<void>;
}

let activeInstance: WorkoutLiveActivityInstance | null = null;
let activeWorkoutId: string | null = null;
let logoUriPromise: Promise<string> | null = null;
let lastPayloadSignature: string | null = null;

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
    logoUriPromise = getWorkoutWidgetLogoUri();
  }

  return logoUriPromise;
};

const createWidgetProps = async (state: WorkoutLiveActivityState): Promise<WorkoutLiveActivityProps> => {
  const logoUri = await getLogoUri();

  return {
    ...state,
    logoUri,
  };
};

const getPayloadSignature = (props: WorkoutLiveActivityProps): string => JSON.stringify(props);

const clearCachedActivity = () => {
  activeInstance = null;
  activeWorkoutId = null;
  lastPayloadSignature = null;
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
      isPaused: props.isPaused,
      isResting: props.isResting,
    });
  });
};

const end = async (): Promise<void> => {
  if (Platform.OS !== "ios") {
    return;
  }

  return enqueueOperation(async () => {
    await endInternal();

    console.log("Workout Live Activity ended");
  });
};

export const workoutLiveActivityService: WorkoutLiveActivityService = {
  sync,
  end,
};
