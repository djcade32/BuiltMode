import { Border, Colors, Typography } from "@/constants/theme";
import { Exercise, ExerciseSet } from "@/packages/shared/src";
import { Entypo, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Pressable as GesturePressable } from "react-native-gesture-handler";
import { Menu, MenuOption, MenuOptions, MenuTrigger, renderers } from "react-native-popup-menu";
import { v4 as uuidv4 } from "uuid";
import { ThemedText } from "../themed-text";
import DistanceSetItem from "./ExerciseSetItems/DistanceSetItem";
import RepsOnlySetItem from "./ExerciseSetItems/RepsOnlySetItem";
import WeightAndRepsSetItem from "./ExerciseSetItems/WeightAndRepsSetItem";

type props = {
  exercise: Exercise;
  onAddSet: (id: string, set: ExerciseSet) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onEditSet: (exerciseId: string, setId: string, set: ExerciseSet) => void;
  onDragLongPress?: () => void;
  onDeleteExercise?: (exercise: Exercise) => void;
};

const BuildExerciseItem = ({
  exercise,
  onDragLongPress,
  onDeleteExercise,
  onAddSet,
  onDeleteSet,
  onEditSet,
}: props) => {
  const { id, name, metricType, sets } = exercise;

  const DropDown = useCallback(() => {
    return (
      <Menu renderer={renderers.ContextMenu} rendererProps={{ placement: "bottom" }}>
        <MenuTrigger customStyles={{ TriggerTouchableComponent: TouchableOpacity }}>
          <MaterialIcons name="more-horiz" size={22} color={Colors.icon} />
        </MenuTrigger>
        <MenuOptions
          customStyles={{
            optionsContainer: styles.dropdownOptionsContainer,
          }}
        >
          <MenuOption
            onSelect={() => onDeleteExercise && onDeleteExercise(exercise)}
            customStyles={{
              OptionTouchableComponent: TouchableOpacity,
              optionWrapper: styles.dropdownOptionContainer,
            }}
          >
            <FontAwesome6 name="trash" size={10} color={Colors.icon} />
            <ThemedText style={styles.dropdownOptionText}>DELETE</ThemedText>
          </MenuOption>
        </MenuOptions>
      </Menu>
    );
  }, [onDeleteExercise]);

  const handleAddSet = () => {
    const setId = `${uuidv4()}-set`;
    let set: ExerciseSet = {
      id: setId,
    };
    onAddSet(id, set);
  };

  const setCallToActionText = () => {
    switch (metricType) {
      case "weight_reps":
        return "ADD SET";
      case "distance":
        return "ADD EFFORT";
      case "reps_only":
        return "ADD ROUND";
      default:
        return "ADD SET";
    }
  };

  return (
    <View style={styles.container}>
      <GesturePressable onLongPress={onDragLongPress} style={{ position: "absolute", right: 5 }}>
        <MaterialIcons name="drag-handle" size={24} color={Colors.inputBorder} />
      </GesturePressable>
      <View style={styles.headerContainer}>
        <ThemedText style={styles.name}>{name}</ThemedText>
        <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
          <DropDown />
        </View>
      </View>
      <View style={styles.exerciseSetsContainer}>
        {exercise.sets.map((set, index) => {
          const idx = index + 1;
          if (metricType === "weight_reps") {
            return (
              <WeightAndRepsSetItem
                key={set.id}
                set={set}
                exerciseId={id}
                setIndex={idx}
                onDeleteSet={onDeleteSet}
                onEditSet={onEditSet}
              />
            );
          } else if (metricType === "distance") {
            return (
              <DistanceSetItem
                key={set.id}
                set={set}
                setIndex={idx}
                onDeleteSet={onDeleteSet}
                onEditSet={onEditSet}
                exerciseId={id}
              />
            );
          } else if (metricType === "reps_only") {
            return (
              <RepsOnlySetItem
                key={set.id}
                set={set}
                setIndex={idx}
                onDeleteSet={onDeleteSet}
                onEditSet={onEditSet}
                exerciseId={id}
              />
            );
          }
        })}
      </View>
      <TouchableOpacity
        style={[
          styles.addSetButtonContainer,
          { opacity: sets.length > 0 && metricType === "distance" ? 0.25 : 1 },
        ]}
        onPress={handleAddSet}
        disabled={sets.length > 0 && metricType === "distance"}
      >
        <Entypo name="plus" size={14} color={Colors.icon} />
        <ThemedText style={styles.addSetButtonText}>{setCallToActionText()}</ThemedText>
      </TouchableOpacity>
    </View>
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
  dropdownOptionsContainer: {
    backgroundColor: Colors.input,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    padding: 8,
    width: 100,
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

  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginBottom: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  name: {
    fontFamily: Typography.family.primary.bold,
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
