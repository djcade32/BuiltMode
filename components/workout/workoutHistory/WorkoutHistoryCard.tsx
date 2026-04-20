import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { Workout } from "@/functions/src/types/workout";
import { breakdownSeconds } from "@/lib/utils/conversions";
import { formatFirestoreDateTime } from "@/lib/utils/date";
import { firstLetterToUpperCase } from "@/lib/utils/string";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type Props = {
  workout: Workout;
  onPress?: (workout: Workout) => void;
};

const WorkoutHistoryCard = ({ workout, onPress }: Props) => {
  const getDurationString = (value: number) => {
    const { hours, minutes, seconds } = breakdownSeconds(value);

    if (hours > 0) {
      return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }

    return `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const workoutTitle =
    workout.name || `${firstLetterToUpperCase(workout.workoutType ?? "")} Workout`;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.85}
      onPress={() => onPress?.(workout)}
    >
      <View style={styles.header}>
        <ThemedText style={styles.title}>{workoutTitle}</ThemedText>
        <ThemedText style={styles.duration}>{getDurationString(workout.duration ?? 0)}</ThemedText>
      </View>

      <View style={styles.dateRow}>
        <ThemedText style={styles.infoText}>
          {formatFirestoreDateTime(workout.completedAt)}
        </ThemedText>
      </View>
      <ThemedText style={styles.infoText}>
        {firstLetterToUpperCase(workout.workoutType ?? "")}
      </ThemedText>
      <ThemedText style={styles.infoText}>
        {workout.exercises?.length
          ? `${workout.exercises.length} exercise${workout.exercises.length > 1 ? "s" : ""}`
          : "0 exercises"}
      </ThemedText>
    </TouchableOpacity>
  );
};

export default WorkoutHistoryCard;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.secondary,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 14,
    fontFamily: Typography.family.primary.semibold,
    flex: 1,
    marginRight: 8,
  },
  duration: {
    fontSize: 14,
    fontFamily: Typography.family.secondary.regular,
    color: Colors.gray,
  },
  dateRow: {
    flexDirection: "row",
    gap: 3,
  },
  infoText: {
    fontSize: 12,
    color: Colors.icon,
  },
  separator: {
    height: 11,
    width: 1,
    borderRadius: 9999,
    backgroundColor: Colors.inputBorder,
  },
});
