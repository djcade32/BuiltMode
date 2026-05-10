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
  isCompleted?: boolean;
  autoFocus?: boolean;
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
  isCompleted = false,
  autoFocus = false,
}: Props) => {
  return (
    <View
      style={[
        {
          backgroundColor: "#1f222888",
          borderRadius: Border.radius.md,
          flex: 1,
        },
        containerStyle,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 20,
          justifyContent: "space-between",
          paddingVertical: 10,
          paddingHorizontal: 20,
        }}
      >
        {isCompleted && (
          <View style={styles.checkmarkIconContainer}>
            <Feather name="check" size={18} color={Colors.accent.primary} />
          </View>
        )}
        <ThemedText style={styles.exerciseSetSetText}>
          ATTEMPT{"\n"}
          {setIndex}
        </ThemedText>
        {usedForBuilding || isActive ? (
          <Input
            placeholder="0"
            placeholderTextColor={Colors.icon}
            value={set?.distanceMiles?.toString()}
            onChangeText={(value) =>
              onEditSet(exerciseId, set.id, { ...set, distanceMiles: Number(value) })
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
            autoFocus={autoFocus}
          />
        ) : (
          <ThemedText>{`${set.distanceMiles} mi`}</ThemedText>
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
  checkmarkIconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c6a34a38",
    borderRadius: Border.radius.md,
  },
});
