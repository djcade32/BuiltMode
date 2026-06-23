import { ThemedText } from "@/components/themed-text";
import Input from "@/components/ui/Input";
import { Border, Colors, Typography } from "@/constants/theme";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import ThemedButton from "../ui/ThemedButton";

const QUICK_SUGGESTIONS = [
  "Push Day",
  "Pull Day",
  "Leg Day",
  "Conditioning",
  "Upper Body",
  "Lower Body",
];

type Props = {
  visible: boolean;
  initialValue?: string;
  onClose: () => void;
  onSave: (workoutName: string) => void;
  title?: string;
};

const WorkoutNameSheet = ({
  visible,
  initialValue = "",
  onClose,
  onSave,
  title = "Name Your Workout",
}: Props) => {
  const [workoutName, setWorkoutName] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setWorkoutName(initialValue);
    }
  }, [visible, initialValue]);

  const trimmedWorkoutName = workoutName.trim();
  const isSaveDisabled = !trimmedWorkoutName;

  const handleClose = () => {
    setWorkoutName(initialValue);
    onClose();
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setWorkoutName(suggestion);
  };

  const handleSave = () => {
    if (isSaveDisabled) return;

    onSave(trimmedWorkoutName);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View>
                <ThemedText style={styles.title}>{title}</ThemedText>
                <ThemedText style={styles.subtitle}>
                  Optional, but helps you stay organized.
                </ThemedText>
              </View>

              <TouchableOpacity onPress={handleClose} style={{ width: 50 }} hitSlop={10}>
                <ThemedText style={styles.closeText}>CLOSE</ThemedText>
              </TouchableOpacity>
            </View>

            <Input
              placeholder="e.g. Push Day, Morning Run"
              placeholderTextColor={Colors.icon}
              value={workoutName}
              onChangeText={setWorkoutName}
              containerStyle={styles.inputContainer}
              autoFocus
              maxLength={60}
            />
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.quickSuggestionsSection}>
                <ThemedText style={styles.quickSuggestionsLabel}>QUICK SUGGESTIONS</ThemedText>

                <View style={styles.suggestionGrid}>
                  {QUICK_SUGGESTIONS.map((suggestion) => {
                    const isActive = trimmedWorkoutName === suggestion;

                    return (
                      <TouchableOpacity
                        key={suggestion}
                        style={[styles.suggestionButton, isActive && styles.suggestionButtonActive]}
                        onPress={() => handleSelectSuggestion(suggestion)}
                      >
                        <ThemedText
                          style={[styles.suggestionText, isActive && styles.suggestionTextActive]}
                        >
                          {suggestion}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.footer}>
                <ThemedButton
                  title="SAVE NAME"
                  fontSize={Typography.size.sm}
                  onPress={handleSave}
                  disabled={isSaveDisabled}
                />

                <TouchableOpacity onPress={() => onClose()} style={styles.skipButton} hitSlop={10}>
                  <ThemedText style={styles.skipText}>CANCEL</ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default WorkoutNameSheet;

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    minHeight: "72%",
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
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 16,
  },
  closeText: {
    color: Colors.accent.primary,
    fontSize: Typography.size.xs,
    textAlign: "right",
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: Typography.family.primary.bold,
    color: Colors.text.primary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.icon,
    fontFamily: Typography.family.primary.regular,
  },
  inputContainer: {
    marginBottom: 28,
  },
  quickSuggestionsSection: {
    marginBottom: 32,
  },
  quickSuggestionsLabel: {
    color: Colors.icon,
    fontSize: 12,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 1.8,
    marginBottom: 14,
  },
  suggestionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  suggestionButton: {
    width: "47%",
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  suggestionButtonActive: {
    borderColor: Colors.accent.primary,
  },
  suggestionText: {
    fontFamily: Typography.family.primary.semibold,
    color: Colors.text.primary,
    fontSize: 15,
  },
  suggestionTextActive: {
    color: Colors.accent.primary,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 12,
  },
  saveButton: {
    minHeight: 62,
    borderRadius: 16,
    backgroundColor: Colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.35,
  },
  saveButtonText: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 18,
    letterSpacing: 0.8,
    color: Colors.background.primary,
  },
  saveButtonTextDisabled: {
    color: Colors.text.primary,
  },
  skipButton: {
    alignSelf: "center",
    marginTop: 22,
  },
  skipText: {
    color: Colors.icon,
    fontSize: 15,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 1,
  },
});
