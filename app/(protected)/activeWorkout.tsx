import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import DropdownMenu, { DropdownMenuOption } from "@/components/ui/DropdownMenu";
import Progressbar from "@/components/ui/Progressbar";
import ThemedButton from "@/components/ui/ThemedButton";
import AddExerciseSheet from "@/components/workout/AddExerciseSheet";
import CurrentWorkoutCard from "@/components/workout/CurrentWorkoutCard";
import NextExerciseItem from "@/components/workout/NextExerciseItem";
import { StopwatchDisplay } from "@/components/workout/StopwatchDisplay";
import WorkoutNoteSheet from "@/components/workout/WorkoutNoteSheet";
import { Border, Colors, Typography } from "@/constants/theme";
import { firstLetterToUpperCase } from "@/lib/utils/string";
import { Exercise, ExerciseMetricType } from "@/packages/shared/src";
import { useUserStore } from "@/stores/user-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { Entypo, FontAwesome5, FontAwesome6, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useStopwatch } from "react-timer-hook";

const getStopwatchOffsetFromStartedAtMs = (startedAtMs?: number | null) => {
  const elapsedMs = startedAtMs ? Math.max(0, Date.now() - startedAtMs) : 0;

  /**
   * react-timer-hook's stopwatch offset works by passing a Date
   * that represents the elapsed offset.
   *
   * If the workout started 10 minutes ago, this returns:
   * now + 10 minutes
   *
   * That makes the stopwatch display 00:10:00 instead of 00:00:00.
   */
  return new Date(Date.now() + elapsedMs);
};

const ActiveWorkout = () => {
  const router = useRouter();

  const { user } = useUserStore();
  const {
    activeWorkoutDraft,
    clearWorkout,
    isWorkoutComplete,
    workoutProgress,
    currentExerciseIndex,
    setCurrentExerciseIndex,
    isLoggingWorkout,
    logWorkout,
    updateWorkout,
    removeExerciseFromWorkoutProgress,
    setIsWorkoutComplete,
    updateWorkoutProgress,
  } = useWorkoutStore();
  const [isWorkoutNoteSheetVisible, setIsWorkoutNoteSheetVisible] = useState(false);
  const [isDropdownOpened, setIsDropdownOpened] = useState<boolean>(false);
  const [workoutNotes, setWorkoutNotes] = useState<string>(activeWorkoutDraft?.notes ?? "");
  const [isAddExerciseSheetOpen, setIsAddExerciseSheetOpen] = useState(false);

  const displayWorkoutName =
    activeWorkoutDraft?.name ?? `${firstLetterToUpperCase(activeWorkoutDraft?.workoutType ?? "")} Workout`;

  const hydratedStopwatchStartedAtRef = useRef<number | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);

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

  const initialStopwatchOffset = useMemo(
    () => getStopwatchOffsetFromStartedAtMs(activeWorkoutDraft?.startedAtMs),
    [activeWorkoutDraft?.startedAtMs],
  );

  const stopwatch = useStopwatch({
    autoStart: Boolean(activeWorkoutDraft),
    interval: 100,
    offsetTimestamp: initialStopwatchOffset,
  });

  const { pause, start, reset, hours, minutes, seconds, isRunning, totalSeconds } = stopwatch;

  useEffect(() => {
    if (!activeWorkoutDraft?.startedAtMs) return;

    if (hydratedStopwatchStartedAtRef.current === activeWorkoutDraft.startedAtMs) {
      return;
    }

    const offsetTimestamp = getStopwatchOffsetFromStartedAtMs(activeWorkoutDraft.startedAtMs);

    reset(offsetTimestamp, true);
    hydratedStopwatchStartedAtRef.current = activeWorkoutDraft.startedAtMs;
  }, [activeWorkoutDraft?.startedAtMs, reset]);

  useEffect(() => {}, [activeWorkoutDraft?.exercises]);

  const completedExercises = useMemo(() => {
    let completedExercises = 0;
    if (!workoutProgress) return completedExercises;
    for (const exercise of Object.values(workoutProgress)) {
      completedExercises = exercise.completed ? completedExercises + 1 : completedExercises;
    }
    return completedExercises;
  }, [workoutProgress]);

  const handleExit = useCallback(() => {
    return Alert.alert("Are You Sure?", "All workout progress will be lost.", [
      {
        text: "Continue",
        onPress: () => clearWorkout(),
        style: "destructive",
      },
      { text: "Cancel" },
    ]);
  }, [clearWorkout]);

  const dropDownOptions: DropdownMenuOption[] = useMemo(
    () => [
      {
        onSelect: () => (isRunning ? pause() : start()),
        text: isRunning ? "Pause" : "Resume",
        icon: <FontAwesome6 name={isRunning ? "pause" : "play"} size={14} color={Colors.icon} />,
      },
      {
        onSelect: () => setIsWorkoutNoteSheetVisible(true),
        text: Boolean(workoutNotes.trim()) ? "Edit Note" : "Add Note",
        icon: <FontAwesome5 name="sticky-note" size={14} color={Colors.icon} />,
      },
      {
        onSelect: () => handleExit(),
        text: "Exit",
        icon: <Ionicons name="exit-outline" size={14} color={Colors.error} />,
        menuOptionCustomStyles: { optionText: { color: Colors.error } },
      },
    ],
    [pause, start, isRunning, handleExit],
  );

  if (!activeWorkoutDraft) return null;

  const handleExerciseCompleted = () => {
    const exerciseLeftToComplete = activeWorkoutDraft.exercises.find((e) => {
      if (workoutProgress && workoutProgress[e.id]) {
        return workoutProgress[e.id].completed === false;
      }

      return true;
    });

    const nextExerciseIndex = currentExerciseIndex + 1;

    if (nextExerciseIndex >= activeWorkoutDraft.exercises.length && !exerciseLeftToComplete) {
      return;
    }

    setCurrentExerciseIndex(
      nextExerciseIndex >= activeWorkoutDraft.exercises.length
        ? activeWorkoutDraft.exercises.findIndex((e) => e.id === exerciseLeftToComplete?.id)
        : nextExerciseIndex,
    );
    scrollViewRef.current?.scrollToEnd({ animated: true });
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

  const handleOpenAddExerciseSheet = () => {
    setIsAddExerciseSheetOpen(true);
  };

  const handleAddExercise = (exercise: Exercise) => {
    if (!user?.uid || !activeWorkoutDraft) return;

    updateWorkout({
      sessionId: activeWorkoutDraft.sessionId,
      uid: user.uid,
      exercises: [...activeWorkoutDraft.exercises, exercise],
    });
    setCurrentExerciseIndex(activeWorkoutDraft.exercises.length);
    setIsWorkoutComplete(false);
  };

  const handleDeleteExercise = (exerciseId: string) => {
    if (!user?.uid || !activeWorkoutDraft) return;
    removeExerciseFromWorkoutProgress(exerciseId);
    const updatedExercises = activeWorkoutDraft.exercises.filter((exercise) => exercise.id !== exerciseId);

    updateWorkout({
      sessionId: activeWorkoutDraft.sessionId,
      uid: user.uid,
      exercises: updatedExercises,
    });

    if (!workoutProgress) return null;

    const isWorkoutComplete = Object.keys(workoutProgress).length === updatedExercises.length;
    setIsWorkoutComplete(isWorkoutComplete);
  };

  const handleChangeMetricType = (exerciseId: string, metricType: ExerciseMetricType) => {
    if (!user?.uid || !activeWorkoutDraft) return;

    const updatedExercises = activeWorkoutDraft.exercises.map((exercise) => {
      if (exerciseId === exercise.id) {
        return {
          ...exercise,
          metricType,
          sets: [],
        };
      }
      return exercise;
    });

    updateWorkout({
      sessionId: activeWorkoutDraft.sessionId,
      uid: user.uid,
      exercises: updatedExercises,
    });

    if (!workoutProgress || !workoutProgress[exerciseId]) return;

    updateWorkoutProgress({
      exerciseId,
      sets: [],
      completed: false,
    });
  };

  const handleChangeExerciseNotes = (note: string, exerciseId: string) => {
    if (!user?.uid || !activeWorkoutDraft) return;

    updateWorkout({
      sessionId: activeWorkoutDraft.sessionId,
      uid: user.uid,
      exercises: activeWorkoutDraft.exercises.map((exercise) => {
        if (exerciseId === exercise.id) {
          return {
            ...exercise,
            notes: note,
          };
        } else {
          return exercise;
        }
      }),
    });
  };

  const handleChangeWorkoutNotes = (note: string) => {
    if (!user?.uid || !activeWorkoutDraft) return;
    setWorkoutNotes(note);
    updateWorkout({
      sessionId: activeWorkoutDraft.sessionId,
      uid: user.uid,
      exercises: activeWorkoutDraft.exercises,
      notes: note,
    });
  };

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: Colors.background.primary,
        position: "relative",
      }}
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
            gap: 12,
            paddingBottom: 15,
            borderBottomWidth: 1,
            borderBottomColor: Colors.cardBorder,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ gap: 3 }}>
              <ThemedText
                style={{
                  fontFamily: Typography.family.secondary.regular,
                  fontSize: 10,
                  letterSpacing: 1,
                  color: Colors.icon,
                }}
              >
                ACTIVE WORKOUT
              </ThemedText>
              <ThemedText style={{ fontFamily: Typography.family.primary.bold, fontSize: 14 }}>
                {activeWorkoutDraft.name ?? `${activeWorkoutDraft.workoutType} Workout`}
              </ThemedText>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={styles.timeContainer}>
                <Animated.View
                  style={[
                    { height: 6, width: 6, borderRadius: 3, backgroundColor: Colors.accent.primary },
                    animatedStyle,
                  ]}
                />
                <StopwatchDisplay hours={hours} minutes={minutes} seconds={seconds} />
              </View>
              <DropdownMenu
                onClose={() => setIsDropdownOpened((prev) => !prev)}
                renderTriggerItem={<MaterialIcons name="more-horiz" size={22} color={Colors.icon} />}
                options={dropDownOptions}
                menuOptionsCustomStyles={{
                  optionsContainer: { width: 125 },
                }}
                menuTriggerStyle={styles.iconContainer}
              />
            </View>
          </View>
          {activeWorkoutDraft.exercises.length ? (
            <View style={{ gap: 5 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <ThemedText
                  style={{
                    fontFamily: Typography.family.secondary.regular,
                    fontSize: 10,
                    letterSpacing: 1,
                    color: Colors.icon,
                  }}
                >
                  PROGRESS
                </ThemedText>
                <ThemedText
                  style={{
                    fontFamily: Typography.family.secondary.semibold,
                    fontSize: 10,
                    color: Colors.accent.primary,
                  }}
                >
                  {completedExercises} / {activeWorkoutDraft.exercises.length} Exercises
                </ThemedText>
              </View>

              <View>
                <Progressbar percentage={(completedExercises / activeWorkoutDraft.exercises.length) * 100} />
              </View>
            </View>
          ) : null}
        </View>
        <ScrollView showsVerticalScrollIndicator={false} ref={scrollViewRef}>
          <View style={styles.exercisesContainer}>
            {workoutNotes ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.workoutNotePreviewCard}
                onPress={() => setIsWorkoutNoteSheetVisible(true)}
              >
                <View style={styles.workoutNotePreviewIcon}>
                  <FontAwesome5 name="sticky-note" size={11} color={Colors.accent.primary} />
                </View>

                <View style={styles.workoutNotePreviewCopy}>
                  <ThemedText style={styles.workoutNotePreviewLabel}>WORKOUT NOTE</ThemedText>
                  <ThemedText style={styles.workoutNotePreviewText}>{workoutNotes}</ThemedText>
                </View>
              </TouchableOpacity>
            ) : null}

            {activeWorkoutDraft.exercises[currentExerciseIndex] && (
              <CurrentWorkoutCard
                exercise={activeWorkoutDraft.exercises[currentExerciseIndex]}
                index={currentExerciseIndex + 1}
                onExerciseComplete={handleExerciseCompleted}
                onChangeExerciseNote={handleChangeExerciseNotes}
                onDeleteExercise={handleDeleteExercise}
                onChangeMetricType={handleChangeMetricType}
              />
            )}

            {activeWorkoutDraft.exercises.length ? (
              <View
                style={{
                  backgroundColor: Colors.background.secondary,
                  borderWidth: 2,
                  borderColor: Colors.inputBorder,
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderBottomColor: Colors.inputBorder,
                    borderBottomWidth: 1,
                  }}
                >
                  <ThemedText
                    style={{
                      fontFamily: Typography.family.secondary.regular,
                      fontSize: 12,
                      color: Colors.icon,
                      letterSpacing: 1,
                    }}
                  >
                    ALL EXERCISES
                  </ThemedText>

                  <TouchableOpacity
                    style={{ flexDirection: "row", gap: 3, alignItems: "center" }}
                    hitSlop={15}
                    onPress={handleOpenAddExerciseSheet}
                  >
                    <Entypo name="plus" size={12} color={Colors.accent.primary} />
                    <ThemedText
                      style={{
                        fontFamily: Typography.family.secondary.regular,
                        fontSize: 12,
                        color: Colors.accent.primary,
                        letterSpacing: 1,
                      }}
                    >
                      EXERCISE
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                <View>
                  {activeWorkoutDraft.exercises.map((exercise) => {
                    const index = activeWorkoutDraft.exercises.findIndex((e) => e.id === exercise.id);

                    const isCompleted = !!(
                      workoutProgress &&
                      workoutProgress[exercise.id] &&
                      workoutProgress[exercise.id].completed
                    );

                    const setsCompleted =
                      workoutProgress && workoutProgress[exercise.id]
                        ? workoutProgress[exercise.id].sets.length
                        : 0;

                    return (
                      <NextExerciseItem
                        key={exercise.id}
                        exercise={exercise}
                        setsCompleted={setsCompleted}
                        onDeleteExercise={handleDeleteExercise}
                        index={index + 1}
                        isNext={index - 1 === currentExerciseIndex}
                        isActive={currentExerciseIndex === index}
                        isCompleted={isCompleted}
                        onPress={() => setCurrentExerciseIndex(index)}
                        isLastExercise={index === activeWorkoutDraft.exercises.length - 1}
                      />
                    );
                  })}
                </View>
              </View>
            ) : (
              <View
                style={{
                  borderRadius: 16,
                  borderColor: Colors.accent.primary,
                  alignItems: "center",
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  gap: 15,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: Colors.background.secondary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FontAwesome5 name="dumbbell" size={18} color={Colors.accent.primary} />
                </View>
                <View style={{ gap: 5 }}>
                  <ThemedText
                    style={{ fontFamily: Typography.family.primary.bold, fontSize: 20, textAlign: "center" }}
                  >
                    No exercises yet.
                  </ThemedText>
                  <ThemedText style={{ color: Colors.icon, fontSize: 12, textAlign: "center" }}>
                    Add exercises as you go
                  </ThemedText>
                </View>

                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    gap: 5,
                    borderColor: Colors.accent.primary,
                    borderWidth: 1,
                    borderRadius: Border.radius.md,
                    paddingVertical: 12,
                    width: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={handleOpenAddExerciseSheet}
                >
                  <Entypo name="plus" size={12} color={Colors.accent.primary} />
                  <ThemedText style={{ color: Colors.accent.primary, fontSize: 12 }}>Add Exercise</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.footerContainer}>
              <ThemedButton
                testID="complete-workout-button"
                title="COMPLETE WORKOUT"
                onPress={handleCompleteWorkout}
                disabled={!isWorkoutComplete || isLoggingWorkout}
                isLoading={isLoggingWorkout}
              />
            </View>
          </View>
        </ScrollView>
      </ThemedView>

      <AddExerciseSheet
        visible={isAddExerciseSheetOpen}
        onClose={() => {
          setIsAddExerciseSheetOpen(false);
        }}
        onSelect={handleAddExercise}
      />
      <WorkoutNoteSheet
        visible={isWorkoutNoteSheetVisible}
        workoutName={displayWorkoutName}
        initialValue={workoutNotes}
        onClose={() => {
          setIsWorkoutNoteSheetVisible(false);
        }}
        onSave={handleChangeWorkoutNotes}
      />
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
    padding: 3,
    width: 100,
    zIndex: 101,
  },

  dropdownOptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 8,
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

  timeContainer: {
    height: 40,
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 8,
  },

  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
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
    gap: 10,
  },

  nextExercisesContainer: {
    gap: 17,
    paddingVertical: 17,
    flexGrow: 1,
  },

  footerContainer: {
    paddingVertical: 20,
  },

  workoutNotePreviewCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: Border.radius.md,
    backgroundColor: "rgba(198, 163, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(198, 163, 74, 0.18)",
  },

  workoutNotePreviewIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(198, 163, 74, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  workoutNotePreviewCopy: {
    flex: 1,
    gap: 4,
  },

  workoutNotePreviewLabel: {
    color: Colors.accent.primary,
    fontSize: 10,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 1.4,
  },

  workoutNotePreviewText: {
    color: Colors.icon,
    fontFamily: Typography.family.primary.medium,
    fontSize: 13,
    lineHeight: 20,
    flexShrink: 1,
  },
});
