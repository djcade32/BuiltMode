import { ThemedText } from "@/components/themed-text";
import Input from "@/components/ui/Input";
import { Border, Colors, Typography } from "@/constants/theme";
import { Exercise, ExerciseSet } from "@/packages/shared/src";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";

type Props = {
  exerciseId: string;
  set: ExerciseSet;
  setIndex: number;
  onDeleteSet?: (exerciseId: string, setId: string) => void;
  onEditSet: (exerciseId: string, setId: string, set: ExerciseSet) => void;
  exercise: Exercise;
  isActive?: boolean;
  isCompleted?: boolean;
  containerStyle?: ViewStyle;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
};

const WeightAndRepsSetItem = ({
  exerciseId,
  set,
  setIndex,
  onEditSet,
  onDeleteSet,
  exercise,
  isActive = false,
  isCompleted = false,
  containerStyle,
  autoFocus = false,
  onBlur,
  onFocus,
}: Props) => {
  // const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [isWeightTouched, setIsWeightTouched] = useState<boolean>(false);
  const [isRepsTouched, setIsRepsTouched] = useState<boolean>(false);

  useEffect(() => {
    if (setIndex > 1) {
      const indexOfPrevSet = exercise.sets.length - 2;

      const weight = exercise.sets[indexOfPrevSet].weight ? exercise.sets[indexOfPrevSet].weight.toString() : 0;
      const reps = exercise.sets[indexOfPrevSet].reps ? exercise.sets[indexOfPrevSet].reps.toString() : 0;

      onEditSet(exerciseId, set.id, { ...set, weight: Number(weight), reps: Number(reps) });
    }
  }, []);

  // useEffect(() => {
  //   if (setIndex > 1 && !isInitialLoad) {
  //     console.log("Sets updated: ", setIndex);
  //   }
  //   setIsInitialLoad(false);
  // }, [exercise]);
  // We can tell which set has been touched or not by looking at the sets with values within the exercise sets list. When sets are initially made they are made with undefined values.

  const handleEditWeight = (weight: string) => {
    onEditSet(exerciseId, set.id, { ...set, weight: Number(weight) });
    setIsWeightTouched(true);
  };

  const handleEditReps = (reps: string) => {
    onEditSet(exerciseId, set.id, { ...set, reps: Number(reps) });
    setIsRepsTouched(true);
  };

  return (
    <View style={[styles.exerciseSetContainer, containerStyle]}>
      {isCompleted && (
        <View style={styles.checkmarkIconContainer}>
          <Feather name="check" size={12} color={Colors.accent.primary} />
        </View>
      )}
      {isActive && isCompleted ? null : (
        <ThemedText style={styles.exerciseSetSetText}>
          SET{"\n"}
          {setIndex}
        </ThemedText>
      )}

      <View style={styles.exerciseSetInputs}>
        <Input
          placeholder="0"
          placeholderTextColor={Colors.icon}
          value={set.weight?.toString() ?? "0"}
          onChangeText={handleEditWeight}
          postText="lbs"
          postTextStyle={{ color: Colors.icon, fontSize: 12 }}
          containerStyle={{ ...styles.setInput, borderColor: isActive ? "#c6a34a50" : Colors.inputBorder }}
          keyboardType="number-pad"
          onBlur={onBlur}
          onFocus={onFocus}
          autoFocus={autoFocus}
          style={
            isActive
              ? { color: Colors.accent.primary, fontFamily: Typography.family.primary.semibold }
              : { color: isWeightTouched ? Colors.text.primary : Colors.text.secondary }
          }
          selectTextOnFocus
        />

        {/* {usedForBuilding || isActive ? (
          <Input
            placeholder="0"
            placeholderTextColor={Colors.icon}
            value={set?.weight?.toString() ?? "0"}
            onChangeText={(value) => onEditSet(exerciseId, set.id, { ...set, weight: Number(value) })}
            postText="lbs"
            postTextStyle={{ color: Colors.icon, fontSize: 12 }}
            containerStyle={{ ...styles.setInput, borderColor: isActive ? "#c6a34a50" : Colors.inputBorder }}
            keyboardType="number-pad"
            autoFocus={autoFocus}
            onBlur={onBlur}
            onFocus={onFocus}
            style={
              isActive ? { color: Colors.accent.primary, fontFamily: Typography.family.primary.semibold } : {}
            }
            selectTextOnFocus
          />
        ) : (
          <ThemedText>{`${set?.weight ?? "0"} lbs`}</ThemedText>
        )} */}
        <ThemedText style={{ color: Colors.icon }}>|</ThemedText>
        <Input
          placeholder="0"
          placeholderTextColor={Colors.icon}
          value={set.reps?.toString() ?? "0"}
          onChangeText={handleEditReps}
          postText="reps"
          postTextStyle={{ color: Colors.icon, fontSize: 12 }}
          containerStyle={{ ...styles.setInput, borderColor: isActive ? "#c6a34a50" : Colors.inputBorder }}
          keyboardType="number-pad"
          onBlur={onBlur}
          onFocus={onFocus}
          style={
            isActive
              ? { color: Colors.accent.primary, fontFamily: Typography.family.primary.semibold }
              : { color: isRepsTouched ? Colors.text.primary : Colors.text.secondary }
          }
          selectTextOnFocus
        />

        {/* <ThemedText style={{ color: Colors.icon }}>|</ThemedText>
        {usedForBuilding || isActive ? (
          <Input
            placeholder="0"
            placeholderTextColor={Colors.icon}
            value={set?.reps?.toString() ?? "0"}
            onChangeText={(value) => onEditSet(exerciseId, set.id, { ...set, reps: Number(value) })}
            postText="reps"
            postTextStyle={{ color: Colors.icon, fontSize: 12 }}
            containerStyle={{ ...styles.setInput, borderColor: isActive ? "#c6a34a50" : Colors.inputBorder }}
            keyboardType="number-pad"
            onBlur={onBlur}
            onFocus={onFocus}
            style={
              isActive ? { color: Colors.accent.primary, fontFamily: Typography.family.primary.semibold } : {}
            }
            selectTextOnFocus
          />
        ) : (
          <ThemedText>{`${set?.reps ?? "0"} reps`}</ThemedText>
        )} */}
      </View>

      <View style={{ alignItems: "flex-end" }}>
        {onDeleteSet ? (
          <Pressable onPress={() => onDeleteSet(exerciseId, set.id)} hitSlop={15}>
            <Feather name="x" size={16} color={Colors.icon} />
          </Pressable>
        ) : (
          <View style={{ width: 16 }} />
        )}
      </View>
    </View>
  );
};

export default WeightAndRepsSetItem;

const styles = StyleSheet.create({
  exerciseSetContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#1f222888",
    borderRadius: Border.radius.md,
    padding: 10,
    gap: 10,
  },
  exerciseSetSetText: {
    color: Colors.icon,
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  exerciseSetInputs: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  setInput: {
    backgroundColor: Colors.background.primary,
    width: 85,
    gap: 2,
    paddingHorizontal: 8,
  },
  checkmarkIconContainer: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c6a34a38",
    borderRadius: Border.radius.sm,
  },
});
