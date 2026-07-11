import { ThemedText } from "@/components/themed-text";
import Input from "@/components/ui/Input";
import { Border, Colors, Typography } from "@/constants/theme";
import { Exercise, ExerciseSet } from "@/packages/shared/src";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { SetUpdateTransaction } from "../BuildExerciseItem";

type Props = {
  exerciseId: string;
  set: ExerciseSet;
  setIndex: number;
  onDeleteSet?: (exerciseId: string, setId: string) => void;
  onEditSet: (exerciseId: string, setId: string, set: ExerciseSet) => void;
  exercise: Exercise;
  usedForBuilding?: boolean;
  setUpdateTransactions?: SetUpdateTransaction[] | null;
  setSetUpdateTransactions?: React.Dispatch<React.SetStateAction<SetUpdateTransaction[] | null>>;
  cascade?: boolean;
  containerStyle?: ViewStyle;
  isActive?: boolean;
  isCompleted?: boolean;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
};

const getNearestTouchedDistanceAbove = (
  transactions: SetUpdateTransaction[] | null | undefined,
  setIndex: number,
) => {
  if (!transactions) return null;

  return transactions.reduce<SetUpdateTransaction | null>((nearestTransaction, transaction) => {
    const isDistanceTransaction = transaction.metric === "distanceMiles";
    const isAboveCurrentSet = transaction.setIndex < setIndex;

    if (!isDistanceTransaction || !isAboveCurrentSet) {
      return nearestTransaction;
    }

    if (!nearestTransaction || transaction.setIndex > nearestTransaction.setIndex) {
      return transaction;
    }

    return nearestTransaction;
  }, null);
};

const DistanceSetItem = ({
  set,
  setIndex,
  onDeleteSet,
  onEditSet,
  exerciseId,
  exercise,
  usedForBuilding = true,
  setUpdateTransactions,
  setSetUpdateTransactions,
  cascade = true,
  containerStyle,
  isActive = false,
  isCompleted = false,
  autoFocus = false,
  onBlur,
  onFocus,
}: Props) => {
  const hasMountedRef = useRef(false);

  const [isDistanceTouched, setIsDistanceTouched] = useState(false);

  const hasDistanceBeenTouched = () => {
    return (
      isDistanceTouched ||
      !!setUpdateTransactions?.some((transaction) => {
        return transaction.setIndex === setIndex && transaction.metric === "distanceMiles";
      })
    );
  };

  useEffect(() => {
    if (setIndex <= 1) return;

    const previousSet = exercise.sets[setIndex - 2];

    if (!previousSet) return;

    const shouldInheritDistance =
      set.distanceMiles === undefined || set.distanceMiles === null || set.distanceMiles === 0;

    if (!shouldInheritDistance) return;

    const nextDistance = Number(previousSet.distanceMiles ?? 0);

    if (set.distanceMiles === nextDistance) return;

    onEditSet(exerciseId, set.id, {
      ...set,
      distanceMiles: nextDistance,
    });
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!cascade) return;

    if (setIndex <= 1 || !setUpdateTransactions?.length) return;

    if (hasDistanceBeenTouched()) return;

    const nearestTransaction = getNearestTouchedDistanceAbove(setUpdateTransactions, setIndex);

    if (!nearestTransaction) return;

    const nextDistance = Number(nearestTransaction.value || 0);

    if (set.distanceMiles === nextDistance) return;

    onEditSet(exerciseId, set.id, {
      ...set,
      distanceMiles: nextDistance,
    });
  }, [setUpdateTransactions]);

  const handleEditDistance = (value: string) => {
    setIsDistanceTouched(true);

    cascade &&
      setSetUpdateTransactions &&
      setSetUpdateTransactions((currentTransactions) => {
        const existingTransactions = currentTransactions ?? [];

        const transactionsWithoutCurrentDistance = existingTransactions.filter((transaction) => {
          return !(transaction.setIndex === setIndex && transaction.metric === "distanceMiles");
        });

        const updatedTransaction: SetUpdateTransaction = {
          setIndex,
          metric: "distanceMiles",
          value,
        };

        return [updatedTransaction, ...transactionsWithoutCurrentDistance];
      });

    onEditSet(exerciseId, set.id, {
      ...set,
      distanceMiles: Number(value || 0),
    });
  };

  const handleDeleteSet = (exerciseId: string, id: string) => {
    if (!onDeleteSet) return;

    onDeleteSet(exerciseId, id);

    cascade &&
      setSetUpdateTransactions &&
      setSetUpdateTransactions((currentTransactions) => {
        if (!currentTransactions) return currentTransactions;

        return currentTransactions
          .filter((transaction) => transaction.setIndex !== setIndex)
          .map((transaction) => {
            if (transaction.setIndex < setIndex) {
              return transaction;
            }

            return {
              ...transaction,
              setIndex: transaction.setIndex - 1,
            };
          });
      });
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
          ATTEMPT{"\n"}
          {setIndex}
        </ThemedText>
      )}

      <View style={styles.exerciseSetInputs}>
        <Input
          placeholder="0"
          placeholderTextColor={Colors.icon}
          value={set.distanceMiles?.toString() ?? "0"}
          onChangeText={handleEditDistance}
          postText="mi"
          postTextStyle={{ color: Colors.icon, fontSize: 12 }}
          containerStyle={{ ...styles.setInput, borderColor: isActive ? "#c6a34a50" : Colors.inputBorder }}
          keyboardType="decimal-pad"
          onBlur={onBlur}
          onFocus={onFocus}
          autoFocus={autoFocus}
          style={
            isActive
              ? { color: Colors.accent.primary, fontFamily: Typography.family.primary.semibold }
              : {
                  color: usedForBuilding
                    ? hasDistanceBeenTouched()
                      ? Colors.text.primary
                      : Colors.text.secondary
                    : Colors.text.primary,
                }
          }
          selectTextOnFocus
        />
      </View>

      <View style={{ alignItems: "flex-end" }}>
        {onDeleteSet ? (
          <Pressable onPress={() => handleDeleteSet(exerciseId, set.id)} hitSlop={15}>
            <Feather name="x" size={16} color={Colors.icon} />
          </Pressable>
        ) : (
          <View style={{ width: 16 }} />
        )}
      </View>
    </View>
  );
};

export default DistanceSetItem;

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
    gap: 10,
  },
  setInput: {
    backgroundColor: Colors.background.primary,
    width: "100%",
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
