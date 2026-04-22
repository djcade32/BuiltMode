import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { breakdownSeconds } from "@/lib/utils/conversions";
import { Exercise, ExerciseMetricType, ExerciseSet } from "@/packages/shared/src";
import React from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  exercise: Exercise;
};

const WorkoutHistoryExerciseBreakdown = ({ exercise }: Props) => {
  const { name, metricType } = exercise;

  const SetItem = ({
    set,
    order,
    type,
  }: {
    set: ExerciseSet;
    order: number;
    type: ExerciseMetricType;
  }) => {
    const formatNumber = (value?: number, suffix = "") =>
      value === undefined || value === null ? "—" : `${value}${suffix}`;

    if (type === "reps_only") {
      return (
        <View style={styles.exerciseSetContainer}>
          <ThemedText style={styles.setText}>Round {order}</ThemedText>
          <ThemedText style={styles.setWeightText}>{formatNumber(set.reps, " reps")}</ThemedText>
        </View>
      );
    } else if (type === "distance") {
      return (
        <View>
          {set.durationSec !== undefined && (
            <View style={styles.exerciseSetContainer}>
              <ThemedText style={styles.setText}>Duration</ThemedText>
              <ThemedText style={{ ...styles.setWeightText, color: Colors.accent.secondary }}>
                {breakdownSeconds(set.durationSec).minutes} mins
              </ThemedText>
            </View>
          )}
          <View style={styles.exerciseSetContainer}>
            <ThemedText style={styles.setText}>Distance</ThemedText>
            <ThemedText style={{ ...styles.setWeightText, color: Colors.accent.secondary }}>
              {formatNumber(set.distanceMiles, " miles")}
            </ThemedText>
          </View>
        </View>
      );
    } else if (type === "weight_reps") {
      return (
        <View style={styles.exerciseSetContainer}>
          <ThemedText style={styles.setText}>Set {order}</ThemedText>
          <View style={{ flexDirection: "row", gap: 15 }}>
            <ThemedText style={styles.setRepText}>{formatNumber(set.reps, " reps")}</ThemedText>
            <ThemedText style={styles.setWeightText}>{formatNumber(set.weight, " lbs")}</ThemedText>
          </View>
        </View>
      );
    } else if (type === "duration" || type === "time") {
      return (
        <View style={styles.exerciseSetContainer}>
          <ThemedText style={styles.setText}>Duration</ThemedText>
          <ThemedText style={styles.setWeightText}>
            {set.durationSec === undefined ? "—" : `${Math.round(set.durationSec / 60)} mins`}
          </ThemedText>
        </View>
      );
    } else if (type === "calories") {
      return (
        <View style={styles.exerciseSetContainer}>
          <ThemedText style={styles.setText}>Calories</ThemedText>
          <ThemedText style={styles.setWeightText}>{formatNumber(set.calories, " cal")}</ThemedText>
        </View>
      );
    }
  };
  return (
    <View>
      <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
        <View
          style={[
            styles.exerciseNameAccentBar,
            {
              backgroundColor:
                metricType === "distance" ? Colors.accent.secondary : Colors.accent.primary,
            },
          ]}
        />
        <ThemedText style={styles.exerciseName}>{name.toLocaleUpperCase()}</ThemedText>
      </View>
      <View style={styles.exercisesSetsContainer}>
        {exercise.sets.map((set, index) => (
          <SetItem key={set.id} set={set} order={index + 1} type={exercise.metricType} />
        ))}
      </View>
    </View>
  );
};

export default WorkoutHistoryExerciseBreakdown;

const styles = StyleSheet.create({
  exerciseNameAccentBar: {
    height: 20,
    width: 4,
    borderRadius: 9999,
  },
  exerciseName: {
    fontFamily: Typography.family.primary.bold,
    letterSpacing: 0.4,
  },
  exercisesSetsContainer: {
    paddingLeft: 10,
    marginTop: 12,
    gap: 8,
  },
  exerciseSetContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
  },
  setText: {
    fontSize: 12,
    fontFamily: Typography.family.secondary.regular,
    color: Colors.icon,
  },
  setRepText: {
    fontSize: 14,
    fontFamily: Typography.family.primary.semibold,
    color: Colors.gray,
  },
  setWeightText: {
    fontSize: 14,
    fontFamily: Typography.family.secondary.semibold,
    color: Colors.accent.primary,
  },
});
