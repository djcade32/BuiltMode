import { Border, Colors, Typography } from "@/constants/theme";
import { FontAwesome5 } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "../themed-text";
import ThemedButton from "../ui/ThemedButton";

type WorkoutNoteSheetProps = {
  visible: boolean;
  workoutName: string;
  initialValue?: string;
  onClose: () => void;
  onSave: (note: string) => void;
};

const WorkoutNoteSheet = ({ visible, workoutName, initialValue = "", onClose, onSave }: WorkoutNoteSheetProps) => {
  const [draftNote, setDraftNote] = useState(initialValue);

  const hasExistingNote = Boolean(initialValue.trim());

  useEffect(() => {
    if (visible) {
      setDraftNote(initialValue);
    }
  }, [visible, initialValue]);

  const handleSave = () => {
    onSave(draftNote.trim());
    onClose();
  };

  const handleClear = () => {
    setDraftNote("");
    onSave("");
    onClose();
  };

  const handleClose = () => {
    setDraftNote(initialValue);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <KeyboardAvoidingView
          pointerEvents="box-none"
          style={styles.keyboardAvoidingSheetContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.sheetHeader}>
              <View style={{ width: 50 }} />

              <ThemedText type="defaultSemiBold" style={styles.sheetHeaderTitle}>
                {hasExistingNote ? "EDIT NOTE" : "ADD NOTE"}
              </ThemedText>

              <TouchableOpacity onPress={handleClose} style={{ width: 50 }}>
                <ThemedText style={styles.closeText}>CLOSE</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetScrollView}
              contentContainerStyle={styles.sheetScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.workoutContextCard}>
                <View style={styles.workoutContextIcon}>
                  <FontAwesome5 name="clipboard-list" size={12} color={Colors.accent.primary} />
                </View>

                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.workoutContextLabel}>WORKOUT</ThemedText>
                  <ThemedText style={styles.workoutContextName} numberOfLines={1}>
                    {workoutName}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.noteInputSection}>
                <ThemedText style={styles.noteSectionSubtitle}>WORKOUT NOTE</ThemedText>

                <TextInput
                  value={draftNote}
                  onChangeText={setDraftNote}
                  placeholder="Add the goal for this session, warm-up reminders, pacing notes, or anything you want to remember."
                  placeholderTextColor={Colors.icon}
                  multiline
                  textAlignVertical="top"
                  style={styles.notesInput}
                  autoFocus
                />
              </View>

              <View style={styles.sheetActions}>
                {hasExistingNote ? (
                  <TouchableOpacity activeOpacity={0.85} style={styles.clearNoteButton} onPress={handleClear}>
                    <ThemedText style={styles.clearNoteButtonText}>CLEAR</ThemedText>
                  </TouchableOpacity>
                ) : null}

                <View style={{ flex: 1 }}>
                  <ThemedButton title="SAVE NOTE" onPress={handleSave} />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default WorkoutNoteSheet;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  keyboardAvoidingSheetContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },

  sheet: {
    maxHeight: "88%",
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
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

  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  sheetHeaderTitle: {
    textAlign: "center",
  },

  closeText: {
    color: Colors.accent.primary,
    fontSize: Typography.size.xs,
    textAlign: "right",
  },

  sheetScrollView: {
    maxHeight: "100%",
  },

  sheetScrollContent: {
    paddingBottom: 24,
  },

  workoutContextCard: {
    minHeight: 62,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.secondary,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  workoutContextIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(198, 163, 74, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  workoutContextLabel: {
    color: Colors.icon,
    fontSize: 10,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 1.5,
    marginBottom: 3,
  },

  workoutContextName: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 14,
  },

  noteInputSection: {
    marginBottom: 18,
  },

  noteSectionSubtitle: {
    color: Colors.icon,
    fontSize: 12,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 1.8,
    marginBottom: 12,
  },

  notesInput: {
    minHeight: 170,
    maxHeight: 240,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.secondary,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: "#FFFFFF",
    fontFamily: Typography.family.primary.medium,
    fontSize: 14,
    lineHeight: 21,
  },

  sheetActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 2,
    paddingBottom: 10,
  },

  clearNoteButton: {
    minWidth: 92,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },

  clearNoteButtonText: {
    color: Colors.gray,
    fontFamily: Typography.family.primary.bold,
    fontSize: 13,
    letterSpacing: 1.2,
  },
});
