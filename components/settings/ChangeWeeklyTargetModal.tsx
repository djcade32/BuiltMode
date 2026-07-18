import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";

export type WeeklyTargetDays = 2 | 3 | 4 | 5 | 6 | 7;

type ChangeWeeklyTargetModalProps = {
  visible: boolean;
  currentTarget: WeeklyTargetDays;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (weeklyTarget: WeeklyTargetDays) => Promise<unknown>;
  pendingWeeklyTargetChange: WeeklyTargetDays | null;
};

const WEEKLY_TARGET_OPTIONS: WeeklyTargetDays[] = [2, 3, 4, 5, 6, 7];

const getWeeklyTargetErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "BuiltMode could not schedule your weekly target change. Please try again.";
};

const ChangeWeeklyTargetModal = ({
  visible,
  currentTarget,
  isSubmitting,
  onClose,
  onSave,
  pendingWeeklyTargetChange,
}: ChangeWeeklyTargetModalProps) => {
  const [selectedTarget, setSelectedTarget] = useState<WeeklyTargetDays>(currentTarget);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasChanged = selectedTarget !== currentTarget;
  const pendingChosen = selectedTarget === pendingWeeklyTargetChange;
  const isSubmitDisabled = isSubmitting || !hasChanged || pendingChosen;

  useEffect(() => {
    if (!visible) return;

    setSelectedTarget(currentTarget);
    setErrorMessage(null);
  }, [currentTarget, visible]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSave = async () => {
    if (isSubmitDisabled) return;

    try {
      setErrorMessage(null);
      await onSave(selectedTarget);
      onClose();

      Alert.alert(
        "Weekly Target Scheduled",
        `Your weekly target will change to ${selectedTarget} days next Monday at 4:00 AM in your home timezone.`,
      );
    } catch (error) {
      console.error("Unable to change weekly target:", error);
      setErrorMessage(getWeeklyTargetErrorMessage(error));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={handleClose} />

        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.headerCopy}>
              <ThemedText style={styles.modalTitle}>Change Weekly Target</ThemedText>
              <ThemedText style={styles.modalDescription}>
                Choose the number of days you are committing to train each week.
              </ThemedText>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isSubmitting}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close weekly target change"
            >
              <Feather name="x" size={18} color={Colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.currentTargetCard}>
            <View style={styles.currentTargetIcon}>
              <Feather name="target" size={16} color={Colors.accent.primary} />
            </View>

            <View style={styles.currentTargetCopy}>
              <ThemedText style={styles.currentTargetLabel}>CURRENT WEEKLY TARGET</ThemedText>
              <ThemedText style={styles.currentTargetValue}>{currentTarget} training days</ThemedText>
            </View>
          </View>

          <View style={styles.optionsSection}>
            <ThemedText style={styles.optionsLabel}>NEW WEEKLY TARGET</ThemedText>

            <View style={styles.optionsGrid}>
              {WEEKLY_TARGET_OPTIONS.map((target) => {
                const isSelected = selectedTarget === target;
                const isCurrent = currentTarget === target;
                const isPending = pendingWeeklyTargetChange === target;

                return (
                  <TouchableOpacity
                    key={target}
                    style={[styles.targetOption, isSelected && styles.targetOptionSelected]}
                    onPress={() => {
                      setSelectedTarget(target);
                      setErrorMessage(null);
                    }}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${target} training days${isCurrent ? ", current target" : ""}`}
                  >
                    <ThemedText
                      style={[styles.targetOptionNumber, isSelected && styles.targetOptionNumberSelected]}
                    >
                      {target}
                    </ThemedText>

                    <ThemedText style={[styles.targetOptionLabel, isSelected && styles.targetOptionLabelSelected]}>
                      DAYS
                    </ThemedText>

                    {isCurrent ? (
                      <View style={styles.currentBadge}>
                        <ThemedText style={styles.currentBadgeText}>CURRENT</ThemedText>
                      </View>
                    ) : null}

                    {isPending ? (
                      <View style={styles.currentBadge}>
                        <ThemedText style={styles.currentBadgeText}>Pending</ThemedText>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.infoContainer}>
            <FontAwesome5 name="info-circle" size={12} color={Colors.accent.secondary} />
            <ThemedText style={styles.infoText}>
              Your current target stays active for the rest of this week. The new target begins Monday at 4:00 AM
              in your home timezone.
            </ThemedText>
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <FontAwesome5 name="exclamation-circle" size={12} color={Colors.error} />
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            </View>
          ) : null}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
              onPress={() => {
                void handleSave();
              }}
              disabled={isSubmitDisabled}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.background.primary} />
              ) : (
                <ThemedText style={styles.submitButtonText}>Schedule Change</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ChangeWeeklyTargetModal;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000000B3",
  },
  modalCard: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    padding: 20,
    gap: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 5,
  },
  modalTitle: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 18,
  },
  modalDescription: {
    fontFamily: Typography.family.primary.regular,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.text.secondary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Border.radius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  currentTargetCard: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.primary,
    padding: 14,
  },
  currentTargetIcon: {
    width: 38,
    height: 38,
    borderRadius: Border.radius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  currentTargetCopy: {
    flex: 1,
    gap: 4,
  },
  currentTargetLabel: {
    fontFamily: Typography.family.secondary.medium,
    fontSize: 9,
    letterSpacing: 0.8,
    color: Colors.icon,
  },
  currentTargetValue: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 14,
  },
  optionsSection: {
    gap: 10,
  },
  optionsLabel: {
    fontFamily: Typography.family.secondary.medium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.icon,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  targetOption: {
    width: "31%",
    minHeight: 84,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    position: "relative",
  },
  targetOptionSelected: {
    borderColor: Colors.accent.primary,
    backgroundColor: "#C6A34A14",
  },
  targetOptionNumber: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 22,
    color: Colors.text.secondary,
  },
  targetOptionNumberSelected: {
    color: Colors.accent.primary,
  },
  targetOptionLabel: {
    fontFamily: Typography.family.secondary.medium,
    fontSize: 9,
    letterSpacing: 0.8,
    color: Colors.icon,
  },
  targetOptionLabelSelected: {
    color: Colors.text.secondary,
  },
  currentBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: 999,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  currentBadgeText: {
    fontFamily: Typography.family.secondary.medium,
    fontSize: 6,
    letterSpacing: 0.5,
    color: Colors.icon,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.sm,
    padding: 11,
    backgroundColor: "#15181C80",
  },
  infoText: {
    flex: 1,
    fontFamily: Typography.family.primary.regular,
    fontSize: 10,
    lineHeight: 15,
    color: Colors.icon,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Border.radius.sm,
    padding: 10,
    backgroundColor: "#FF453A14",
  },
  errorText: {
    flex: 1,
    fontFamily: Typography.family.primary.regular,
    fontSize: 11,
    lineHeight: 16,
    color: Colors.error,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    minHeight: 46,
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  submitButton: {
    minHeight: 46,
    flex: 1.5,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 12,
    color: Colors.background.primary,
  },
});
