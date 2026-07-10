import { Border, Colors, Typography } from "@/constants/theme";
import { Exercise } from "@/packages/shared/src";
import { Feather, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import DropdownMenu, { DropdownMenuOption } from "../ui/DropdownMenu";

type Props = {
  index: number;
  exercise: Exercise;
  setsCompleted: number;
  onDeleteExercise: (exerciseId: string) => void;
  isNext: boolean;
  isCompleted: boolean;
  isActive: boolean;
  isLastExercise: boolean;
  onPress: () => void;
};

const NextExerciseItem = ({
  index,
  exercise,
  setsCompleted,
  onDeleteExercise,
  isNext,
  isCompleted,
  isActive,
  isLastExercise,
  onPress,
}: Props) => {
  const { sets, name, metricType } = exercise;

  const getExerciseMetricText = useCallback(() => {
    switch (metricType) {
      case "weight_reps":
        return "set";
      case "reps_only":
        return "round";
      case "distance":
        return "attempt";
      case "duration":
      case "time":
        return "interval";
      case "calories":
        return "target";
      case "other":
        return "entry";

      default:
        return "entry";
    }
  }, [metricType]);

  const dropDownOptions: DropdownMenuOption[] = useMemo(
    () => [
      {
        onSelect: () => onDeleteExercise(exercise.id),
        text: "Delete Exercise",
        icon: <FontAwesome6 name="trash" size={10} color={Colors.error} />,
        menuOptionCustomStyles: { optionText: { color: Colors.error } },
      },
    ],
    [exercise, onDeleteExercise],
  );
  return (
    <TouchableOpacity
      style={{
        ...styles.nextExerciseContainer,
        opacity: isActive ? 1 : 0.4,
        backgroundColor: isActive ? "#c6a34a0c" : Colors.background.secondary,
        borderLeftWidth: isActive ? 3 : 0,
        borderLeftColor: Colors.accent.primary,
        borderBottomColor: Colors.inputBorder,
        borderBottomWidth: isLastExercise ? 0 : 1,
        borderBottomLeftRadius: isLastExercise ? 16 : 0,
      }}
      onPress={onPress}
      disabled={isActive}
    >
      <View
        style={{
          ...styles.listNumContainer,
          backgroundColor: isActive ? Colors.accent.primary : Colors.inputBorder,
        }}
      >
        <ThemedText
          style={{ ...styles.listNumText, color: isActive ? Colors.background.secondary : Colors.text.primary }}
        >
          {index}
        </ThemedText>
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.exercisesTitle, { textDecorationLine: isCompleted ? "line-through" : "none" }]}>
          {name}
        </ThemedText>
        {isActive ? (
          <ThemedText
            style={{
              fontSize: 12,
              fontFamily: Typography.family.secondary.regular,
              color: Colors.accent.primary,
            }}
          >
            {isCompleted ? "Completed" : `${setsCompleted} of ${exercise.sets.length} sets completed`}
          </ThemedText>
        ) : (
          <ThemedText
            style={styles.exercisesSetText}
          >{`${sets.length} ${getExerciseMetricText()}${sets.length > 1 ? "s" : ""}`}</ThemedText>
        )}
      </View>
      {isNext && !isCompleted && <ThemedText style={styles.nextText}>NEXT</ThemedText>}
      {isCompleted && (
        <View style={styles.checkmarkIconContainer}>
          <Feather name="check" size={18} color={Colors.accent.primary} />
        </View>
      )}
      {
        <TouchableOpacity>
          <DropdownMenu
            renderTriggerItem={<MaterialIcons name="more-horiz" size={22} color={Colors.icon} />}
            options={dropDownOptions}
            menuOptionsCustomStyles={{
              optionsContainer: { width: 150 },
            }}
          />
        </TouchableOpacity>
      }
    </TouchableOpacity>
  );
};

export default NextExerciseItem;

const styles = StyleSheet.create({
  nextExerciseContainer: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  listNumContainer: {
    backgroundColor: Colors.inputBorder,
    justifyContent: "center",
    alignItems: "center",
    height: 24,
    width: 24,
    borderRadius: 6,
  },
  listNumText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
  },
  exercisesTitle: {
    fontSize: 14,
    fontFamily: Typography.family.primary.semibold,
  },
  exercisesSetText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.icon,
  },
  nextText: {
    fontSize: 12,
    fontFamily: Typography.family.primary.semibold,
  },
  checkmarkIconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c6a34a38",
    borderRadius: Border.radius.md,
  },
});
