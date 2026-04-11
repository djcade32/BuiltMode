import { Border, Colors, Typography } from "@/constants/theme";
import { Exercise, ExerciseMetricType, ExerciseSet } from "@/packages/shared/src";
import { useUserStore } from "@/stores/user-store";
import { useWorkoutStore } from "@/stores/workout-store";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { ThemedText } from "../themed-text";
import ThemedButton from "../ui/ThemedButton";
import DistanceSetItem from "./ExerciseSetItems/DistanceSetItem";
import RepsOnlySetItem from "./ExerciseSetItems/RepsOnlySetItem";
import WeightAndRepsSetItem from "./ExerciseSetItems/WeightAndRepsSetItem";

type Props = {
  exercise: Exercise;
  index: number;
  onExerciseComplete: (exercise: Exercise) => void;
};

type ExerciseSetItemProps = {
  exerciseId: string;
  set: ExerciseSet;
  index: number;
  isActive: boolean;
  type: ExerciseMetricType;
  completedSets: ExerciseSet[];
  onEditSet: (exerciseId: string, setId: string, set: ExerciseSet) => void;
};

const ExerciseSetItem = ({
  set,
  index,
  isActive,
  type,
  completedSets,
  exerciseId,
  onEditSet,
}: ExerciseSetItemProps) => {
  const isCompleted = useMemo(() => {
    return completedSets.some((completedSet) => completedSet.id === set.id);
  }, [completedSets]);

  const isLastSet = useMemo(() => completedSets.length === index + 1, [completedSets, index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isActive || isCompleted ? 1 : 0.2, { duration: 180 }),
      transform: [{ scale: withTiming(isActive || isCompleted ? 1 : 0.98, { duration: 180 }) }],
    };
  }, [isActive, isCompleted]);

  const content = () => {
    if (type === "weight_reps") {
      return (
        <WeightAndRepsSetItem
          key={set.id}
          set={set}
          exerciseId={exerciseId}
          setIndex={index}
          onEditSet={onEditSet}
          usedForBuilding={false}
          isActive={isActive || isLastSet}
          isCompleted={isCompleted}
          containerStyle={{
            padding: 0,
            backgroundColor: "transparent",
            gap: 15,
          }}
        />
      );
    } else if (type === "distance") {
      return (
        <DistanceSetItem
          key={set.id}
          set={set}
          setIndex={index}
          onEditSet={onEditSet}
          exerciseId={exerciseId}
          usedForBuilding={false}
          isActive={isActive || isLastSet}
          containerStyle={{
            padding: 0,
            backgroundColor: "transparent",
            gap: 15,
          }}
        />
      );
    } else if (type === "reps_only") {
      return (
        <RepsOnlySetItem
          key={set.id}
          set={set}
          setIndex={index}
          onEditSet={onEditSet}
          exerciseId={exerciseId}
          usedForBuilding={false}
          isActive={isActive || isLastSet}
          isCompleted={isCompleted}
          containerStyle={{
            padding: 0,
            backgroundColor: "transparent",
            gap: 15,
          }}
        />
      );
    }
  };

  return (
    <Animated.View
      style={[
        styles.exerciseSetContainer,
        animatedStyle,
        { backgroundColor: isCompleted ? Colors.background.primary : "#c6a34a0c" },
      ]}
    >
      {content()}
    </Animated.View>
  );
};

const CurrentWorkoutCard = ({ exercise, index, onExerciseComplete }: Props) => {
  const { updateWorkout, activeWorkoutDraft, updateWorkoutProgress, workoutProgress } =
    useWorkoutStore();
  const { user } = useUserStore();

  const { name, sets, metricType } = exercise;

  const [completedSets, setCompletedSets] = useState<ExerciseSet[]>([]);
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  const listRef = useRef<FlatList<ExerciseSet>>(null);

  const currentSet = useMemo(() => sets[activeSetIndex], [sets, activeSetIndex]);

  useEffect(() => {
    let sets =
      workoutProgress && workoutProgress[exercise.id] ? workoutProgress[exercise.id].sets : [];
    setCompletedSets(sets ?? []);
    setActiveSetIndex(sets.length);
  }, [index, exercise.id, workoutProgress]);

  const handleCompleteSet = () => {
    if (!currentSet) return;

    setCompletedSets((prev) => [...prev, currentSet]);
    const updatedSets =
      workoutProgress && workoutProgress[exercise.id]
        ? [...workoutProgress[exercise.id].sets, currentSet]
        : [currentSet];
    updateWorkoutProgress({
      exerciseId: exercise.id,
      sets: updatedSets,
    });

    const nextIndex = activeSetIndex + 1;

    if (nextIndex < sets.length) {
      setActiveSetIndex(nextIndex);

      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0,
          viewOffset: 10,
        });
      });
    }
  };

  const handleFinishExercise = () => {
    if (!currentSet) {
      // All sets already completed, just mark exercise as finished
      updateWorkoutProgress({
        exerciseId: exercise.id,
        sets: workoutProgress?.[exercise.id]?.sets ?? [],
        completed: true,
      });
      onExerciseComplete(exercise);
      return;
    }

    const updatedSets =
      workoutProgress && workoutProgress[exercise.id]
        ? [...workoutProgress[exercise.id].sets, currentSet]
        : [currentSet];
    updateWorkoutProgress({
      exerciseId: exercise.id,
      sets: updatedSets,
      completed: true,
    });
    onExerciseComplete(exercise);
  };

  const getExerciseMetricText = useCallback(() => {
    switch (metricType) {
      case "weight_reps":
        return "Set";
      case "reps_only":
        return "Round";
      case "distance":
        return "Effort";

      default:
        break;
    }
  }, [metricType]);

  const handleOnEdit = (exerciseId: string, setId: string, updatedSet: ExerciseSet) => {
    if (!user?.uid || !activeWorkoutDraft) return;

    const updatedExercises = activeWorkoutDraft.exercises.map((e) => {
      if (e.id === exerciseId) {
        return {
          ...e,
          sets: e.sets.map((set) => (set.id === setId ? updatedSet : set)),
        };
      }
      return e;
    });

    updateWorkout({
      sessionId: activeWorkoutDraft.sessionId,
      uid: user.uid,
      exercises: updatedExercises,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.headerContainer}>
          <View style={styles.listNumContainer}>
            <ThemedText style={styles.listNumText}>{index}</ThemedText>
          </View>

          <ThemedText style={styles.currentText}>CURRENT</ThemedText>

          <ThemedText style={styles.setTrackerText}>
            {`${getExerciseMetricText()} ${Math.min(activeSetIndex + 1, sets.length)}`} of{" "}
            {sets.length}
          </ThemedText>
        </View>

        <ThemedText style={styles.exerciseName}>{name}</ThemedText>
      </View>

      <View style={styles.exercisesContainer}>
        <FlatList
          ref={listRef}
          data={sets}
          keyExtractor={(set) => set.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <ExerciseSetItem
              set={item}
              index={index + 1}
              isActive={index === activeSetIndex}
              type={exercise.metricType}
              completedSets={completedSets}
              exerciseId={exercise.id}
              onEditSet={handleOnEdit}
            />
          )}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0,
              });
            }, 100);
          }}
        />
      </View>

      <View style={styles.footerContainer}>
        <ThemedButton
          title={
            activeSetIndex >= sets.length - 1
              ? "FINISH EXERCISE"
              : `COMPLETE ${getExerciseMetricText()?.toLocaleUpperCase()}`
          }
          onPress={activeSetIndex >= sets.length - 1 ? handleFinishExercise : handleCompleteSet}
        />
      </View>
    </View>
  );
};

export default CurrentWorkoutCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 2,
    borderColor: Colors.accent.primary,
    borderRadius: 16,
    overflow: "hidden",
  },
  topSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#c6a34a0c",
    borderBottomColor: "#c6a34a38",
    borderBottomWidth: 1,
    gap: 5,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 7,
  },
  listNumContainer: {
    backgroundColor: Colors.accent.primary,
    justifyContent: "center",
    alignItems: "center",
    height: 24,
    width: 24,
    borderRadius: 6,
  },
  listNumText: {
    color: Colors.background.primary,
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
  },
  currentText: {
    color: Colors.accent.primary,
    fontFamily: Typography.family.primary.semibold,
    fontSize: 12,
    letterSpacing: 1.8,
    flex: 1,
  },
  setTrackerText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.icon,
  },
  exerciseName: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 20,
  },
  exercisesContainer: {
    paddingHorizontal: 20,
  },
  list: {
    maxHeight: 250,
  },
  listContent: {
    paddingTop: 20,
    gap: 12,
    paddingBottom: 8,
  },
  exerciseSetContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#c6a34a0c",
    borderColor: "#c6a34a50",
    borderWidth: 2,
    borderRadius: Border.radius.md,
    padding: 10,
    gap: 20,
  },
  checkmarkIconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c6a34a38",
    borderRadius: Border.radius.md,
  },
  exerciseSetSetText: {
    color: Colors.icon,
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  exerciseSetInputs: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // ...Debug[1],
    gap: 15,
  },
  setInput: {
    backgroundColor: Colors.background.primary,
    borderColor: Colors.inputBorder,
    width: 75,
    gap: 2,
    paddingHorizontal: 8,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
