import { ThemedText } from "@/components/themed-text";
import Switch from "@/components/ui/Switch";
import ThemedButton from "@/components/ui/ThemedButton";
import AddExerciseSheet from "@/components/workout/AddExerciseSheet";
import BuildExerciseItem from "@/components/workout/BuildExerciseItem";
import { Border, Colors, Typography } from "@/constants/theme";
import { Exercise, ExerciseSet } from "@/packages/shared/src";
import { Entypo, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
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

const OPTIONS = ["STRENGTH", "CONDITIONING", "CARDIO", "MIXED"];

const BuildWorkout = () => {
  const router = useRouter();
  const listRef = useRef<any>(null);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutType, setWorkoutType] = useState(OPTIONS[0]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
    return setExercises((prev) => prev.filter((exercise) => exercise.id !== id));
  };

  const handleAddSet = (id: string, addedSet: ExerciseSet) => {
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

  const handleStartWorkout = () => {
    console.log("Build Workout: ", exercises);
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.primary }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerContainer}>
          <Pressable onPress={() => router.back()}>
            <MaterialIcons name="keyboard-arrow-left" size={24} color={Colors.text.primary} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>BUILD WORKOUT</ThemedText>
        </View>

        <View style={{ marginTop: 24, gap: 5 }}>
          <ThemedText style={styles.workoutTypeLabel}>WORKOUT TYPE</ThemedText>
          <Switch options={OPTIONS} onChange={setWorkoutType} defaultIndex={0} />
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
                listRef.current?.scrollToEnd({ animated: true });
              }}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            noExercisesView
          )}
        </View>

        <View style={{ gap: 12, paddingBottom: 10 }}>
          <TouchableOpacity style={styles.addExerciseButton} onPress={() => setIsSheetOpen(true)}>
            <Entypo name="plus" size={18} color={Colors.icon} />
            <ThemedText style={styles.addExerciseButtonText}>ADD EXERCISE</ThemedText>
          </TouchableOpacity>
          <ThemedButton
            title="START WORKOUT"
            fontSize={Typography.size.sm}
            onPress={handleStartWorkout}
            disabled={!exercises.length}
          />
        </View>

        <AddExerciseSheet
          visible={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          onSelect={(exercise) => setExercises((prev) => [...prev, exercise])}
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
  subtitle: {
    fontSize: 14,
    color: Colors.icon,
    fontFamily: Typography.family.primary.medium,
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
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Typography.family.primary.bold,
  },
});
