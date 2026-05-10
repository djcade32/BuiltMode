import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { ExerciseMetricType } from "@/packages/shared/src";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type MetricOption = {
  label: string;
  value: ExerciseMetricType;
  description: string;
};

const METRIC_OPTIONS: MetricOption[] = [
  {
    label: "Weight + Reps",
    value: "weight_reps",
    description: "Best for strength movements like squats, presses, rows, and curls.",
  },
  {
    label: "Reps Only",
    value: "reps_only",
    description: "Best for bodyweight or rep-based work like push ups and burpees.",
  },
  {
    label: "Duration",
    value: "duration",
    description: "Best for timed rounds like battle ropes, planks, or intervals.",
  },
  {
    label: "Distance",
    value: "distance",
    description: "Best for running, carries, sled pushes, walking, or rowing distance.",
  },
  //   {
  //     label: "Calories",
  //     value: "calories",
  //     description: "Best for machine-based work like bike, rower, ski erg, or elliptical.",
  //   },
  //   {
  //     label: "Time",
  //     value: "time",
  //     description: "Best for completion-time efforts or benchmark workouts.",
  //   },
];

type ChangeMetricTypeSheetProps = {
  visible: boolean;
  currentMetricType: ExerciseMetricType;
  exerciseName: string;
  onClose: () => void;
  onSelectMetricType: (metricType: ExerciseMetricType) => void;
};

const ChangeMetricTypeSheet = ({
  visible,
  currentMetricType,
  exerciseName,
  onClose,
  onSelectMetricType,
}: ChangeMetricTypeSheetProps) => {
  const handleSelect = (metricType: ExerciseMetricType) => {
    onSelectMetricType(metricType);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                <ThemedText style={styles.title}>Change Metric</ThemedText>
                <ThemedText style={styles.subtitle}>{exerciseName}</ThemedText>
              </View>

              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <MaterialIcons name="close" size={22} color={Colors.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsContainer}>
              {METRIC_OPTIONS.map((option) => {
                const isSelected = option.value === currentMetricType;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.optionTextContainer}>
                      <ThemedText
                        style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}
                      >
                        {option.label}
                      </ThemedText>

                      <ThemedText style={styles.optionDescription}>{option.description}</ThemedText>
                    </View>

                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ChangeMetricTypeSheet;

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    maxHeight: "85%",
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: Colors.inputBorder,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.inputBorder,
    alignSelf: "center",
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: Typography.family.primary.bold,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Typography.family.primary.medium,
    color: Colors.icon,
  },
  optionsContainer: {
    gap: 10,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.md,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionCardSelected: {
    borderColor: Colors.accent.primary,
  },
  optionTextContainer: {
    flex: 1,
    gap: 5,
  },
  optionTitle: {
    fontSize: 14,
    fontFamily: Typography.family.primary.semibold,
    color: Colors.text.primary,
  },
  optionTitleSelected: {
    color: Colors.accent.primary,
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Typography.family.primary.regular,
    color: Colors.icon,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: Colors.accent.primary,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: Colors.accent.primary,
  },
});
