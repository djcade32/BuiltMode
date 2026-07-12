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

const COLORS = {
  background: "#121212",
  gold: "#D5A63A",
  white: "#FFFFFF",
  muted: "#A3A3A3",
} as const;

/**
 * Returns the primary metric shown for the current set.
 */
function getMetricLabel(props: WorkoutLiveActivityProps): string {
  if (props.weight != null && props.reps != null) {
    return `${formatNumber(props.weight)} LB × ${formatNumber(props.reps)}`;
  }

  if (props.reps != null) {
    return `${formatNumber(props.reps)} REPS`;
  }

  if (props.durationSeconds != null) {
    return formatDuration(props.durationSeconds);
  }

  return "READY";
}

/**
 * Avoids displaying unnecessary trailing decimals.
 *
 * Examples:
 * 225    -> "225"
 * 22.5   -> "22.5"
 */
function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

/**
 * Formats a duration as MM:SS.
 */
function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * SDK 55 widget view.
 *
 * This function must remain a pure display component. Do not use Zustand,
 * React hooks, Firestore, Expo Router, or other application services here.
 */
function WorkoutLiveActivityView(props: WorkoutLiveActivityProps) {
  "widget";

  const exerciseLabel = props.exerciseName?.trim() || props.workoutName || "Active Workout";

  const setLabel =
    props.totalSets > 0 ? `SET ${Math.max(props.setNumber, 1)} OF ${props.totalSets}` : "NO ACTIVE SET";

  const metricLabel = getMetricLabel(props);

  const activityStatus = props.isPaused ? "PAUSED" : props.isResting ? "REST" : "ACTIVE";

  return {
    /**
     * Lock Screen and notification banner presentation.
     */
    banner: (
      <VStack alignment="leading" spacing={12} modifiers={[padding({ all: 16 }), background(COLORS.background)]}>
        <HStack alignment="center">
          <Text
            modifiers={[
              font({
                size: 12,
                weight: "bold",
              }),
              foregroundStyle(COLORS.gold),
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
              foregroundStyle(props.isPaused ? COLORS.muted : COLORS.white),
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
              foregroundStyle(COLORS.white),
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
              foregroundStyle(COLORS.muted),
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
                foregroundStyle(COLORS.muted),
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
                foregroundStyle(COLORS.white),
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
                foregroundStyle(COLORS.muted),
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
                foregroundStyle(props.isResting ? COLORS.gold : COLORS.white),
              ]}
            >
              {activityStatus}
            </Text>
          </VStack>
        </HStack>
      </VStack>
    ),

    /**
     * Dynamic Island compact presentation.
     */
    compactLeading: <Image systemName="figure.strengthtraining.traditional" color={COLORS.gold} />,

    compactTrailing: (
      <Text
        modifiers={[
          font({
            size: 13,
            weight: "bold",
          }),
          foregroundStyle(props.isResting ? COLORS.gold : COLORS.white),
        ]}
      >
        {props.isResting
          ? "REST"
          : props.totalSets > 0
            ? `${Math.max(props.setNumber, 1)}/${props.totalSets}`
            : "GO"}
      </Text>
    ),

    /**
     * Dynamic Island minimal presentation.
     */
    minimal: <Image systemName="figure.strengthtraining.traditional" color={COLORS.gold} />,

    /**
     * Dynamic Island expanded leading region.
     */
    expandedLeading: (
      <VStack alignment="leading" spacing={2} modifiers={[padding({ all: 8 })]}>
        <Text
          modifiers={[
            font({
              size: 11,
              weight: "bold",
            }),
            foregroundStyle(COLORS.gold),
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
            foregroundStyle(COLORS.muted),
          ]}
        >
          {setLabel}
        </Text>
      </VStack>
    ),

    /**
     * Dynamic Island expanded trailing region.
     */
    expandedTrailing: (
      <VStack alignment="trailing" spacing={2} modifiers={[padding({ all: 8 })]}>
        <Text
          modifiers={[
            font({
              size: 10,
              weight: "medium",
            }),
            foregroundStyle(COLORS.muted),
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
            foregroundStyle(props.isResting ? COLORS.gold : COLORS.white),
          ]}
        >
          {props.isResting ? "RESTING" : metricLabel}
        </Text>
      </VStack>
    ),

    /**
     * Dynamic Island expanded bottom region.
     */
    expandedBottom: (
      <VStack alignment="leading" spacing={4} modifiers={[padding({ all: 8 })]}>
        <Text
          modifiers={[
            font({
              size: 15,
              weight: "bold",
            }),
            foregroundStyle(COLORS.white),
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
            foregroundStyle(COLORS.muted),
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
