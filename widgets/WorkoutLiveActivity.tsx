// import { Text, VStack } from "@expo/ui/swift-ui";
// import { padding } from "@expo/ui/swift-ui/modifiers";
// import { createLiveActivity } from "expo-widgets";

// export type WorkoutLiveActivityProps = {
//   /**
//    * Identifies the active workout.
//    */
//   workoutId: string;

//   /**
//    * Display name of the workout.
//    */
//   workoutName: string;

//   /**
//    * Unix timestamp representing when the workout started.
//    */
//   startedAtMs: number;

//   /**
//    * Current exercise being performed.
//    */
//   exerciseName: string | null;

//   /**
//    * Current set position within the active exercise.
//    *
//    * This should be one-based for display purposes.
//    */
//   setNumber: number;

//   /**
//    * Total number of sets in the active exercise.
//    */
//   totalSets: number;

//   /**
//    * Optional metrics for the current set.
//    */
//   weight?: number;
//   reps?: number;
//   durationSeconds?: number;

//   /**
//    * Unix timestamp representing when the rest timer ends.
//    */
//   restEndsAtMs?: number;

//   /**
//    * Current workout state.
//    */
//   isResting: boolean;
//   isPaused: boolean;
// };

// /**
//  * SDK 55 widget view.
//  *
//  * This function must remain a pure display component. Do not use Zustand,
//  * React hooks, Firestore, Expo Router, or other application services here.
//  */
// function WorkoutLiveActivityView(props: WorkoutLiveActivityProps) {
//   "widget";

//   return {
//     banner: (
//       <VStack modifiers={[padding({ all: 16 })]}>
//         <Text>BUILTMODE</Text>
//         <Text>{props.workoutName || "Active Workout"}</Text>
//       </VStack>
//     ),

//     compactLeading: <Text>BM</Text>,
//     compactTrailing: <Text>GO</Text>,
//     minimal: <Text>BM</Text>,
//   };
// }

// /**
//  * The name passed here must match the Live Activity name configured
//  * for expo-widgets in app.json or app.config.ts.
//  */
// export const WorkoutLiveActivity = createLiveActivity("WorkoutLiveActivity", WorkoutLiveActivityView);

// export default WorkoutLiveActivity;

import { HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import { background, font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";
import { createLiveActivity } from "expo-widgets";

export type WorkoutLiveActivityProps = {
  /**
   * Identifies the active workout.
   */
  workoutId: string;

  /**
   * Display name of the workout.
   */
  workoutName: string;

  /**
   * Unix timestamp representing when the workout started.
   */
  startedAtMs: number;

  /**
   * Current exercise being performed.
   */
  exerciseName: string | null;

  /**
   * Current set position within the active exercise.
   *
   * This should be one-based for display purposes.
   */
  setNumber: number;

  /**
   * Total number of sets in the active exercise.
   */
  totalSets: number;

  /**
   * Optional metrics for the current set.
   */
  weight?: number;
  reps?: number;
  durationSeconds?: number;

  /**
   * Unix timestamp representing when the rest timer ends.
   */
  restEndsAtMs?: number;

  /**
   * Current workout state.
   */
  isResting: boolean;
  isPaused: boolean;
};

/**
 * SDK 55 widget view.
 *
 * This function must remain a pure display component. Do not use Zustand,
 * React hooks, Firestore, Expo Router, or other application services here.
 */
function WorkoutLiveActivityView(props: WorkoutLiveActivityProps) {
  "widget";

  /*
   * Keep values used by the widget inside this function.
   * The widget executes in a separate extension runtime.
   */
  const backgroundColor = "#121212";
  const goldColor = "#D5A63A";
  const whiteColor = "#FFFFFF";
  const mutedColor = "#A3A3A3";

  const formatNumber = (value: number): string => {
    const roundedValue = Math.round(value);

    return value === roundedValue ? `${roundedValue}` : value.toFixed(1);
  };

  const formatDuration = (totalSeconds: number): string => {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

    return `${minutes}:${formattedSeconds}`;
  };

  let metricLabel = "READY";

  if (props.weight != null && props.reps != null) {
    metricLabel = `${formatNumber(props.weight)} LB × ${formatNumber(props.reps)}`;
  } else if (props.reps != null) {
    metricLabel = `${formatNumber(props.reps)} REPS`;
  } else if (props.durationSeconds != null) {
    metricLabel = formatDuration(props.durationSeconds);
  }

  const exerciseLabel = props.exerciseName?.trim() || props.workoutName?.trim() || "Active Workout";

  const displayedSetNumber = props.setNumber > 0 ? props.setNumber : 1;

  const setLabel = props.totalSets > 0 ? `SET ${displayedSetNumber} OF ${props.totalSets}` : "NO ACTIVE SET";

  const activityStatus = props.isPaused ? "PAUSED" : props.isResting ? "REST" : "ACTIVE";

  return {
    banner: (
      <VStack alignment="leading" spacing={12} modifiers={[padding({ all: 16 }), background(backgroundColor)]}>
        <HStack alignment="center">
          <Text
            modifiers={[
              font({
                size: 12,
                weight: "bold",
              }),
              foregroundStyle(goldColor),
            ]}
          >
            BUILTMODE
          </Text>

          <Spacer />

          <Text
            modifiers={[
              font({
                size: 12,
                weight: "semibold",
              }),
              foregroundStyle(props.isPaused ? mutedColor : whiteColor),
            ]}
          >
            {activityStatus}
          </Text>
        </HStack>

        <VStack alignment="leading" spacing={4}>
          <Text
            modifiers={[
              font({
                size: 18,
                weight: "bold",
              }),
              foregroundStyle(whiteColor),
            ]}
          >
            {exerciseLabel}
          </Text>

          <Text
            modifiers={[
              font({
                size: 12,
                weight: "medium",
              }),
              foregroundStyle(mutedColor),
            ]}
          >
            {setLabel}
          </Text>
        </VStack>

        <HStack alignment="center">
          <VStack alignment="leading" spacing={2}>
            <Text
              modifiers={[
                font({
                  size: 10,
                  weight: "medium",
                }),
                foregroundStyle(mutedColor),
              ]}
            >
              CURRENT SET
            </Text>

            <Text
              modifiers={[
                font({
                  size: 22,
                  weight: "bold",
                }),
                foregroundStyle(whiteColor),
              ]}
            >
              {metricLabel}
            </Text>
          </VStack>

          <Spacer />

          <VStack alignment="trailing" spacing={2}>
            <Text
              modifiers={[
                font({
                  size: 10,
                  weight: "medium",
                }),
                foregroundStyle(mutedColor),
              ]}
            >
              STATUS
            </Text>

            <Text
              modifiers={[
                font({
                  size: 16,
                  weight: "bold",
                }),
                foregroundStyle(props.isResting ? goldColor : whiteColor),
              ]}
            >
              {activityStatus}
            </Text>
          </VStack>
        </HStack>
      </VStack>
    ),

    compactLeading: <Image systemName="figure.strengthtraining.traditional" color={goldColor} />,

    compactTrailing: (
      <Text
        modifiers={[
          font({
            size: 13,
            weight: "bold",
          }),
          foregroundStyle(props.isResting ? goldColor : whiteColor),
        ]}
      >
        {props.isResting ? "REST" : props.totalSets > 0 ? `${displayedSetNumber}/${props.totalSets}` : "GO"}
      </Text>
    ),

    minimal: <Image systemName="figure.strengthtraining.traditional" color={goldColor} />,

    expandedLeading: (
      <VStack alignment="leading" spacing={2} modifiers={[padding({ all: 8 })]}>
        <Text
          modifiers={[
            font({
              size: 11,
              weight: "bold",
            }),
            foregroundStyle(goldColor),
          ]}
        >
          BUILTMODE
        </Text>

        <Text
          modifiers={[
            font({
              size: 11,
              weight: "medium",
            }),
            foregroundStyle(mutedColor),
          ]}
        >
          {setLabel}
        </Text>
      </VStack>
    ),

    expandedTrailing: (
      <VStack alignment="trailing" spacing={2} modifiers={[padding({ all: 8 })]}>
        <Text
          modifiers={[
            font({
              size: 10,
              weight: "medium",
            }),
            foregroundStyle(mutedColor),
          ]}
        >
          {props.isResting ? "REST" : "CURRENT SET"}
        </Text>

        <Text
          modifiers={[
            font({
              size: 15,
              weight: "bold",
            }),
            foregroundStyle(props.isResting ? goldColor : whiteColor),
          ]}
        >
          {props.isResting ? "RESTING" : metricLabel}
        </Text>
      </VStack>
    ),

    expandedBottom: (
      <VStack alignment="leading" spacing={4} modifiers={[padding({ all: 8 })]}>
        <Text
          modifiers={[
            font({
              size: 15,
              weight: "bold",
            }),
            foregroundStyle(whiteColor),
          ]}
        >
          {exerciseLabel}
        </Text>

        <Text
          modifiers={[
            font({
              size: 11,
              weight: "medium",
            }),
            foregroundStyle(mutedColor),
          ]}
        >
          Tap to return to your active workout
        </Text>
      </VStack>
    ),
  };
}

/**
 * The name passed here must match the Live Activity name configured
 * for expo-widgets in app.json or app.config.ts.
 */
export const WorkoutLiveActivity = createLiveActivity("WorkoutLiveActivity", WorkoutLiveActivityView);

export default WorkoutLiveActivity;
