import { HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  background,
  border,
  cornerRadius,
  font,
  foregroundStyle,
  frame,
  multilineTextAlignment,
  padding,
  resizable,
  widgetAccentedRenderingMode,
} from "@expo/ui/swift-ui/modifiers";
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
   * Original Unix timestamp representing when the workout began.
   */
  startedAtMs: number;

  /**
   * Effective start point for the running timer.
   *
   * This may differ from startedAtMs after pausing and resuming.
   */
  timerStartedAtMs: number;

  /**
   * Elapsed workout time at the moment this state was created.
   *
   * Used to freeze the timer while the workout is paused.
   */
  elapsedSeconds: number;

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

  /**
   * Shared App Group URI for the BuiltMode logo.
   */
  logoUri: string;
};

/**
 * SDK 56 widget view.
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
  const backgroundColor = "#0F1113";
  const goldColor = "#C6A34A";
  const whiteColor = "#FFFFFF";
  const mutedColor = "#6B7280";
  const borderColor = "#1F2228";

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

  /*
   * SwiftUI requires a closed date range for the native timer.
   * Seven days is safely beyond a normal workout duration.
   */
  const timerLowerDate = new Date(props.timerStartedAtMs);

  const timerUpperDate = new Date(props.timerStartedAtMs + 7 * 24 * 60 * 60 * 1000);

  /*
   * Freeze the displayed timer at the current elapsed duration
   * whenever the workout is paused.
   */
  const timerPauseDate = props.isPaused
    ? new Date(props.timerStartedAtMs + Math.max(0, props.elapsedSeconds) * 1000)
    : undefined;

  return {
    /**
     * Lock Screen Live Activity.
     */
    banner: (
      <VStack
        alignment="leading"
        spacing={12}
        modifiers={[
          padding({ all: 16 }),
          background(backgroundColor),
          border({
            color: borderColor,
            width: 1,
          }),
          cornerRadius(18),
        ]}
      >
        <HStack alignment="center">
          <Image
            uiImage={props.logoUri}
            modifiers={[
              resizable(),
              widgetAccentedRenderingMode("fullColor"),
              frame({
                width: 105,
                height: 18,
              }),
            ]}
          />

          <Spacer />

          <VStack
            alignment="trailing"
            spacing={2}
            modifiers={[
              frame({
                width: 92,
                alignment: "trailing",
              }),
            ]}
          >
            <Text
              modifiers={[
                font({
                  size: 9,
                  family: "JetBrainsMono-Medium",
                }),
                foregroundStyle(mutedColor),
                multilineTextAlignment("trailing"),
                frame({
                  width: 92,
                  alignment: "trailing",
                }),
              ]}
            >
              DURATION
            </Text>

            <Text
              timerInterval={{
                lower: timerLowerDate,
                upper: timerUpperDate,
              }}
              countsDown={false}
              pauseTime={timerPauseDate}
              modifiers={[
                font({
                  design: "monospaced",
                  size: 16,
                  weight: "bold",
                }),
                foregroundStyle(props.isPaused ? mutedColor : goldColor),
                multilineTextAlignment("trailing"),
                frame({
                  width: 92,
                  alignment: "trailing",
                }),
              ]}
            />
          </VStack>
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
                family: "JetBrainsMono-Medium",
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
                  family: "JetBrainsMono-Medium",
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
                  family: "JetBrainsMono-Medium",
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

    /**
     * Dynamic Island compact leading region.
     */
    compactLeading: <Image systemName="figure.strengthtraining.traditional" color={goldColor} />,

    /**
     * Dynamic Island compact trailing region.
     */
    compactTrailing: (
      <Text
        timerInterval={{
          lower: timerLowerDate,
          upper: timerUpperDate,
        }}
        countsDown={false}
        pauseTime={timerPauseDate}
        modifiers={[
          font({
            design: "monospaced",
            size: 12,
            weight: "bold",
          }),
          foregroundStyle(props.isPaused ? mutedColor : goldColor),
        ]}
      />
    ),

    /**
     * Dynamic Island minimal region.
     */
    minimal: <Image systemName="figure.strengthtraining.traditional" color={goldColor} />,

    /**
     * Dynamic Island expanded leading region.
     */
    expandedLeading: (
      <VStack alignment="leading" spacing={2} modifiers={[padding({ all: 8 })]}>
        <Image
          uiImage={props.logoUri}
          modifiers={[
            resizable(),
            widgetAccentedRenderingMode("fullColor"),
            frame({
              width: 105,
              height: 18,
            }),
          ]}
        />

        <Text
          modifiers={[
            font({
              size: 11,
              family: "JetBrainsMono-Medium",
            }),
            foregroundStyle(mutedColor),
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
              size: 9,
              family: "JetBrainsMono-Medium",
            }),
            foregroundStyle(mutedColor),
          ]}
        >
          DURATION
        </Text>

        <Text
          timerInterval={{
            lower: timerLowerDate,
            upper: timerUpperDate,
          }}
          countsDown={false}
          pauseTime={timerPauseDate}
          modifiers={[
            font({
              design: "monospaced",
              size: 15,
              weight: "bold",
            }),
            foregroundStyle(props.isPaused ? mutedColor : goldColor),
          ]}
        />
      </VStack>
    ),

    /**
     * Dynamic Island expanded bottom region.
     */
    expandedBottom: (
      <VStack
        alignment="leading"
        spacing={6}
        modifiers={[
          padding({ all: 8 }),
          border({
            color: borderColor,
            width: 1,
          }),
        ]}
      >
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

        <HStack alignment="center">
          <VStack alignment="leading" spacing={2}>
            <Text
              modifiers={[
                font({
                  size: 9,
                  family: "JetBrainsMono-Medium",
                }),
                foregroundStyle(mutedColor),
              ]}
            >
              CURRENT SET
            </Text>

            <Text
              modifiers={[
                font({
                  size: 13,
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
                  size: 9,
                  family: "JetBrainsMono-Medium",
                }),
                foregroundStyle(mutedColor),
              ]}
            >
              STATUS
            </Text>

            <Text
              modifiers={[
                font({
                  size: 12,
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
  };
}

/**
 * The name passed here must match the Live Activity name configured
 * for expo-widgets in app.json or app.config.ts.
 */
export const WorkoutLiveActivity = createLiveActivity("WorkoutLiveActivity", WorkoutLiveActivityView);

export default WorkoutLiveActivity;
