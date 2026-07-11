import { Border, Colors, Typography } from "@/constants/theme";
import { Exercise, ExerciseMetricType, ExerciseSet } from "@/packages/shared/src";
import { Entypo, FontAwesome5, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
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
import { Pressable as GesturePressable } from "react-native-gesture-handler";
import { v4 as uuidv4 } from "uuid";
import { ThemedText } from "../themed-text";
import DropdownMenu, { DropdownMenuOption } from "../ui/DropdownMenu";
import ThemedButton from "../ui/ThemedButton";
import ChangeMetricTypeSheet from "./ChangeMetricTypeSheet";
import DistanceSetItem from "./exerciseSetItems/DistanceSetItem";
import DurationSetItem from "./exerciseSetItems/DurationSetItem";
import RepsOnlySetItem from "./exerciseSetItems/RepsOnlySetItem";
import WeightAndRepsSetItem from "./exerciseSetItems/WeightAndRepsSetItem";

export type TransactionMetricTypes = "weight" | "reps" | "distanceMiles" | "durationSec";
export type SetUpdateTransaction = {
  setIndex: number;
  metric: TransactionMetricTypes;
  value: string;
};

type Props = {
  exercise: Exercise & {
    notes?: string;
  };
  onAddSet: (id: string, set: ExerciseSet) => void;
  onDeleteSet: (exerciseId: string, setId: string) => void;
  onEditSet: (exerciseId: string, setId: string, set: ExerciseSet) => void;
  onDragLongPress?: () => void;
  onDeleteExercise?: (exercise: Exercise) => void;
  onChangeMetricType?: (exerciseId: string, metricType: ExerciseMetricType) => void;
  onChangeExerciseNotes?: (exerciseId: string, notes: string) => void;
  onExerciseInputFocus?: () => void;
  onExerciseInputBlur?: () => void;
};

const BuildExerciseItem = ({
  exercise,
  onDragLongPress,
  onDeleteExercise,
  onAddSet,
  onDeleteSet,
  onEditSet,
  onChangeMetricType,
  onChangeExerciseNotes,
  onExerciseInputFocus,
  onExerciseInputBlur,
}: Props) => {
  const { id, name, metricType, sets, notes } = exercise;

  const [isMetricSheetVisible, setIsMetricSheetVisible] = useState(false);
  const [isNotesSheetVisible, setIsNotesSheetVisible] = useState(false);
  const [draftNotes, setDraftNotes] = useState(notes ?? "");
  const [setUpdateTransactions, setSetUpdateTransactions] = useState<SetUpdateTransaction[] | null>(null);

  const hasNotes = Boolean(notes?.trim());

  const openNotesSheet = () => {
    setDraftNotes(notes ?? "");
    setIsNotesSheetVisible(true);
  };

  const closeNotesSheet = () => {
    setDraftNotes(notes ?? "");
    setIsNotesSheetVisible(false);
  };

  const handleSaveNotes = () => {
    onChangeExerciseNotes?.(id, draftNotes.trim());
    setIsNotesSheetVisible(false);
  };

  const handleClearNotes = () => {
    setDraftNotes("");
    onChangeExerciseNotes?.(id, "");
    setIsNotesSheetVisible(false);
  };

  const dropDownOptions: DropdownMenuOption[] = useMemo(
    () => [
      {
        onSelect: openNotesSheet,
        text: hasNotes ? "Edit Note" : "Add Note",
        icon: <FontAwesome5 name="sticky-note" size={10} color={Colors.icon} />,
      },
      {
        onSelect: () => setIsMetricSheetVisible(true),
        text: "Change Metric",
        icon: <FontAwesome6 name="ruler" size={10} color={Colors.icon} />,
      },
      {
        onSelect: () => onDeleteExercise?.(exercise),
        text: "Delete Exercise",
        icon: <FontAwesome6 name="trash" size={10} color={Colors.error} />,
        menuOptionCustomStyles: { optionText: { color: Colors.error } },
      },
    ],
    [hasNotes, notes, onDeleteExercise, exercise],
  );

  const handleAddSet = () => {
    const setId = `${uuidv4()}-set`;

    const set: ExerciseSet = {
      id: setId,
    };

    onAddSet(id, set);
  };

  const handleChangeMetricType = (nextMetricType: ExerciseMetricType) => {
    if (nextMetricType === metricType) return;

    onChangeMetricType?.(id, nextMetricType);
  };

  const setCallToActionText = () => {
    switch (metricType) {
      case "weight_reps":
      case "calories":
      case "time":
        return "ADD SET";
      case "reps_only":
      case "duration":
        return "ADD ROUND";
      case "distance":
        return "ADD ATTEMPT";
      default:
        return "ADD SET";
    }
  };

  const renderSetItem = (set: ExerciseSet, index: number) => {
    const setIndex = index + 1;

    switch (metricType) {
      case "weight_reps":
        return (
          <WeightAndRepsSetItem
            key={set.id}
            set={set}
            exerciseId={id}
            setIndex={setIndex}
            onDeleteSet={onDeleteSet}
            onEditSet={onEditSet}
            onFocus={onExerciseInputFocus}
            onBlur={onExerciseInputBlur}
            exercise={exercise}
            setUpdateTransactions={setUpdateTransactions}
            setSetUpdateTransactions={setSetUpdateTransactions}
          />
        );

      case "distance":
        return (
          <DistanceSetItem
            key={set.id}
            set={set}
            setIndex={setIndex}
            onDeleteSet={onDeleteSet}
            onEditSet={onEditSet}
            exerciseId={id}
            onFocus={onExerciseInputFocus}
            onBlur={onExerciseInputBlur}
            exercise={exercise}
            setUpdateTransactions={setUpdateTransactions}
            setSetUpdateTransactions={setSetUpdateTransactions}
          />
        );

      case "reps_only":
        return (
          <RepsOnlySetItem
            key={set.id}
            set={set}
            exerciseId={exercise.id}
            setIndex={setIndex}
            onDeleteSet={onDeleteSet}
            onEditSet={onEditSet}
            onFocus={onExerciseInputFocus}
            onBlur={onExerciseInputBlur}
            exercise={exercise}
            setUpdateTransactions={setUpdateTransactions}
            setSetUpdateTransactions={setSetUpdateTransactions}
          />
        );

      case "duration":
        return (
          <DurationSetItem
            key={set.id}
            set={set}
            setIndex={setIndex}
            onDeleteSet={onDeleteSet}
            onEditSet={onEditSet}
            exerciseId={id}
            onFocus={onExerciseInputFocus}
            onBlur={onExerciseInputBlur}
            exercise={exercise}
            setUpdateTransactions={setUpdateTransactions}
            setSetUpdateTransactions={setSetUpdateTransactions}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <View style={styles.container}>
        <GesturePressable onLongPress={onDragLongPress} style={styles.dragHandle}>
          <MaterialIcons name="drag-handle" size={24} color={Colors.inputBorder} />
        </GesturePressable>

        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <View style={styles.exerciseNameRow}>
              <ThemedText style={styles.name}>{name}</ThemedText>

              {hasNotes ? (
                <TouchableOpacity activeOpacity={0.8} onPress={openNotesSheet}>
                  <FontAwesome5 name="sticky-note" size={12} color={Colors.accent.primary} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ThemedText style={styles.metricLabel}>{metricType.replace("_", " ").toUpperCase()}</ThemedText>
          </View>

          <View style={styles.dropdownContainer}>
            <DropdownMenu
              renderTriggerItem={<MaterialIcons name="more-horiz" size={22} color={Colors.icon} />}
              options={dropDownOptions}
              menuOptionsCustomStyles={{ optionsContainer: { width: 160 } }}
            />
          </View>
        </View>

        {hasNotes ? (
          <TouchableOpacity activeOpacity={0.85} style={styles.notePreviewCard} onPress={openNotesSheet}>
            <View style={styles.notePreviewIcon}>
              <FontAwesome5 name="sticky-note" size={11} color={Colors.accent.primary} />
            </View>

            <ThemedText style={styles.notePreviewText} numberOfLines={3}>
              {notes}
            </ThemedText>
          </TouchableOpacity>
        ) : null}

        <View style={styles.exerciseSetsContainer}>{sets.map((set, index) => renderSetItem(set, index))}</View>

        <TouchableOpacity style={styles.addSetButtonContainer} onPress={handleAddSet}>
          <Entypo name="plus" size={14} color={Colors.icon} />
          <ThemedText style={styles.addSetButtonText}>{setCallToActionText()}</ThemedText>
        </TouchableOpacity>
      </View>

      <ChangeMetricTypeSheet
        visible={isMetricSheetVisible}
        exerciseName={name}
        currentMetricType={metricType}
        onClose={() => setIsMetricSheetVisible(false)}
        onSelectMetricType={handleChangeMetricType}
      />

      <Modal
        visible={isNotesSheetVisible}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        onRequestClose={closeNotesSheet}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={closeNotesSheet} />

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
                  {hasNotes ? "EDIT NOTE" : "ADD NOTE"}
                </ThemedText>

                <TouchableOpacity onPress={closeNotesSheet} style={{ width: 50 }}>
                  <ThemedText style={styles.closeText}>CLOSE</ThemedText>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.sheetScrollView}
                contentContainerStyle={styles.sheetScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.exerciseContextCard}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.exerciseContextLabel}>EXERCISE</ThemedText>
                    <ThemedText style={styles.exerciseContextName} numberOfLines={1}>
                      {name}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.noteInputSection}>
                  <ThemedText style={styles.noteSectionSubtitle}>NOTE</ThemedText>

                  <TextInput
                    value={draftNotes}
                    onChangeText={setDraftNotes}
                    placeholder="Add cues, form reminders, warm-up notes, or anything you want to remember next time."
                    placeholderTextColor={Colors.icon}
                    multiline
                    textAlignVertical="top"
                    style={styles.notesInput}
                    autoFocus
                  />
                </View>

                <View style={styles.sheetActions}>
                  {hasNotes ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.clearNoteButton}
                      onPress={handleClearNotes}
                    >
                      <ThemedText style={styles.clearNoteButtonText}>CLEAR</ThemedText>
                    </TouchableOpacity>
                  ) : null}

                  <View style={{ flex: 1 }}>
                    <ThemedButton title="SAVE NOTE" onPress={handleSaveNotes} />
                  </View>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
};

export default BuildExerciseItem;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    zIndex: 100,
  },

  dragHandle: {
    position: "absolute",
    right: 5,
  },

  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    alignItems: "center",
  },

  titleContainer: {
    flex: 1,
    gap: 5,
    paddingRight: 12,
  },

  exerciseNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 16,
  },

  name: {
    fontFamily: Typography.family.primary.bold,
    flexShrink: 1,
  },

  metricLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.icon,
    fontFamily: Typography.family.primary.semibold,
  },

  dropdownContainer: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },

  notePreviewCard: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: Border.radius.md,
    backgroundColor: "rgba(198, 163, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(198, 163, 74, 0.18)",
    marginBottom: 14,
  },

  notePreviewIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(198, 163, 74, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  notePreviewText: {
    flex: 1,
    color: Colors.icon,
    fontFamily: Typography.family.primary.medium,
    fontSize: 13,
    lineHeight: 20,
  },

  exerciseSetsContainer: {
    gap: 8,
    marginBottom: 12,
  },

  addSetButtonContainer: {
    flexDirection: "row",
    gap: 5,
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: Border.radius.md,
  },

  addSetButtonText: {
    color: Colors.icon,
    fontFamily: Typography.family.primary.semibold,
    fontSize: 12,
  },

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
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

  exerciseContextCard: {
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

  exerciseContextLabel: {
    color: Colors.icon,
    fontSize: 10,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 1.5,
    marginBottom: 3,
  },

  exerciseContextName: {
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
