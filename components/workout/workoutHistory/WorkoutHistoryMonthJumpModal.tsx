import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";

type WorkoutHistoryMonthJumpModalProps = {
  visible: boolean;
  months: string[];
  onClose: () => void;
  onSelectMonth: (sectionIndex: number) => void;
};

const WorkoutHistoryMonthJumpModal = ({
  visible,
  months,
  onClose,
  onSelectMonth,
}: WorkoutHistoryMonthJumpModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <ThemedText style={styles.modalTitle}>Jump to Month</ThemedText>

          <View style={styles.monthList}>
            {months.map((month, index) => (
              <TouchableOpacity
                key={month}
                style={styles.monthRow}
                onPress={() => onSelectMonth(index)}
              >
                <ThemedText style={styles.monthRowText}>{month}</ThemedText>
                <MaterialIcons name="keyboard-arrow-right" size={18} color={Colors.icon} />
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default WorkoutHistoryMonthJumpModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: Typography.family.primary.bold,
    marginBottom: 16,
  },
  monthList: {
    gap: 8,
  },
  monthRow: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.background.primary,
  },
  monthRowText: {
    fontFamily: Typography.family.primary.semibold,
    color: Colors.text.primary,
  },
});
