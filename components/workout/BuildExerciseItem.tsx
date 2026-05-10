import { Border, Colors, Typography } from "@/constants/theme";
import { Exercise, ExerciseMetricType, ExerciseSet } from "@/packages/shared/src";
import { Entypo, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Pressable as GesturePressable } from "react-native-gesture-handler";
import { v4 as uuidv4 } from "uuid";
import { ThemedText } from "../themed-text";
import DropdownMenu, { DropdownMenuOption } from "../ui/DropdownMenu";
import ChangeMetricTypeSheet from "./ChangeMetricTypeSheet";
import DistanceSetItem from "./exerciseSetItems/DistanceSetItem";
import DurationSetItem from "./exerciseSetItems/DurationSetItem";
import RepsOnlySetItem from "./exerciseSetItems/RepsOnlySetItem";
import WeightAndRepsSetItem from "./exerciseSetItems/WeightAndRepsSetItem";

type Props = {
  exercise: Exercise;
  onAddSet: (id: string, set: ExerciseSet) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onEditSet: (exerciseId: string, setId: string, set: ExerciseSet) => void;
  onDragLongPress?: () => void;
  onDeleteExercise?: (exercise: Exercise) => void;
  onChangeMetricType?: (exerciseId: string, metricType: ExerciseMetricType) => void;
};

const BuildExerciseItem = ({
  exercise,
  onDragLongPress,
  onDeleteExercise,
  onAddSet,
  onDeleteSet,
  onEditSet,
  onChangeMetricType,
}: Props) => {
  const { id, name, metricType, sets } = exercise;
  const [isMetricSheetVisible, setIsMetricSheetVisible] = useState(false);
  const [autoFocusSet, setAutoFocusSet] = useState(false);

  const dropDownOptions: DropdownMenuOption[] = useMemo(
    () => [
      {
        onSelect: () => onDeleteExercise?.(exercise),
        text: "DELETE",
        icon: <FontAwesome6 name="trash" size={10} color={Colors.icon} />,
      },
      {
        onSelect: () => setIsMetricSheetVisible(true),
        text: "CHANGE METRIC",
        icon: <FontAwesome6 name="ruler" size={10} color={Colors.icon} />,
      },
    ],
    [onDeleteExercise, exercise],
  );

  const handleAddSet = () => {
    const setId = `${uuidv4()}-set`;

    const set: ExerciseSet = {
      id: setId,
    };

    setAutoFocusSet(true);
    onAddSet(id, set);
  };

  const handleChangeMetricType = (nextMetricType: ExerciseMetricType) => {
    if (nextMetricType === metricType) return;

    onChangeMetricType?.(id, nextMetricType);
  };

  const setCallToActionText = () => {
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
  };

  const renderSetItem = (set: ExerciseSet, index: number) => {
    const setIndex = index + 1;

    switch (metricType) {
      case "weight_reps":
        return (
          <WeightAndRepsSetItem
            key={set.id}
            set={set}
            exerciseId={id}
            setIndex={setIndex}
            onDeleteSet={onDeleteSet}
            onEditSet={onEditSet}
            autoFocus={autoFocusSet}
          />
        );

      case "distance":
        return (
          <DistanceSetItem
            key={set.id}
            set={set}
            setIndex={setIndex}
            onDeleteSet={onDeleteSet}
            onEditSet={onEditSet}
            exerciseId={id}
            autoFocus={autoFocusSet}
          />
        );

      case "reps_only":
        return (
          <RepsOnlySetItem
            key={set.id}
            set={set}
            setIndex={setIndex}
            onDeleteSet={onDeleteSet}
            onEditSet={onEditSet}
            exerciseId={id}
            autoFocus={autoFocusSet}
          />
        );

      case "duration":
        return (
          <DurationSetItem
            key={set.id}
            set={set}
            setIndex={setIndex}
            onDeleteSet={onDeleteSet}
            onEditSet={onEditSet}
            exerciseId={id}
            autoFocus={autoFocusSet}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <View style={styles.container}>
        <GesturePressable onLongPress={onDragLongPress} style={styles.dragHandle}>
          <MaterialIcons name="drag-handle" size={24} color={Colors.inputBorder} />
        </GesturePressable>

        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <ThemedText style={styles.name}>{name}</ThemedText>
            <ThemedText style={styles.metricLabel}>
              {metricType.replace("_", " ").toUpperCase()}
            </ThemedText>
          </View>

          <View style={styles.dropdownContainer}>
            <DropdownMenu
              renderTriggerItem={<MaterialIcons name="more-horiz" size={22} color={Colors.icon} />}
              options={dropDownOptions}
              menuOptionsCustomStyles={{ optionsContainer: { width: 150 } }}
            />
          </View>
        </View>

        <View style={styles.exerciseSetsContainer}>
          {sets.map((set, index) => renderSetItem(set, index))}
        </View>

        <TouchableOpacity style={styles.addSetButtonContainer} onPress={handleAddSet}>
          <Entypo name="plus" size={14} color={Colors.icon} />
          <ThemedText style={styles.addSetButtonText}>{setCallToActionText()}</ThemedText>
        </TouchableOpacity>
      </View>

      <ChangeMetricTypeSheet
        visible={isMetricSheetVisible}
        exerciseName={name}
        currentMetricType={metricType}
        onClose={() => setIsMetricSheetVisible(false)}
        onSelectMetricType={handleChangeMetricType}
      />
    </>
  );
};

export default BuildExerciseItem;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    zIndex: 100,
  },
  dragHandle: {
    position: "absolute",
    right: 5,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    gap: 5,
    paddingRight: 12,
  },
  name: {
    fontFamily: Typography.family.primary.bold,
  },
  metricLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.icon,
    fontFamily: Typography.family.primary.semibold,
  },
  dropdownContainer: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  addSetButtonContainer: {
    flexDirection: "row",
    gap: 5,
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
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
  exerciseSetsContainer: {
    gap: 8,
    marginBottom: 12,
  },
});
