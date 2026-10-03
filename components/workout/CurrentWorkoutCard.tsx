import { Border, Colors, Typography } from "@/constants/theme";
import { Exercise, ExerciseMetricType, ExerciseSet, ExerciseUnit } from "@/packages/shared/src";
import { useUserStore } from "@/stores/user-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { Entypo, FontAwesome5, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { v4 as uuidv4 } from "uuid";
import { ThemedText } from "../themed-text";
import DropdownMenu, { DropdownMenuOption } from "../ui/DropdownMenu";
import ThemedButton from "../ui/ThemedButton";
import ChangeExerciseUnitSheet from "./ChangeExerciseUnitSheet";
import ChangeMetricTypeSheet from "./ChangeMetricTypeSheet";
import DistanceSetItem from "./exerciseSetItems/DistanceSetItem";
import DurationSetItem from "./exerciseSetItems/DurationSetItem";
import RepsOnlySetItem from "./exerciseSetItems/RepsOnlySetItem";
import WeightAndRepsSetItem from "./exerciseSetItems/WeightAndRepsSetItem";

type ExerciseSetItemProps = {
  exerciseId: string;
  set: ExerciseSet;
  index: number;
  isActive: boolean;
  type: ExerciseMetricType;
  completedSets: ExerciseSet[];
  exercise: Exercise;
  onEditSet: (exerciseId: string, setId: string, set: ExerciseSet) => void;
  onDeleteSet?: (exerciseId: string, setId: string) => void;
};

const ExerciseSetItem = ({
  set,
  index,
  isActive,
  type,
  completedSets,
  exerciseId,
  exercise,
  onEditSet,
  onDeleteSet,
}: ExerciseSetItemProps) => {
  const isCompleted = useMemo(() => {
    return completedSets.some((completedSet) => completedSet.id === set.id);
  }, [completedSets]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
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
          isActive={isActive}
          isCompleted={isCompleted}
          containerStyle={{
            padding: 0,
            backgroundColor: "transparent",
          }}
          onDeleteSet={onDeleteSet}
          exercise={exercise}
          cascade={false}
          usedForBuilding={false}
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
          isActive={isActive}
          containerStyle={{
            padding: 0,
            backgroundColor: "transparent",
            gap: 15,
          }}
          onDeleteSet={onDeleteSet}
          exercise={exercise}
          cascade={false}
          usedForBuilding={false}
          isCompleted={isCompleted}
        />
      );
    } else if (type === "duration") {
      return (
        <DurationSetItem
          key={set.id}
          set={set}
          setIndex={index}
          onEditSet={onEditSet}
          exerciseId={exerciseId}
          isActive={isActive}
          isCompleted={isCompleted}
          containerStyle={{
            padding: 0,
            backgroundColor: "transparent",
            gap: 15,
          }}
          onDeleteSet={onDeleteSet}
          exercise={exercise}
          cascade={false}
          usedForBuilding={false}
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
          isActive={isActive}
          isCompleted={isCompleted}
          containerStyle={{
            padding: 0,
            backgroundColor: "transparent",
            gap: 15,
          }}
          onDeleteSet={onDeleteSet}
          exercise={exercise}
          cascade={false}
          usedForBuilding={false}
        />
      );
    }
  };

  return (
    <Animated.View
      style={[
        styles.exerciseSetContainer,
        animatedStyle,
        isCompleted
          ? { backgroundColor: Colors.background.primary }
          : {
              borderColor: isActive ? "#c6a34a50" : "transparent",
              borderWidth: isActive ? 2 : 0,
              backgroundColor: isActive ? "#c6a34a0c" : Colors.input,
            },
      ]}
    >
      {content()}
    </Animated.View>
  );
};

type Props = {
  exercise: Exercise;
  index: number;
  onDeleteExercise: (exerciseId: string) => void;
  /**
   * @deprecated Exercise advancement now happens inside completeCurrentSet.
   * Kept temporarily so the existing ActiveWorkout call site still compiles.
   */
  onExerciseComplete: (
    workoutProgress: Record<
      string,
      {
        sets: ExerciseSet[];
        completed: boolean;
      }
    > | null,
  ) => void;
  onChangeMetricType: (exerciseId: string, metricType: ExerciseMetricType) => void;
  onChangeExerciseUnit: (exerciseId: string, exerciseUnit: ExerciseUnit) => void;
  setIsNotesSheetVisible: React.Dispatch<React.SetStateAction<boolean>>;
  scrollToTop: () => void;
};

const CurrentWorkoutCard = ({
  exercise,
  index,
  onDeleteExercise,
  onChangeMetricType,
  setIsNotesSheetVisible,
  onChangeExerciseUnit,
  scrollToTop,
}: Props) => {
  const { updateWorkout, activeWorkoutDraft, updateWorkoutProgress, completeCurrentSet, workoutProgress } =
    useWorkoutStore();
  const { user } = useUserStore();

  const { name, sets, metricType, notes, units } = exercise;

  const [completedSets, setCompletedSets] = useState<ExerciseSet[]>([]);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [isMetricSheetVisible, setIsMetricSheetVisible] = useState(false);
  const [isUnitSheetVisible, setIsUnitSheetVisible] = useState(false);

  const currentSet = useMemo(() => sets[activeSetIndex], [sets, activeSetIndex]);
  const hasNotes = Boolean(notes?.trim());
  const canChangeUnit = metricType === "weight_reps" || metricType === "distance";

  useEffect(() => {
    let sets = workoutProgress && workoutProgress[exercise.id] ? workoutProgress[exercise.id].sets : [];
    setCompletedSets(sets ?? []);
    setActiveSetIndex(sets.length);
  }, [index, exercise.id, workoutProgress]);

  const handleChangeMetricType = useCallback(
    (exerciseId: string, metricType: ExerciseMetricType) => {
      if (workoutProgress && workoutProgress[exerciseId] && workoutProgress[exerciseId].sets.length > 0) {
        return Alert.alert("Are You Sure?", "All exercise progress will be lost.", [
          {
            text: "Continue",
            onPress: () => onChangeMetricType(exerciseId, metricType),
            style: "destructive",
          },
          { text: "Cancel" },
        ]);
      }

      onChangeMetricType(exerciseId, metricType);
    },
    [onChangeMetricType, workoutProgress],
  );

  const handleChangeExerciseUnit = (exerciseUnit: ExerciseUnit) => {
    if (exerciseUnit === units) return;
    onChangeExerciseUnit(exercise.id, exerciseUnit);
  };

  const handleCompleteSet = () => {
    if (!activeWorkoutDraft || !currentSet) return;

    const result = completeCurrentSet({
      workoutId: activeWorkoutDraft.sessionId,
      exerciseId: exercise.id,
      setId: currentSet.id,
    });

    if (!result.completedSet) {
      console.warn("Unable to complete the current workout set because the action was stale.", {
        workoutId: activeWorkoutDraft.sessionId,
        exerciseId: exercise.id,
        setId: currentSet.id,
      });
    }

    result.completedExercise && scrollToTop();
  };

  const getSetCallToActionText = useCallback(() => {
    switch (metricType) {
      case "weight_reps":
      case "calories":
      case "time":
        return "ADD SET";
      case "reps_only":
      case "duration":
        return "ADD ROUND";
      case "distance":
        return "ADD ATTEMPT";
      default:
        return "ADD SET";
    }
  }, [metricType]);

  const getExerciseMetricText = useCallback(() => {
    switch (metricType) {
      case "weight_reps":
        return "Set";
      case "duration":
      case "reps_only":
        return "Round";
      case "distance":
        return "Attempt";

      default:
        return "Set";
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

  const handleAddSet = (exerciseId: string) => {
    if (!user?.uid || !activeWorkoutDraft) return;

    const setId = `${uuidv4()}-set`;

    const set: ExerciseSet = {
      id: setId,
    };

    const updatedExercises = activeWorkoutDraft.exercises.map((e) => {
      if (e.id === exerciseId) {
        return {
          ...e,
          sets: [...e.sets, set],
        };
      }
      return e;
    });

    updateWorkout({
      sessionId: activeWorkoutDraft.sessionId,
      uid: user.uid,
      exercises: updatedExercises,
    });

    workoutProgress &&
      workoutProgress[exerciseId] &&
      updateWorkoutProgress({
        exerciseId,
        sets: workoutProgress[exerciseId].sets,
        completed: false,
      });
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    if (!user?.uid || !activeWorkoutDraft) return;

    const updatedExercises = activeWorkoutDraft.exercises.map((e) => {
      if (e.id === exerciseId) {
        return {
          ...e,
          sets: e.sets.filter((set) => setId !== set.id),
        };
      }

      return e;
    });

    updateWorkout({
      sessionId: activeWorkoutDraft.sessionId,
      uid: user.uid,
      exercises: updatedExercises,
    });

    if (!workoutProgress || !workoutProgress[exerciseId]) return null;

    const currentExercise = updatedExercises.find((e) => e.id === exerciseId);

    let updatedSets = workoutProgress[exerciseId].sets.filter((set) => set.id !== setId);
    const isCompleted = currentExercise?.sets.length === updatedSets.length;

    updateWorkoutProgress({
      exerciseId,
      sets: updatedSets,
      completed: isCompleted,
    });
  };

  const dropDownOptions: DropdownMenuOption[] = useMemo(() => {
    const options = [
      {
        onSelect: () => setIsNotesSheetVisible(true),
        text: hasNotes ? "Edit Note" : "Add Note",
        icon: <FontAwesome5 name="sticky-note" size={10} color={Colors.icon} />,
      },
      {
        onSelect: () => setIsMetricSheetVisible(true),
        text: "Change Metric",
        icon: <FontAwesome6 name="table-list" size={10} color={Colors.icon} />,
      },
      {
        onSelect: () => setIsUnitSheetVisible(true),
        text: "Change Unit",
        icon: <FontAwesome6 name="ruler" size={10} color={Colors.icon} />,
      },
      {
        onSelect: () => onDeleteExercise(exercise.id),
        text: "Delete Exercise",
        icon: <FontAwesome6 name="trash" size={10} color={Colors.error} />,
        menuOptionCustomStyles: { optionText: { color: Colors.error } },
      },
    ];
    return canChangeUnit ? options : options.filter((option) => option.text !== "Change Unit");
  }, [hasNotes, exercise.id, onDeleteExercise]);

  if (!exercise) return null;

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.headerContainer}>
          <View style={styles.listNumContainer}>
            <ThemedText style={styles.listNumText}>{index}</ThemedText>
          </View>

          <ThemedText style={styles.currentText}>CURRENT</ThemedText>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <ThemedText style={styles.setTrackerText}>
              {`${getExerciseMetricText()} ${Math.min(activeSetIndex + 1, sets.length)}`} of {sets.length}
            </ThemedText>

            <DropdownMenu
              renderTriggerItem={<MaterialIcons name="more-horiz" size={22} color={Colors.icon} />}
              options={dropDownOptions}
              menuOptionsCustomStyles={{
                optionsContainer: { width: 140 },
              }}
              menuTriggerStyle={styles.iconContainer}
            />
          </View>
        </View>
      </View>

      <View style={styles.exercisesContainer}>
        <View style={{ gap: 10, paddingTop: 10 }}>
          <ThemedText style={styles.exerciseName}>{name}</ThemedText>
          {hasNotes ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.notePreviewCard}
              onPress={() => setIsNotesSheetVisible(true)}
            >
              <View style={styles.notePreviewIcon}>
                <FontAwesome5 name="sticky-note" size={11} color={Colors.accent.primary} />
              </View>

              <ThemedText style={styles.notePreviewText} numberOfLines={3}>
                {notes}
              </ThemedText>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.listContent}>
          {sets.map((item, index) => (
            <ExerciseSetItem
              key={item.id}
              set={item}
              index={index + 1}
              isActive={index === activeSetIndex}
              type={exercise.metricType}
              completedSets={completedSets}
              exerciseId={exercise.id}
              onEditSet={handleOnEdit}
              onDeleteSet={index > 0 ? handleDeleteSet : undefined}
              exercise={exercise}
            />
          ))}
        </View>
      </View>

      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.addSetButtonContainer} onPress={() => handleAddSet(exercise.id)}>
          <Entypo name="plus" size={14} color={Colors.icon} />
          <ThemedText style={styles.addSetButtonText}>{getSetCallToActionText()}</ThemedText>
        </TouchableOpacity>
        {completedSets.length !== exercise.sets.length && (
          <ThemedButton
            title={
              activeSetIndex >= sets.length - 1
                ? "FINISH EXERCISE"
                : `COMPLETE ${getExerciseMetricText()?.toLocaleUpperCase()}`
            }
            onPress={handleCompleteSet}
          />
        )}
      </View>

      <ChangeMetricTypeSheet
        visible={isMetricSheetVisible}
        exerciseName={name}
        currentMetricType={metricType}
        onClose={() => setIsMetricSheetVisible(false)}
        onSelectMetricType={(metricType) => handleChangeMetricType(exercise.id, metricType)}
      />
      {canChangeUnit && (
        <ChangeExerciseUnitSheet
          visible={isUnitSheetVisible}
          metricType={exercise.metricType}
          currentUnit={exercise.units}
          exerciseName={exercise.name}
          onClose={() => setIsUnitSheetVisible(false)}
          onSelectUnit={handleChangeExerciseUnit}
        />
      )}
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
    letterSpacing: -0.5,
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
    gap: 10,
  },
  notePreviewCard: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: Border.radius.md,
    backgroundColor: "rgba(198, 163, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(198, 163, 74, 0.18)",
  },

  notePreviewIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(198, 163, 74, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  notePreviewText: {
    flex: 1,
    color: Colors.icon,
    fontFamily: Typography.family.primary.medium,
    fontSize: 13,
    lineHeight: 20,
  },

  addSetButtonContainer: {
    flexDirection: "row",
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: Border.radius.md,
  },

  addSetButtonText: {
    color: Colors.icon,
    fontFamily: Typography.family.primary.semibold,
    fontSize: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
});
