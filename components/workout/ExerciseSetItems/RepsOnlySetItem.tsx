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

const RepsOnlySetItem = ({
  set,
  setIndex,
  onDeleteSet,
  onEditSet,
  exerciseId,
  usedForBuilding = true,
  isActive = false,
  isCompleted = false,
  containerStyle,
}: Props) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {isCompleted && (
        <View style={styles.checkmarkIconContainer}>
          <Feather name="check" size={18} color={Colors.accent.primary} />
        </View>
      )}
      <ThemedText style={styles.exerciseSetSetText}>
        ROUND{"\n"}
        {setIndex}
      </ThemedText>
      {usedForBuilding || isActive ? (
        <Input
          placeholder="0"
          placeholderTextColor={Colors.icon}
          value={set?.reps?.toString()}
          onChangeText={(value) => onEditSet(exerciseId, set.id, { ...set, reps: Number(value) })}
          postTextStyle={{ color: Colors.icon, fontSize: 12 }}
          containerStyle={{ ...styles.setInput, flex: 1 }}
          keyboardType="numeric"
          postText="reps"
        />
      ) : (
        <ThemedText>{`${set.reps} reps`}</ThemedText>
      )}
      {usedForBuilding && (
        <Pressable onPress={() => onDeleteSet && onDeleteSet(exerciseId, set.id)} hitSlop={15}>
          <Feather name="x" size={16} color={Colors.icon} />
        </Pressable>
      )}
    </View>
  );
};

export default RepsOnlySetItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f222888",
    borderRadius: Border.radius.md,
    padding: 10,
    gap: 10,
  },
  checkmarkIconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c6a34a38",
    borderRadius: Border.radius.md,
  },
  exerciseSetSetText: {
    color: Colors.icon,
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  setInput: {
    backgroundColor: Colors.background.primary,
    borderColor: Colors.inputBorder,
    width: 75,
    gap: 2,
    paddingHorizontal: 8,
  },
});
