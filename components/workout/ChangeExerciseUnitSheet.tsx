import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { ExerciseMetricType, ExerciseUnit } from "@builtmode/shared";
import { MaterialIcons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type UnitOption = {
  label: string;
  value: ExerciseUnit;
  description: string;
};

const WEIGHT_UNIT_OPTIONS: UnitOption[] = [
  {
    label: "Pounds",
    value: "lbs",
    description: "Track exercise weight using pounds.",
  },
  {
    label: "Kilograms",
    value: "kg",
    description: "Track exercise weight using kilograms.",
  },
];

const DISTANCE_UNIT_OPTIONS: UnitOption[] = [
  {
    label: "Miles",
    value: "mi",
    description: "Best for longer running, walking, cycling, or rowing distances.",
  },
  {
    label: "Kilometers",
    value: "km",
    description: "Track longer distances using kilometers.",
  },
  {
    label: "Meters",
    value: "m",
    description: "Best for sprints, rowing, carries, and shorter distances.",
  },
  {
    label: "Yards",
    value: "yd",
    description: "Best for field sprints, carries, and short-distance work.",
  },
];

const getUnitOptions = (metricType: ExerciseMetricType): UnitOption[] => {
  switch (metricType) {
    case "weight_reps":
      return WEIGHT_UNIT_OPTIONS;

    case "distance":
      return DISTANCE_UNIT_OPTIONS;

    case "reps_only":
    case "duration":
    default:
      return [];
  }
};

type ChangeExerciseUnitSheetProps = {
  visible: boolean;
  metricType: ExerciseMetricType;
  currentUnit: ExerciseUnit | null;
  exerciseName: string;
  onClose: () => void;
  onSelectUnit: (unit: ExerciseUnit) => void;
};

const ChangeExerciseUnitSheet = ({
  visible,
  metricType,
  currentUnit,
  exerciseName,
  onClose,
  onSelectUnit,
}: ChangeExerciseUnitSheetProps) => {
  const unitOptions = getUnitOptions(metricType);

  const handleSelect = (unit: ExerciseUnit) => {
    onSelectUnit(unit);
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
                <ThemedText style={styles.title}>Change Unit</ThemedText>
                <ThemedText style={styles.subtitle}>{exerciseName}</ThemedText>
              </View>

              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <MaterialIcons name="close" size={22} color={Colors.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsContainer}>
              {unitOptions.map((option) => {
                const isSelected = option.value === currentUnit;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.optionTextContainer}>
                      <ThemedText style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
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

              {unitOptions.length === 0 && (
                <View style={styles.emptyState}>
                  <MaterialIcons name="straighten" size={24} color={Colors.icon} />

                  <ThemedText style={styles.emptyStateTitle}>No unit required</ThemedText>

                  <ThemedText style={styles.emptyStateDescription}>
                    This metric type does not use a configurable unit.
                  </ThemedText>
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ChangeExerciseUnitSheet;

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
  emptyState: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.md,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontFamily: Typography.family.primary.semibold,
    color: Colors.text.primary,
  },
  emptyStateDescription: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    fontFamily: Typography.family.primary.regular,
    color: Colors.icon,
  },
});
