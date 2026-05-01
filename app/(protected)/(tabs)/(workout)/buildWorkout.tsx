import { ThemedText } from "@/components/themed-text";
import DropdownMenu, { DropdownMenuOption } from "@/components/ui/DropdownMenu";
import Switch from "@/components/ui/Switch";
import ThemedButton from "@/components/ui/ThemedButton";
import AddExerciseSheet from "@/components/workout/AddExerciseSheet";
import BuildExerciseItem from "@/components/workout/BuildExerciseItem";
import WorkoutNameSheet from "@/components/workout/WorkoutNameSheet";
import { Border, Colors, Typography } from "@/constants/theme";
import { firstLetterToUpperCase } from "@/lib/utils/string";
import { Exercise, ExerciseSet, WorkoutType } from "@/packages/shared/src";
import { useUserStore } from "@/stores/user-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { Entypo, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const OPTIONS: WorkoutType[] = ["strength", "conditioning", "cardio", "mixed"];

const BuildWorkout = () => {
  const router = useRouter();
  const listRef = useRef<any>(null);
  const queryClient = useQueryClient();

  const { setInitialWorkout, initialWorkout, saveWorkoutAsTemplate } = useWorkoutStore();
  const { user } = useUserStore();

  const [exercises, setExercises] = useState<Exercise[]>(initialWorkout?.exercises ?? []);
  const [addedExerciseOrSet, setAddedExerciseOrSet] = useState<boolean>(false);
  const [workoutType, setWorkoutType] = useState(initialWorkout?.workoutType ?? OPTIONS[0]);
  const [isAddExerciseSheetOpen, setIsAddExerciseSheetOpen] = useState(false);
  const [isWorkoutNameSheetVisible, setIsWorkoutNameSheetVisible] = useState(false);
  const [workoutName, setWorkoutName] = useState<string | undefined>(
    initialWorkout?.name ?? undefined,
  );
  const [isDropdownOpened, setIsDropdownOpened] = useState<boolean>(false);

  const renderItem = useCallback(({ item, drag }: RenderItemParams<Exercise>) => {
    return (
      <ScaleDecorator activeScale={0.75}>
        <BuildExerciseItem
          exercise={item}
          onDragLongPress={drag}
          onDeleteExercise={handleDelete}
          onAddSet={handleAddSet}
          onDeleteSet={handleDeleteSet}
          onEditSet={handleEditSet}
        />
      </ScaleDecorator>
    );
  }, []);

  const dropDownOptions: DropdownMenuOption[] = useMemo(
    () => [
      {
        onSelect: () => setIsWorkoutNameSheetVisible(true),
        text: "EDIT NAME",
        icon: <MaterialIcons name="edit" size={24} color={Colors.icon} />,
      },
      {
        onSelect: handleSaveAsTemplate,
        text: "SAVE AS TEMPLATE",
        icon: <MaterialIcons name="save" size={20} color={Colors.gray} />,
        disabled: !exercises.length,
      },
    ],
    [exercises],
  );

  const showToast = (message: string, actionText?: string, action?: () => void) => {
    Toast.show({
      type: "success",
      text1: message,
      props: { action, actionText: actionText },
    });
  };

  async function handleSaveAsTemplate() {
    try {
      const template = await saveWorkoutAsTemplate({
        name: workoutName,
        workoutType,
        exercises,
        notes: "",
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
  }

  function ErrorAlert() {
    return Alert.alert("Oops", "There was an error saving workout as template.", [
      { text: "Try again", onPress: handleSaveAsTemplate },
      {
        text: "Close",
        style: "destructive",
      },
    ]);
  }

  const noExercisesView = (
    <View style={styles.noExercisesContainer}>
      <View style={styles.noExercisesIconContainer}>
        <FontAwesome6 name="dumbbell" size={24} color={Colors.icon} />
      </View>
      <ThemedText type="defaultSemiBold">No exercises added</ThemedText>
      <ThemedText style={styles.noExercisesSubtext}>Add at least one exercise to begin.</ThemedText>
    </View>
  );

  const handleDragEnd = (oldData: Exercise[]) => {
    const newData: Exercise[] = [];
    oldData.forEach((item) => {
      newData.push({ ...item, id: item.id });
    });

    setExercises(newData);
  };

  const handleDelete = (exercise: Exercise) => {
    const { id } = exercise;
    setAddedExerciseOrSet(false);
    return setExercises((prev) => prev.filter((exercise) => exercise.id !== id));
  };

  const handleAddExercise = (exercise: Exercise) => {
    setAddedExerciseOrSet(true);
    setExercises((prev) => [...prev, exercise]);
  };

  const handleAddSet = (id: string, addedSet: ExerciseSet) => {
    setAddedExerciseOrSet(false);
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

  const handleCompleteBuild = () => {
    console.log("Build Workout: ", exercises);
    setInitialWorkout({
      name: workoutName ?? `${firstLetterToUpperCase(workoutType)} Workout`,
      workoutType,
      exercises,
    });
    router.push("/(protected)/(tabs)/(workout)/confirmWorkout");
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

  const handleBackPress = () => {
    (router.back(), setInitialWorkout(null));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.primary }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {isDropdownOpened && (
        <View
          style={{
            backgroundColor: Colors.background.primary,
            opacity: 0.8,
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
          }}
        />
      )}
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerContainer}>
          <Pressable onPress={handleBackPress} hitSlop={15}>
            <MaterialIcons name="keyboard-arrow-left" size={24} color={Colors.icon} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>
            {workoutName ? workoutName : `${firstLetterToUpperCase(workoutType)} Workout`}
          </ThemedText>
          {/* <TouchableOpacity onPress={() => setIsWorkoutNameSheetVisible(true)}>
            <MaterialIcons name="edit" size={24} color={Colors.icon} />
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.moreButtonContainer}>
            <DropdownMenu
              onClose={() => setIsDropdownOpened((prev) => !prev)}
              renderTriggerItem={<MaterialIcons name="more-horiz" size={22} color={Colors.icon} />}
              options={dropDownOptions}
              // menuOptionsCustomStyles={{ optionsContainer: { width: 100 } }}
            />
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 24, gap: 5 }}>
          <ThemedText style={styles.workoutTypeLabel}>WORKOUT TYPE</ThemedText>
          <Switch
            options={OPTIONS.map((option) => option.toLocaleUpperCase())}
            onChange={(value) => setWorkoutType(value.toLocaleLowerCase() as WorkoutType)}
            defaultIndex={OPTIONS.findIndex((option) => option === workoutType)}
          />
        </View>

        <View style={{ flex: 1, marginTop: 15, marginBottom: 10 }}>
          {exercises.length ? (
            <DraggableFlatList
              ref={listRef}
              data={exercises}
              onDragEnd={({ data }) => handleDragEnd(data)}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ gap: 16 }}
              showsVerticalScrollIndicator={false}
              containerStyle={{ flex: 1 }}
              onContentSizeChange={() => {
                if (addedExerciseOrSet) {
                  listRef.current?.scrollToEnd({ animated: true });
                  setAddedExerciseOrSet(false);
                }
              }}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            noExercisesView
          )}
        </View>

        <View style={{ gap: 12, paddingBottom: 10 }}>
          <TouchableOpacity
            style={styles.addExerciseButton}
            onPress={() => setIsAddExerciseSheetOpen(true)}
          >
            <Entypo name="plus" size={18} color={Colors.icon} />
            <ThemedText style={styles.addExerciseButtonText}>ADD EXERCISE</ThemedText>
          </TouchableOpacity>
          <ThemedButton
            title="COMPLETE BUILD"
            fontSize={Typography.size.sm}
            onPress={handleCompleteBuild}
            disabled={!exercises[0]?.sets.length}
          />
        </View>

        <AddExerciseSheet
          visible={isAddExerciseSheetOpen}
          onClose={() => setIsAddExerciseSheetOpen(false)}
          onSelect={handleAddExercise}
        />
        <WorkoutNameSheet
          visible={isWorkoutNameSheetVisible}
          initialValue={workoutName}
          onClose={() => setIsWorkoutNameSheetVisible(false)}
          onSave={(name) => {
            setWorkoutName(name);
          }}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default BuildWorkout;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    backgroundColor: Colors.background.primary,
    flex: 1,
  },
  titleContainer: {
    gap: 8,
    paddingBottom: 22,
  },
  workoutTypeLabel: {
    fontSize: 12,
    color: Colors.icon,
    fontFamily: Typography.family.primary.semibold,
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

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Typography.family.primary.bold,
  },

  moreButtonContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.md,
    alignItems: "center",
    justifyContent: "center",
    height: 32,
    width: 32,
  },
});
