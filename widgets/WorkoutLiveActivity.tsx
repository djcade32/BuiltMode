import { ExerciseUnit } from "@/packages/shared/src";
import { Button, HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import {
  background,
  border,
  buttonStyle,
  controlSize,
  cornerRadius,
  font,
  foregroundStyle,
  frame,
  multilineTextAlignment,
  padding,
  resizable,
  tint,
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
   * Position of the active exercise within the workout.
   */
  exerciseNumber: number;
  totalExercises: number;

  /**
   * True after every exercise in the workout has been completed.
   */
  isWorkoutComplete: boolean;

  /**
   * Identifies the active exercise and set used by the interaction target.
   */
  currentExerciseId: string | null;
  currentSetId: string | null;

  /**
   * Whether the current set may be completed from the Live Activity.
   */
  canCompleteCurrentSet: boolean;

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
  distance?: number;
  distanceUnit?: "mi" | "km" | "m";
  units: ExerciseUnit | null;

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

  if (props.isWorkoutComplete) {
    metricLabel = "WORKOUT COMPLETE";
  } else if (props.weight != null && props.reps != null) {
    const unit = props.units ? props.units.toLocaleUpperCase() : "LB";
    metricLabel = `${formatNumber(props.weight)} ${unit} × ${formatNumber(props.reps)}`;
  } else if (props.reps != null) {
    metricLabel = `${formatNumber(props.reps)} REPS`;
  } else if (props.durationSeconds != null) {
    metricLabel = formatDuration(props.durationSeconds);
  } else if (props.distance != null) {
    const unit = props.units ? props.units.toLocaleUpperCase() : "MI";
    metricLabel = `${formatNumber(props.distance)} ${unit}`;
  }

  const exerciseLabel = props.isWorkoutComplete
    ? props.workoutName?.trim() || "Workout"
    : props.exerciseName?.trim() || props.workoutName?.trim() || "Active Workout";

  const displayedExerciseNumber =
    props.totalExercises > 0 ? Math.min(Math.max(props.exerciseNumber, 1), props.totalExercises) : 0;

  const displayedSetNumber = props.setNumber > 0 ? props.setNumber : 1;

  const exerciseTrackerLabel = props.isWorkoutComplete
    ? `${props.totalExercises} OF ${props.totalExercises} EXERCISES`
    : props.totalExercises > 0
      ? `EXERCISE ${displayedExerciseNumber} OF ${props.totalExercises}`
      : "NO EXERCISES";

  const setTrackerLabel = props.isWorkoutComplete
    ? "ALL SETS COMPLETE"
    : props.totalSets > 0
      ? `SET ${displayedSetNumber} OF ${props.totalSets}`
      : "NO ACTIVE SET";

  const metricHeaderLabel = props.isWorkoutComplete ? "STATUS" : "CURRENT SET";

  const completesExercise = props.totalSets > 0 && displayedSetNumber >= props.totalSets;

  const completionButtonLabel = completesExercise ? "FINISH EXERCISE" : "COMPLETE SET";

  const completionTarget =
    !props.isWorkoutComplete && props.canCompleteCurrentSet && props.currentExerciseId && props.currentSetId
      ? [
          "builtmode.complete-current-set",
          encodeURIComponent(props.workoutId),
          encodeURIComponent(props.currentExerciseId),
          encodeURIComponent(props.currentSetId),
        ].join("|")
      : null;

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
        spacing={8}
        modifiers={[
          padding({
            horizontal: 16,
            vertical: 12,
          }),
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

        <VStack alignment="leading" spacing={3}>
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

          <HStack alignment="center">
            <Text
              modifiers={[
                font({
                  size: 11,
                  family: "JetBrainsMono-Medium",
                }),
                foregroundStyle(mutedColor),
              ]}
            >
              {exerciseTrackerLabel}
            </Text>

            <Spacer />

            <Text
              modifiers={[
                font({
                  size: 11,
                  family: "JetBrainsMono-Medium",
                }),
                foregroundStyle(props.isWorkoutComplete ? goldColor : whiteColor),
              ]}
            >
              {setTrackerLabel}
            </Text>
          </HStack>
        </VStack>

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
              {metricHeaderLabel}
            </Text>

            <Text
              modifiers={[
                font({
                  size: props.isWorkoutComplete ? 18 : 20,
                  weight: "bold",
                }),
                foregroundStyle(props.isWorkoutComplete ? goldColor : whiteColor),
              ]}
            >
              {metricLabel}
            </Text>
          </VStack>

          <Spacer />

          {completionTarget ? (
            <Button
              target={completionTarget}
              label={completionButtonLabel}
              systemImage="checkmark"
              modifiers={[buttonStyle("borderedProminent"), controlSize("mini"), tint(goldColor)]}
            />
          ) : null}
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
              size: 10,
              family: "JetBrainsMono-Medium",
            }),
            foregroundStyle(mutedColor),
          ]}
        >
          {exerciseTrackerLabel}
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
              {metricHeaderLabel}
            </Text>

            <Text
              modifiers={[
                font({
                  size: 13,
                  weight: "bold",
                }),
                foregroundStyle(props.isWorkoutComplete ? goldColor : whiteColor),
              ]}
            >
              {metricLabel}
            </Text>
          </VStack>

          <Spacer />

          <VStack alignment="trailing" spacing={4}>
            <Text
              modifiers={[
                font({
                  size: 9,
                  family: "JetBrainsMono-Medium",
                }),
                foregroundStyle(props.isWorkoutComplete ? goldColor : mutedColor),
              ]}
            >
              {setTrackerLabel}
            </Text>

            {completionTarget ? (
              <Button
                target={completionTarget}
                label={completionButtonLabel}
                systemImage="checkmark"
                modifiers={[buttonStyle("borderedProminent"), controlSize("mini"), tint(goldColor)]}
              />
            ) : null}
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
