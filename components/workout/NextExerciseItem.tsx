import { Border, Colors, Typography } from "@/constants/theme";
import { Exercise } from "@/packages/shared/src";
import { Feather } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

type Props = {
  index: number;
  exercise: Exercise;
  isNext: boolean;
  isCompleted: boolean;
  onPress: () => void;
};

const NextExerciseItem = ({ index, exercise, isNext, isCompleted, onPress }: Props) => {
  const { sets, name, metricType } = exercise;

  const getExerciseMetricText = useCallback(() => {
    switch (metricType) {
      case "weight_reps":
        return "set";
      case "reps_only":
        return "round";
      case "distance":
        return "effort";
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
  return (
    <TouchableOpacity
      style={{ ...styles.nextExerciseContainer, opacity: isCompleted ? 1 : 0.4 }}
      onPress={onPress}
    >
      <View style={styles.listNumContainer}>
        <ThemedText style={styles.listNumText}>{index}</ThemedText>
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.exercisesTitle}>{name}</ThemedText>
        <ThemedText
          style={styles.exercisesSetText}
        >{`${sets.length} ${getExerciseMetricText()}${sets.length > 1 ? "s" : ""}`}</ThemedText>
      </View>
      {isNext && !isCompleted && <ThemedText style={styles.nextText}>NEXT</ThemedText>}
      {isCompleted && (
        <View style={styles.checkmarkIconContainer}>
          <Feather name="check" size={18} color={Colors.accent.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default NextExerciseItem;

const styles = StyleSheet.create({
  nextExerciseContainer: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
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
