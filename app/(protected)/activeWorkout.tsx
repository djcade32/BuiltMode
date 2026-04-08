import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ThemedButton from "@/components/ui/ThemedButton";
import CurrentWorkoutCard from "@/components/workout/CurrentWorkoutCard";
import NextExerciseItem from "@/components/workout/NextExerciseItem";
import { StopwatchDisplay } from "@/components/workout/StopwatchDisplay";
import { Border, Colors, Typography } from "@/constants/theme";
import { Exercise } from "@/packages/shared/src";
import { useWorkoutStore } from "@/stores/workout-store";
import { FontAwesome6, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Menu, MenuOption, MenuOptions, MenuTrigger, renderers } from "react-native-popup-menu";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useStopwatch } from "react-timer-hook";

const ActiveWorkout = () => {
  const router = useRouter();

  const {
    activeWorkoutDraft,
    clearWorkout,
    isWorkoutComplete,
    workoutProgress,
    currentExerciseIndex,
    setCurrentExerciseIndex,
    isLoggingWorkout,
    logWorkout,
  } = useWorkoutStore();

  const opacity = useSharedValue(0.4);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 600 }), withTiming(0.4, { duration: 600 })),
      -1,
      true,
    );

    scale.value = withRepeat(
      withSequence(withTiming(1.4, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      true,
    );
  }, []);

  useEffect(() => {
    if (!activeWorkoutDraft) {
      router.replace("/(protected)/(tabs)/(workout)/log");
    }
  }, [activeWorkoutDraft, router]);

  const [isDropdownOpened, setIsDropdownOpened] = useState<boolean>(false);
  const stopwatch = useStopwatch({ autoStart: true, interval: 100 });
  const { pause, start, hours, minutes, seconds, isRunning, totalSeconds } = stopwatch;

  const DropDown = useCallback(() => {
    return (
      <Menu
        renderer={renderers.ContextMenu}
        rendererProps={{ placement: "bottom" }}
        onClose={() => setIsDropdownOpened(false)}
      >
        <MenuTrigger
          customStyles={{ TriggerTouchableComponent: TouchableOpacity }}
          onPress={() => setIsDropdownOpened((prev) => !prev)}
        >
          <MaterialIcons name="more-horiz" size={22} color={Colors.icon} />
        </MenuTrigger>
        <MenuOptions
          customStyles={{
            optionsContainer: styles.dropdownOptionsContainer,
          }}
        >
          <MenuOption
            onSelect={() => (isRunning ? pause() : start())}
            customStyles={{
              OptionTouchableComponent: TouchableOpacity,
              optionWrapper: styles.dropdownOptionContainer,
            }}
          >
            <View style={{ width: 15 }}>
              <FontAwesome6 name={isRunning ? "pause" : "play"} size={20} color={Colors.icon} />
            </View>
            <ThemedText style={styles.dropdownOptionText}>
              {isRunning ? "PAUSE" : "RESUME"}
            </ThemedText>
          </MenuOption>
          <MenuOption
            onSelect={handleExit}
            customStyles={{
              OptionTouchableComponent: TouchableOpacity,
              optionWrapper: styles.dropdownOptionContainer,
            }}
          >
            <View style={{ marginLeft: -1 }}>
              <Ionicons name="exit-outline" size={20} color={Colors.icon} />
            </View>
            <ThemedText style={styles.dropdownOptionText}>EXIT</ThemedText>
          </MenuOption>
        </MenuOptions>
      </Menu>
    );
  }, [pause, clearWorkout, isRunning]);

  if (!activeWorkoutDraft) return null;

  const handleExerciseCompleted = (exercise: Exercise) => {
    const exerciseLeftToComplete = activeWorkoutDraft.exercises.find((e) => {
      if (workoutProgress && workoutProgress[e.id]) {
        return workoutProgress[e.id].completed === false;
      }
      return true;
    });

    const nextExerciseIndex = currentExerciseIndex + 1;
    if (nextExerciseIndex >= activeWorkoutDraft.exercises.length && !exerciseLeftToComplete) return;
    setCurrentExerciseIndex(
      nextExerciseIndex >= activeWorkoutDraft.exercises.length
        ? activeWorkoutDraft.exercises.findIndex((e) => e.id === exerciseLeftToComplete?.id)
        : nextExerciseIndex,
    );
  };

  const handleCompleteWorkout = async () => {
    try {
      pause();
      const response = await logWorkout(totalSeconds);
      if (response) {
        console.log("Workout logged: ", response);
        router.replace("/(protected)/workoutComplete");
      }
    } catch (error) {
      console.error("Error logging workout: ", error);
    }
  };

  const handleExit = () => {
    return Alert.alert("Are You Sure?", "All workout progress will be lost.", [
      { text: "Continue", onPress: () => clearWorkout(), style: "destructive" },
      { text: "Cancel" },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.primary, position: "relative" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {isDropdownOpened && (
        <View
          style={{
            backgroundColor: Colors.background.primary,
            opacity: 0.8,
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
          }}
        />
      )}
      <ThemedView style={styles.container}>
        <View
          style={{
            paddingHorizontal: 24,
            gap: 24,
            paddingBottom: 5,
            borderBottomWidth: 1,
            borderBottomColor: Colors.cardBorder,
          }}
        >
          <View style={styles.headerContainer}>
            <View style={{ gap: 5, flexDirection: "row", alignItems: "center" }}>
              <Animated.View style={[styles.lockedInCircle, animatedStyle]} />
              <ThemedText style={styles.lockedInText}>ACTIVE MODE</ThemedText>
            </View>
            <TouchableOpacity style={styles.moreButtonContainer}>
              <DropDown />
            </TouchableOpacity>
          </View>

          <StopwatchDisplay hours={hours} minutes={minutes} seconds={seconds} />
        </View>

        <View style={styles.exercisesContainer}>
          {!isWorkoutComplete && (
            <CurrentWorkoutCard
              exercise={activeWorkoutDraft.exercises[currentExerciseIndex]}
              index={currentExerciseIndex + 1}
              onExerciseComplete={handleExerciseCompleted}
            />
          )}

          <FlatList
            showsVerticalScrollIndicator={false}
            ListFooterComponentStyle={{ flex: 1, justifyContent: "flex-end" }}
            ListFooterComponent={
              <View style={styles.footerContainer}>
                <ThemedButton
                  title="COMPLETE WORKOUT"
                  onPress={handleCompleteWorkout}
                  disabled={!isWorkoutComplete || isLoggingWorkout}
                />
              </View>
            }
            contentContainerStyle={styles.nextExercisesContainer}
            data={
              !isWorkoutComplete
                ? activeWorkoutDraft.exercises.filter(
                    (exercise) =>
                      exercise.id !== activeWorkoutDraft.exercises[currentExerciseIndex].id,
                  )
                : activeWorkoutDraft.exercises
            }
            renderItem={(exercise) => {
              const index = activeWorkoutDraft.exercises.findIndex(
                (e) => e.id === exercise.item.id,
              );
              const isCompleted = !!(
                workoutProgress &&
                workoutProgress[exercise.item.id] &&
                workoutProgress[exercise.item.id].completed
              );

              return (
                <NextExerciseItem
                  exercise={exercise.item}
                  index={index + 1}
                  isNext={index - 1 === currentExerciseIndex}
                  isCompleted={isCompleted}
                  onPress={() => setCurrentExerciseIndex(index)}
                />
              );
            }}
          />
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

export default ActiveWorkout;

const styles = StyleSheet.create({
  container: {
    paddingTop: 54,
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dropdownOptionsContainer: {
    backgroundColor: Colors.input,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    padding: 8,
    width: 100,
    zIndex: 101,
  },
  dropdownOptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dropdownOptionText: {
    fontSize: 12,
    color: Colors.gray,
    letterSpacing: 0.6,
  },
  lockedInCircle: {
    backgroundColor: Colors.accent.primary,
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  lockedInText: {
    fontSize: 12,
    fontFamily: Typography.family.primary.semibold,
    color: Colors.accent.primary,
    letterSpacing: 1.8,
  },
  moreButtonContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.md,
    alignItems: "center",
    justifyContent: "center",
    height: 32,
    width: 32,
  },
  timer: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 60,
    letterSpacing: -1.5,
    textAlign: "center",
  },
  activeModeText: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 12,
    color: Colors.icon,
    letterSpacing: 1.8,
  },
  exercisesContainer: {
    paddingHorizontal: 24,
    paddingTop: 17,
    flex: 1,
  },
  nextExercisesContainer: {
    gap: 17,
    paddingVertical: 17,
    flex: 1,
  },
  footerContainer: {
    paddingVertical: 20,
  },
});
