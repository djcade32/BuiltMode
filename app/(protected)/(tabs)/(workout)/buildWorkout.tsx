import { ThemedText } from "@/components/themed-text";
import DropdownMenu, { DropdownMenuOption } from "@/components/ui/DropdownMenu";
import Switch from "@/components/ui/Switch";
import ThemedButton from "@/components/ui/ThemedButton";
import AddExerciseSheet from "@/components/workout/AddExerciseSheet";
import BuildExerciseItem from "@/components/workout/BuildExerciseItem";
import WorkoutNameSheet from "@/components/workout/WorkoutNameSheet";
import WorkoutNoteSheet from "@/components/workout/WorkoutNoteSheet";
import { Border, Colors, Typography } from "@/constants/theme";
import { firstLetterToUpperCase } from "@/lib/utils/string";
import { Exercise, ExerciseMetricType, ExerciseSet, WorkoutType } from "@/packages/shared/src";
import { useUserStore } from "@/stores/user-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { Entypo, FontAwesome5, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const OPTIONS: WorkoutType[] = ["strength", "conditioning", "cardio", "mixed"];

type PendingScrollAction =
  | {
      type: "exercise_added";
    }
  | {
      type: "set_added";
      exerciseId: string;
    };

const BuildWorkout = () => {
  const router = useRouter();
  const listRef = useRef<any>(null);
  const queryClient = useQueryClient();
  const exerciseInputBlurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingScrollActionRef = useRef<PendingScrollAction | null>(null);

  const { setInitialWorkout, initialWorkout, saveWorkoutAsTemplate } = useWorkoutStore();
  const { user } = useUserStore();

  const [exercises, setExercises] = useState<Exercise[]>(initialWorkout?.exercises ?? []);
  const [workoutType, setWorkoutType] = useState(initialWorkout?.workoutType ?? OPTIONS[0]);
  const [workoutName, setWorkoutName] = useState<string | undefined>(initialWorkout?.name ?? undefined);
  const [workoutNotes, setWorkoutNotes] = useState<string>(initialWorkout?.notes ?? "");

  const [isAddExerciseSheetOpen, setIsAddExerciseSheetOpen] = useState(false);
  const [isWorkoutNameSheetVisible, setIsWorkoutNameSheetVisible] = useState(false);
  const [isWorkoutNoteSheetVisible, setIsWorkoutNoteSheetVisible] = useState(false);
  const [isDropdownOpened, setIsDropdownOpened] = useState<boolean>(false);
  const [isEditingExerciseInput, setIsEditingExerciseInput] = useState(false);

  const displayWorkoutName = workoutName ?? `${firstLetterToUpperCase(workoutType)} Workout`;
  const hasWorkoutNotes = Boolean(workoutNotes.trim());

  const isExerciseEditingMode =
    isEditingExerciseInput && !isAddExerciseSheetOpen && !isWorkoutNameSheetVisible && !isWorkoutNoteSheetVisible;

  const hasAtLeastOneSet = exercises.some((exercise) => exercise.sets.length > 0);

  useEffect(() => {
    return () => {
      if (exerciseInputBlurTimeoutRef.current) {
        clearTimeout(exerciseInputBlurTimeoutRef.current);
      }
    };
  }, []);

  const handleExerciseInputFocus = useCallback(() => {
    if (exerciseInputBlurTimeoutRef.current) {
      clearTimeout(exerciseInputBlurTimeoutRef.current);
    }

    setIsEditingExerciseInput(true);
  }, []);

  const handleExerciseInputBlur = useCallback(() => {
    exerciseInputBlurTimeoutRef.current = setTimeout(() => {
      setIsEditingExerciseInput(false);
    }, 80);
  }, []);

  const showToast = (message: string, actionText?: string, action?: () => void) => {
    Toast.show({
      type: "success",
      text1: message,
      props: { action, actionText },
    });
  };

  const handleOpenWorkoutNoteSheet = useCallback(() => {
    setIsEditingExerciseInput(false);
    setIsWorkoutNoteSheetVisible(true);
  }, []);

  const handleSaveAsTemplate = useCallback(async () => {
    try {
      const template = await saveWorkoutAsTemplate({
        name: displayWorkoutName,
        workoutType,
        exercises,
        notes: workoutNotes.trim(),
      });

      if (!template) {
        ErrorAlert();
      }

      queryClient.invalidateQueries({ queryKey: ["templates", user?.uid ?? ""] });

      showToast("Workout saved as template", "View", () =>
        router.push("/(protected)/(tabs)/(workout)/viewTemplates"),
      );
    } catch (error) {
      console.error("Error saving workout as template: ", error);
      ErrorAlert();
    }
  }, [
    displayWorkoutName,
    workoutType,
    exercises,
    workoutNotes,
    saveWorkoutAsTemplate,
    queryClient,
    user?.uid,
    router,
  ]);

  function ErrorAlert() {
    return Alert.alert("Oops", "There was an error saving workout as template.", [
      { text: "Try again", onPress: handleSaveAsTemplate },
      {
        text: "Close",
        style: "destructive",
      },
    ]);
  }

  const getWorkoutType = useCallback(() => OPTIONS.findIndex((option) => option === workoutType), [workoutType]);

  const dropDownOptions: DropdownMenuOption[] = useMemo(
    () => [
      {
        onSelect: () => {
          setIsEditingExerciseInput(false);
          setIsWorkoutNameSheetVisible(true);
        },
        text: "Edit Name",
        icon: <MaterialIcons name="edit" size={14} color={Colors.icon} />,
      },
      {
        onSelect: handleOpenWorkoutNoteSheet,
        text: hasWorkoutNotes ? "Edit Note" : "Add Note",
        icon: <FontAwesome5 name="sticky-note" size={14} color={Colors.icon} />,
      },
      {
        onSelect: handleSaveAsTemplate,
        text: "Save As Template",
        icon: <MaterialIcons name="save" size={14} color={Colors.gray} />,
        disabled: !exercises.length,
      },
    ],
    [exercises.length, handleSaveAsTemplate, handleOpenWorkoutNoteSheet, hasWorkoutNotes],
  );

  const scrollToPendingTarget = useCallback(() => {
    const pendingAction = pendingScrollActionRef.current;

    if (!pendingAction) return;

    pendingScrollActionRef.current = null;

    requestAnimationFrame(() => {
      if (pendingAction.type === "exercise_added") {
        listRef.current?.scrollToEnd({ animated: true });
        return;
      }

      const exerciseIndex = exercises.findIndex((exercise) => exercise.id === pendingAction.exerciseId);

      if (exerciseIndex === -1) return;

      listRef.current?.scrollToIndex({
        index: exerciseIndex,
        animated: true,
        viewPosition: 1,
      });
    });
  }, [exercises]);

  const handleScrollToIndexFailed = useCallback((info: any) => {
    const offset = Math.max(0, info.averageItemLength * info.index);

    listRef.current?.scrollToOffset({
      offset,
      animated: true,
    });

    setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: info.index,
        animated: true,
        viewPosition: 1,
      });
    }, 120);
  }, []);

  const handleDragEnd = (oldData: Exercise[]) => {
    const newData: Exercise[] = [];

    oldData.forEach((item) => {
      newData.push({ ...item, id: item.id });
    });

    setExercises(newData);
  };

  const handleDelete = (exercise: Exercise) => {
    const { id } = exercise;

    pendingScrollActionRef.current = null;

    return setExercises((prev) => prev.filter((exercise) => exercise.id !== id));
  };

  const handleAddExercise = (exercise: Exercise) => {
    pendingScrollActionRef.current = {
      type: "exercise_added",
    };

    setExercises((prev) => [...prev, exercise]);
  };

  const handleAddSet = (id: string, addedSet: ExerciseSet) => {
    pendingScrollActionRef.current = {
      type: "set_added",
      exerciseId: id,
    };

    setExercises((prevExercises) =>
      prevExercises.map((exercise) => {
        if (exercise.id === id) {
          return {
            ...exercise,
            sets: [...exercise.sets, addedSet],
          };
        }

        return exercise;
      }),
    );
  };

  const handleDeleteSet = (exerciseId: string, setId: string) => {
    pendingScrollActionRef.current = null;

    setExercises((prevExercises) =>
      prevExercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.filter((set) => setId !== set.id),
          };
        }

        return exercise;
      }),
    );
  };

  const handleEditSet = (exerciseId: string, setId: string, updatedSet: ExerciseSet) => {
    setExercises((prevExercises) =>
      prevExercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: exercise.sets.map((set) => (set.id === setId ? updatedSet : set)),
          };
        }

        return exercise;
      }),
    );
  };

  const handleChangeMetricType = (exerciseId: string, metricType: ExerciseMetricType) => {
    pendingScrollActionRef.current = null;

    setExercises((prevExercises) =>
      prevExercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            metricType,
            sets: [],
          };
        }

        return exercise;
      }),
    );
  };

  const handleChangeExerciseNotes = (exerciseId: string, notes: string) => {
    setExercises((prevExercises) =>
      prevExercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            notes,
          };
        }

        return exercise;
      }),
    );
  };

  const handleCompleteBuild = () => {
    console.log("Build Workout: ", exercises);

    setInitialWorkout({
      name: displayWorkoutName,
      workoutType,
      exercises,
      notes: workoutNotes.trim(),
    });

    router.push("/(protected)/(tabs)/(workout)/confirmWorkout");
  };

  const handleBackPress = () => {
    router.back();
    setInitialWorkout(null);
  };

  const handleOpenAddExerciseSheet = () => {
    setIsEditingExerciseInput(false);
    setIsAddExerciseSheetOpen(true);
  };

  const renderItem = useCallback(
    ({ item, drag }: RenderItemParams<Exercise>) => {
      return (
        <ScaleDecorator activeScale={0.75}>
          <BuildExerciseItem
            exercise={item}
            onDragLongPress={drag}
            onDeleteExercise={handleDelete}
            onAddSet={handleAddSet}
            onDeleteSet={handleDeleteSet}
            onEditSet={handleEditSet}
            onChangeExerciseNotes={handleChangeExerciseNotes}
            onChangeMetricType={handleChangeMetricType}
            onExerciseInputFocus={handleExerciseInputFocus}
            onExerciseInputBlur={handleExerciseInputBlur}
          />
        </ScaleDecorator>
      );
    },
    [handleExerciseInputFocus, handleExerciseInputBlur],
  );

  const noExercisesView = (
    <View style={styles.noExercisesContainer}>
      <View style={styles.noExercisesIconContainer}>
        <FontAwesome6 name="dumbbell" size={24} color={Colors.icon} />
      </View>

      <ThemedText type="defaultSemiBold">No exercises added</ThemedText>

      <ThemedText style={styles.noExercisesSubtext}>Add at least one exercise to begin.</ThemedText>

      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.addExerciseButton, { width: "100%", marginTop: 25 }]}
        onPress={handleOpenAddExerciseSheet}
      >
        <Entypo name="plus" size={18} color={Colors.icon} />
        <ThemedText style={styles.addExerciseButtonText}>ADD EXERCISE</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {isDropdownOpened && <View style={styles.dropdownOverlay} />}

      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconContainer} onPress={handleBackPress}>
            <FontAwesome6 name="arrow-left" size={14} color={Colors.gray} />
          </TouchableOpacity>

          <ThemedText style={styles.headerText} numberOfLines={1}>
            {displayWorkoutName}
          </ThemedText>

          <TouchableOpacity activeOpacity={0.8} style={styles.iconContainer}>
            <DropdownMenu
              onClose={() => setIsDropdownOpened((prev) => !prev)}
              renderTriggerItem={<MaterialIcons name="more-horiz" size={22} color={Colors.icon} />}
              options={dropDownOptions}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {!isExerciseEditingMode && (
            <View style={styles.workoutTypeSection}>
              <ThemedText style={styles.workoutTypeLabel}>WORKOUT TYPE</ThemedText>

              <Switch
                options={OPTIONS.map((option) => option.toLocaleUpperCase())}
                onChange={(value) => setWorkoutType(value.toLocaleLowerCase() as WorkoutType)}
                defaultIndex={getWorkoutType()}
              />
            </View>
          )}

          {hasWorkoutNotes && !isExerciseEditingMode ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.workoutNotePreviewCard}
              onPress={handleOpenWorkoutNoteSheet}
            >
              <View style={styles.workoutNotePreviewIcon}>
                <FontAwesome5 name="sticky-note" size={11} color={Colors.accent.primary} />
              </View>

              <View style={styles.workoutNotePreviewCopy}>
                <ThemedText style={styles.workoutNotePreviewLabel}>WORKOUT NOTE</ThemedText>
                <ThemedText style={styles.workoutNotePreviewText}>{workoutNotes}</ThemedText>
              </View>
            </TouchableOpacity>
          ) : null}

          <View style={styles.exerciseListContainer}>
            {exercises.length ? (
              <DraggableFlatList
                ref={listRef}
                data={exercises}
                onDragEnd={({ data }) => handleDragEnd(data)}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={[
                  styles.exerciseListContent,
                  isExerciseEditingMode && styles.exerciseListContentEditing,
                ]}
                showsVerticalScrollIndicator={false}
                containerStyle={styles.exerciseList}
                onContentSizeChange={scrollToPendingTarget}
                onScrollToIndexFailed={handleScrollToIndexFailed}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                ListFooterComponentStyle={styles.listFooterComponent}
                ListFooterComponent={() => {
                  if (isExerciseEditingMode) return null;

                  return (
                    <View style={styles.footerActions}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.addExerciseButton}
                        onPress={handleOpenAddExerciseSheet}
                      >
                        <Entypo name="plus" size={18} color={Colors.icon} />
                        <ThemedText style={styles.addExerciseButtonText}>ADD EXERCISE</ThemedText>
                      </TouchableOpacity>

                      <ThemedButton
                        title="COMPLETE BUILD"
                        fontSize={Typography.size.sm}
                        onPress={handleCompleteBuild}
                        disabled={!hasAtLeastOneSet}
                      />
                    </View>
                  );
                }}
              />
            ) : (
              noExercisesView
            )}
          </View>

          <AddExerciseSheet
            visible={isAddExerciseSheetOpen}
            onClose={() => {
              setIsAddExerciseSheetOpen(false);
              setIsEditingExerciseInput(false);
            }}
            onSelect={handleAddExercise}
          />

          <WorkoutNameSheet
            visible={isWorkoutNameSheetVisible}
            initialValue={workoutName}
            onClose={() => {
              setIsWorkoutNameSheetVisible(false);
              setIsEditingExerciseInput(false);
            }}
            onSave={(name) => {
              setWorkoutName(name);
            }}
          />

          <WorkoutNoteSheet
            visible={isWorkoutNoteSheetVisible}
            workoutName={displayWorkoutName}
            initialValue={workoutNotes}
            onClose={() => {
              setIsWorkoutNoteSheetVisible(false);
              setIsEditingExerciseInput(false);
            }}
            onSave={(note) => {
              setWorkoutNotes(note);
            }}
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default BuildWorkout;

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },

  dropdownOverlay: {
    backgroundColor: Colors.background.primary,
    opacity: 0.8,
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },

  container: {
    backgroundColor: Colors.background.primary,
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#15181c49",
    alignItems: "center",
    height: 65,
  },

  headerText: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.4,
    fontFamily: Typography.family.primary.semibold,
    maxWidth: "62%",
    textAlign: "center",
  },

  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    paddingHorizontal: 24,
    flex: 1,
  },

  workoutTypeSection: {
    marginTop: 24,
    gap: 5,
    paddingBottom: 5,
  },

  workoutTypeLabel: {
    fontSize: 12,
    color: Colors.icon,
    fontFamily: Typography.family.primary.semibold,
  },

  workoutNotePreviewCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: Border.radius.md,
    backgroundColor: "rgba(198, 163, 74, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(198, 163, 74, 0.18)",
    marginTop: 12,
    marginBottom: 8,
  },

  workoutNotePreviewIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(198, 163, 74, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  workoutNotePreviewCopy: {
    flex: 1,
    gap: 4,
  },

  workoutNotePreviewLabel: {
    color: Colors.accent.primary,
    fontSize: 10,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 1.4,
  },

  workoutNotePreviewText: {
    color: Colors.icon,
    fontFamily: Typography.family.primary.medium,
    fontSize: 13,
    lineHeight: 20,
    flexShrink: 1,
  },

  exerciseListContainer: {
    flex: 1,
  },

  exerciseList: {
    flex: 1,
  },

  exerciseListContent: {
    gap: 16,
    paddingTop: 10,
    paddingBottom: 10,
    flexGrow: 1,
  },

  exerciseListContentEditing: {
    paddingTop: 16,
    paddingBottom: 40,
  },

  listFooterComponent: {
    flex: 1,
    justifyContent: "flex-end",
  },

  noExercisesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  noExercisesIconContainer: {
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    backgroundColor: Colors.background.secondary,
    width: 64,
    height: 64,
    borderRadius: 64 / 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  noExercisesSubtext: {
    fontSize: 14,
    color: Colors.icon,
    marginTop: 8,
  },

  footerActions: {
    gap: 12,
    paddingBottom: 10,
  },

  addExerciseButton: {
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    borderRadius: Border.radius.md,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    borderStyle: "dashed",
  },

  addExerciseButtonText: {
    color: Colors.icon,
    textAlign: "center",
    fontSize: 14,
    fontFamily: Typography.family.tertiary.regular,
  },
});
