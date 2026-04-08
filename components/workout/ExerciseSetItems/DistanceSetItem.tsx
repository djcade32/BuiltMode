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
  containerStyle?: ViewStyle;
  isActive?: boolean;
};

const DistanceSetItem = ({
  set,
  setIndex,
  onDeleteSet,
  onEditSet,
  exerciseId,
  usedForBuilding = true,
  containerStyle,
  isActive = false,
}: Props) => {
  if (setIndex > 1) return;
  return (
    <View
      style={[
        {
          backgroundColor: "#1f222888",
          borderRadius: Border.radius.md,
          padding: 10,
          flex: 1,
        },
        containerStyle,
      ]}
    >
      {usedForBuilding && (
        <View>
          <ThemedText style={{ color: Colors.icon, fontSize: 12, marginBottom: 5 }}>
            Duration will be tracked during workout
          </ThemedText>
        </View>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: usedForBuilding ? 5 : 15 }}>
        <ThemedText style={styles.exerciseSetSetText}>DISTANCE</ThemedText>
        {usedForBuilding || isActive ? (
          <Input
            placeholder="Optional"
            placeholderTextColor={Colors.icon}
            value={set?.distanceMeters?.toString()}
            onChangeText={(value) =>
              onEditSet(exerciseId, set.id, { ...set, distanceMeters: Number(value) })
            }
            postText="mi"
            postTextStyle={{ color: Colors.icon, fontSize: 12 }}
            containerStyle={{
              backgroundColor: Colors.background.primary,
              borderColor: Colors.inputBorder,
              gap: 2,
              paddingHorizontal: 8,
              flex: 1,
            }}
            keyboardType="decimal-pad"
          />
        ) : (
          <ThemedText>{`${set.distanceMeters} mi`}</ThemedText>
        )}
        {usedForBuilding && (
          <Pressable onPress={() => onDeleteSet && onDeleteSet(exerciseId, set.id)} hitSlop={15}>
            <Feather name="x" size={16} color={Colors.icon} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default DistanceSetItem;

const styles = StyleSheet.create({
  exerciseSetSetText: {
    color: Colors.icon,
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    letterSpacing: 0.6,
    lineHeight: 16,
  },
});
