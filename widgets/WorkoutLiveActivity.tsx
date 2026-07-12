import { HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";

import { background, font, foregroundStyle, padding } from "@expo/ui/swift-ui/modifiers";

import { createLiveActivity, type LiveActivityEnvironment } from "expo-widgets";

export type WorkoutLiveActivityProps = {
  workoutId: string;
  workoutName: string;

  startedAtMs: number;

  exerciseName: string | null;
  setNumber: number;
  totalSets: number;

  weight?: number;
  reps?: number;

  restEndsAtMs?: number;
  isResting: boolean;
  isPaused: boolean;
};

const GOLD = "#D5A63A";
const GRAPHITE = "#121212";
const MUTED_TEXT = "#A3A3A3";

function WorkoutLiveActivity(props: WorkoutLiveActivityProps, environment: LiveActivityEnvironment) {
  "widget";

  const currentSetLabel = props.totalSets > 0 ? `SET ${props.setNumber} OF ${props.totalSets}` : "NO ACTIVE SET";

  const setMetricLabel =
    props.weight != null && props.reps != null
      ? `${props.weight} LB × ${props.reps}`
      : props.reps != null
        ? `${props.reps} REPS`
        : "READY";

  return {
    /**
     * Lock Screen Live Activity
     */
    banner: (
      <VStack alignment="leading" spacing={10} modifiers={[padding({ all: 16 }), background(GRAPHITE)]}>
        <HStack alignment="center">
          <Text modifiers={[font({ weight: "bold", size: 12 }), foregroundStyle(GOLD)]}>BUILTMODE</Text>

          <Spacer />

          <Text modifiers={[font({ weight: "medium", size: 13 }), foregroundStyle("#FFFFFF")]}>
            {props.isPaused ? "PAUSED" : "ACTIVE"}
          </Text>
        </HStack>

        <VStack alignment="leading" spacing={4}>
          <Text modifiers={[font({ weight: "bold", size: 18 }), foregroundStyle("#FFFFFF")]}>
            {props.exerciseName ?? props.workoutName}
          </Text>

          <Text modifiers={[font({ weight: "medium", size: 12 }), foregroundStyle(MUTED_TEXT)]}>
            {currentSetLabel}
          </Text>
        </VStack>

        <HStack alignment="center">
          <Text modifiers={[font({ weight: "bold", size: 22 }), foregroundStyle("#FFFFFF")]}>
            {setMetricLabel}
          </Text>

          <Spacer />

          <VStack alignment="trailing" spacing={2}>
            <Text modifiers={[font({ weight: "medium", size: 11 }), foregroundStyle(MUTED_TEXT)]}>
              {props.isResting ? "REST" : "WORKOUT"}
            </Text>

            <Text
              modifiers={[font({ weight: "bold", size: 18 }), foregroundStyle(props.isResting ? GOLD : "#FFFFFF")]}
            >
              {props.isResting ? "01:30" : "18:42"}
            </Text>
          </VStack>
        </HStack>
      </VStack>
    ),

    /**
     * Dynamic Island — compact view
     */
    compactLeading: <Image systemName="figure.strengthtraining.traditional" color={GOLD} />,

    compactTrailing: (
      <Text modifiers={[font({ weight: "bold", size: 13 }), foregroundStyle("#FFFFFF")]}>
        {props.isResting ? "REST" : `${props.setNumber}/${props.totalSets}`}
      </Text>
    ),

    /**
     * Dynamic Island — smallest presentation
     */
    minimal: <Image systemName="figure.strengthtraining.traditional" color={GOLD} />,

    /**
     * Dynamic Island — expanded presentation
     */
    expandedLeading: (
      <VStack alignment="leading" spacing={2} modifiers={[padding({ all: 8 })]}>
        <Text modifiers={[font({ weight: "bold", size: 11 }), foregroundStyle(GOLD)]}>BUILTMODE</Text>

        <Text modifiers={[font({ weight: "medium", size: 12 }), foregroundStyle("#FFFFFF")]}>
          {currentSetLabel}
        </Text>
      </VStack>
    ),

    expandedTrailing: (
      <VStack alignment="trailing" spacing={2} modifiers={[padding({ all: 8 })]}>
        <Text modifiers={[font({ weight: "medium", size: 10 }), foregroundStyle(MUTED_TEXT)]}>
          {props.isResting ? "REST" : "ACTIVE"}
        </Text>

        <Text
          modifiers={[font({ weight: "bold", size: 16 }), foregroundStyle(props.isResting ? GOLD : "#FFFFFF")]}
        >
          {props.isResting ? "01:30" : setMetricLabel}
        </Text>
      </VStack>
    ),

    expandedBottom: (
      <VStack alignment="leading" spacing={4} modifiers={[padding({ all: 8 })]}>
        <Text modifiers={[font({ weight: "bold", size: 15 }), foregroundStyle("#FFFFFF")]}>
          {props.exerciseName ?? props.workoutName}
        </Text>

        <Text modifiers={[font({ weight: "medium", size: 12 }), foregroundStyle(MUTED_TEXT)]}>
          Tap to return to your active workout
        </Text>
      </VStack>
    ),
  };
}

export default createLiveActivity("WorkoutLiveActivity", WorkoutLiveActivity);
