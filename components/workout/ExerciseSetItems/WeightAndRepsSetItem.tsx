import { ThemedText } from "@/components/themed-text";
import Input from "@/components/ui/Input";
import { Border, Colors, Typography } from "@/constants/theme";
import { ExerciseSet } from "@/packages/shared/src";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";

type Props = {
  exerciseId: string;
  set: ExerciseSet;
  setIndex: number;
  onDeleteSet?: (exerciseId: string, setId: string) => void;
  onEditSet: (exerciseId: string, setId: string, set: ExerciseSet) => void;
  usedForBuilding?: boolean;
  isActive?: boolean;
  isCompleted?: boolean;
  containerStyle?: ViewStyle;
};

const WeightAndRepsSetItem = ({
  exerciseId,
  set,
  setIndex,
  onEditSet,
  onDeleteSet,
  usedForBuilding = true,
  isActive = false,
  isCompleted = false,
  containerStyle,
}: Props) => {
  return (
    <View style={[styles.exerciseSetContainer, containerStyle]}>
      {isCompleted && (
        <View style={styles.checkmarkIconContainer}>
          <Feather name="check" size={18} color={Colors.accent.primary} />
        </View>
      )}
      <ThemedText style={styles.exerciseSetSetText}>
        SET{"\n"}
        {setIndex}
      </ThemedText>
      <View style={styles.exerciseSetInputs}>
        {usedForBuilding || isActive ? (
          <Input
            placeholder="0"
            placeholderTextColor={Colors.icon}
            value={set?.weight?.toString()}
            onChangeText={(value) =>
              onEditSet(exerciseId, set.id, { ...set, weight: Number(value) })
            }
            postText="lbs"
            postTextStyle={{ color: Colors.icon, fontSize: 12 }}
            containerStyle={styles.setInput}
            keyboardType="number-pad"
            autoFocus
          />
        ) : (
          <ThemedText>{`${set.weight} lbs`}</ThemedText>
        )}
        <ThemedText style={{ color: Colors.icon }}>×</ThemedText>
        {usedForBuilding || isActive ? (
          <Input
            placeholder="0"
            placeholderTextColor={Colors.icon}
            value={set?.reps?.toString()}
            onChangeText={(value) => onEditSet(exerciseId, set.id, { ...set, reps: Number(value) })}
            postText="reps"
            postTextStyle={{ color: Colors.icon, fontSize: 12 }}
            containerStyle={styles.setInput}
            keyboardType="number-pad"
          />
        ) : (
          <ThemedText>{`${set.reps} reps`}</ThemedText>
        )}
      </View>
      {usedForBuilding && (
        <Pressable onPress={() => onDeleteSet && onDeleteSet(exerciseId, set.id)} hitSlop={15}>
          <Feather name="x" size={16} color={Colors.icon} />
        </Pressable>
      )}
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
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  setInput: {
    backgroundColor: Colors.background.primary,
    borderColor: Colors.inputBorder,
    width: 85,
    gap: 2,
    paddingHorizontal: 8,
  },
  checkmarkIconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c6a34a38",
    borderRadius: Border.radius.md,
  },
});
