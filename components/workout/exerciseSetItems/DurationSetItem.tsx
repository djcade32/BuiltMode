import { ThemedText } from "@/components/themed-text";
import Input from "@/components/ui/Input";
import { Border, Colors, Typography } from "@/constants/theme";
import { timeStringToSeconds } from "@/lib/utils/conversions";
import { durationTimeString, formatTimeInput } from "@/lib/utils/time";
import { Exercise, ExerciseSet } from "@/packages/shared/src";
import {
  cancelDurationTimerNotification,
  scheduleDurationTimerExpiredNotification,
} from "@/services/notification-service";
import { PersistedDurationSetTimer, useWorkoutStore } from "@/stores/workout-store";
import { Feather, FontAwesome6 } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import { useTimer } from "react-timer-hook";
import { SetUpdateTransaction } from "../BuildExerciseItem";
import { StopwatchDisplay } from "../StopwatchDisplay";

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
  isActive?: boolean;
  isCompleted?: boolean;
  containerStyle?: ViewStyle;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
};

const getExpiryTimestamp = (durationSec: number) => {
  const time = new Date();
  time.setSeconds(time.getSeconds() + Math.max(0, durationSec));
  return time;
};

const getRemainingSecondsFromExpiresAt = (expiresAtMs?: number | null) => {
  if (!expiresAtMs) return 0;

  return Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
};

const getInitialTimerSeconds = (timerState: PersistedDurationSetTimer | null, fallbackDurationSeconds: number) => {
  if (!timerState) return fallbackDurationSeconds;

  if (timerState.status === "paused") {
    return Math.max(0, timerState.pausedRemainingSeconds ?? timerState.durationSeconds ?? 0);
  }

  if (timerState.status === "running") {
    return getRemainingSecondsFromExpiresAt(timerState.expiresAtMs);
  }

  return fallbackDurationSeconds;
};

const getNearestTouchedDurationAbove = (
  transactions: SetUpdateTransaction[] | null | undefined,
  setIndex: number,
) => {
  if (!transactions) return null;

  return transactions.reduce<SetUpdateTransaction | null>((nearestTransaction, transaction) => {
    const isDurationTransaction = transaction.metric === "durationSec";
    const isAboveCurrentSet = transaction.setIndex < setIndex;

    if (!isDurationTransaction || !isAboveCurrentSet) {
      return nearestTransaction;
    }

    if (!nearestTransaction || transaction.setIndex > nearestTransaction.setIndex) {
      return transaction;
    }

    return nearestTransaction;
  }, null);
};

const timer_sound = require("@/assets/sounds/double_bell.mp3");

const DurationSetItem = ({
  exerciseId,
  set,
  setIndex,
  onEditSet,
  onDeleteSet,
  exercise,
  usedForBuilding = true,
  setUpdateTransactions,
  setSetUpdateTransactions,
  cascade = true,
  isActive = false,
  isCompleted = false,
  containerStyle,
  autoFocus = false,
  onBlur,
  onFocus,
}: Props) => {
  const hasMountedRef = useRef(false);
  const { setDurationSetTimer, durationSetTimer } = useWorkoutStore();

  const persistedDurationSetTimer = durationSetTimer;

  const currentDurationSetTimer = useMemo(() => {
    if (!persistedDurationSetTimer) return null;

    const isCurrentSetTimer =
      persistedDurationSetTimer.exerciseId === exerciseId && persistedDurationSetTimer.setId === set.id;

    return isCurrentSetTimer ? persistedDurationSetTimer : null;
  }, [persistedDurationSetTimer, exerciseId, set.id]);

  const initialTimerSeconds = getInitialTimerSeconds(currentDurationSetTimer, set.durationSec ?? 0);
  const shouldAutoStartTimer = currentDurationSetTimer?.status === "running" && initialTimerSeconds > 0;

  const [isDurationTouched, setIsDurationTouched] = useState(false);
  const [isTimerStarted, setIsTimerStarted] = useState(() => Boolean(currentDurationSetTimer));
  const [isTimerExpired, setIsTimerExpired] = useState(
    currentDurationSetTimer?.status === "expired" ||
      (currentDurationSetTimer?.status === "running" && initialTimerSeconds <= 0),
  );

  const timerCompletePlayer = useAudioPlayer(timer_sound);

  const persistDurationSetTimer = (nextTimer: PersistedDurationSetTimer | null) => {
    setDurationSetTimer(nextTimer);
  };

  const hasDurationBeenTouched = () => {
    return (
      isDurationTouched ||
      !!setUpdateTransactions?.some((transaction) => {
        return transaction.setIndex === setIndex && transaction.metric === "durationSec";
      })
    );
  };

  const playTimerCompleteSound = () => {
    try {
      timerCompletePlayer.seekTo(0);
      timerCompletePlayer.play();
    } catch (error) {
      console.warn("Unable to play timer complete sound", error);
    }
  };

  const handleTimerExpire = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playTimerCompleteSound();
    cancelDurationTimerNotification(currentDurationSetTimer?.notificationId);
    persistDurationSetTimer(null);
    setIsTimerStarted(false);
    setIsTimerExpired(true);
  };

  const timer = useTimer({
    autoStart: shouldAutoStartTimer,
    onExpire: handleTimerExpire,
    expiryTimestamp: getExpiryTimestamp(initialTimerSeconds),
  });

  const { seconds, minutes, hours, isRunning, totalSeconds, pause, restart } = timer;

  useEffect(() => {
    if (!currentDurationSetTimer) return;

    setIsTimerStarted(true);

    if (currentDurationSetTimer.status === "paused") {
      const remainingSeconds = Math.max(
        0,
        currentDurationSetTimer.pausedRemainingSeconds ?? currentDurationSetTimer.durationSeconds ?? 0,
      );

      restart(getExpiryTimestamp(remainingSeconds), false);
      setIsTimerExpired(false);
      return;
    }

    if (currentDurationSetTimer.status === "running") {
      const remainingSeconds = getRemainingSecondsFromExpiresAt(currentDurationSetTimer.expiresAtMs);

      if (remainingSeconds <= 0) {
        persistDurationSetTimer(null);
        setIsTimerStarted(false);
        setIsTimerExpired(true);
        restart(getExpiryTimestamp(0), false);
        return;
      }

      restart(getExpiryTimestamp(remainingSeconds), true);
      setIsTimerExpired(false);
    }
  }, [
    currentDurationSetTimer?.status,
    currentDurationSetTimer?.expiresAtMs,
    currentDurationSetTimer?.pausedRemainingSeconds,
  ]);

  useEffect(() => {
    if (setIndex <= 1) return;

    const previousSet = exercise.sets[setIndex - 2];

    if (!previousSet) return;

    const shouldInheritDuration =
      set.durationSec === undefined || set.durationSec === null || set.durationSec === 0;

    if (!shouldInheritDuration) return;

    const nextDurationSec = Number(previousSet.durationSec ?? 0);

    if (set.durationSec === nextDurationSec) return;

    onEditSet(exerciseId, set.id, {
      ...set,
      durationSec: nextDurationSec,
    });
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!cascade) return;

    if (setIndex <= 1 || !setUpdateTransactions?.length) return;

    if (hasDurationBeenTouched()) return;
    if (isTimerStarted) return;

    const nearestTransaction = getNearestTouchedDurationAbove(setUpdateTransactions, setIndex);

    if (!nearestTransaction) return;

    const nextDurationSec = Number(nearestTransaction.value || 0);

    if (set.durationSec === nextDurationSec) return;

    onEditSet(exerciseId, set.id, {
      ...set,
      durationSec: nextDurationSec,
    });
  }, [setUpdateTransactions]);

  const getDurationString = useMemo(() => {
    const value = set.durationSec ?? 0;
    return value > 0 ? durationTimeString(value) : undefined;
  }, [set.durationSec]);

  const handleChangeValue = (value: string) => {
    setIsDurationTouched(true);

    const stripped = value.replace(":", "");
    const restructured = formatTimeInput(stripped);
    const durationSec = timeStringToSeconds(restructured);

    cascade &&
      setSetUpdateTransactions &&
      setSetUpdateTransactions((currentTransactions) => {
        const existingTransactions = currentTransactions ?? [];

        const transactionsWithoutCurrentDuration = existingTransactions.filter((transaction) => {
          return !(transaction.setIndex === setIndex && transaction.metric === "durationSec");
        });

        const updatedTransaction: SetUpdateTransaction = {
          setIndex,
          metric: "durationSec",
          value: durationSec.toString(),
        };

        return [updatedTransaction, ...transactionsWithoutCurrentDuration];
      });

    onEditSet(exerciseId, set.id, {
      ...set,
      durationSec,
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

  const handleStartTimer = async () => {
    const initialDurationSeconds = set.durationSec ?? 0;

    if (!initialDurationSeconds) return;

    if (!isTimerStarted) setIsTimerStarted(true);

    setIsTimerExpired(false);

    const secondsUntilExpiration =
      currentDurationSetTimer?.status === "paused"
        ? Math.max(
            0,
            currentDurationSetTimer.pausedRemainingSeconds ?? currentDurationSetTimer.durationSeconds ?? 0,
          )
        : initialDurationSeconds;

    if (secondsUntilExpiration <= 0) {
      setIsTimerExpired(true);
      persistDurationSetTimer(null);
      return;
    }

    const notificationId = await scheduleDurationTimerExpiredNotification({
      secondsUntilExpiration,
    });

    persistDurationSetTimer({
      exerciseId,
      setId: set.id,
      status: "running",
      startedAtMs: Date.now(),
      expiresAtMs: Date.now() + secondsUntilExpiration * 1000,
      notificationId,
      durationSeconds: currentDurationSetTimer?.durationSeconds ?? initialDurationSeconds,
      pausedRemainingSeconds: null,
    });

    restart(getExpiryTimestamp(secondsUntilExpiration), true);
  };

  const handlePauseTimer = async () => {
    if (!isTimerStarted) return;

    const remainingSeconds = Math.max(0, totalSeconds);

    if (currentDurationSetTimer?.notificationId) {
      await cancelDurationTimerNotification(currentDurationSetTimer.notificationId);
    }

    persistDurationSetTimer({
      exerciseId,
      setId: set.id,
      status: "paused",
      startedAtMs: currentDurationSetTimer?.startedAtMs ?? null,
      expiresAtMs: null,
      notificationId: null,
      durationSeconds: currentDurationSetTimer?.durationSeconds ?? set.durationSec ?? remainingSeconds,
      pausedRemainingSeconds: remainingSeconds,
    });

    pause();
  };

  return (
    <View style={[styles.exerciseSetContainer, containerStyle]}>
      {(isCompleted || isTimerExpired) && (
        <View style={styles.checkmarkIconContainer}>
          <Feather name="check" size={12} color={Colors.accent.primary} />
        </View>
      )}

      {isActive && isCompleted ? null : (
        <ThemedText style={styles.exerciseSetSetText}>
          ROUND{"\n"}
          {setIndex}
        </ThemedText>
      )}

      <View style={styles.exerciseSetInputs}>
        {isTimerStarted ? (
          <StopwatchDisplay hours={hours} minutes={minutes} seconds={seconds} style={styles.stopwatchText} />
        ) : (
          <Input
            placeholder="00:00:00"
            placeholderTextColor={Colors.icon}
            value={getDurationString}
            onChangeText={handleChangeValue}
            postText="duration"
            postTextStyle={{ color: Colors.icon, fontSize: 12 }}
            containerStyle={{ ...styles.setInput, borderColor: isActive ? "#c6a34a50" : Colors.inputBorder }}
            keyboardType="number-pad"
            onBlur={onBlur}
            onFocus={onFocus}
            autoFocus={autoFocus}
            style={
              isActive
                ? { color: Colors.accent.primary, fontFamily: Typography.family.primary.semibold }
                : {
                    color: usedForBuilding
                      ? hasDurationBeenTouched()
                        ? Colors.text.primary
                        : Colors.text.secondary
                      : Colors.text.primary,
                  }
            }
            selectTextOnFocus
          />
        )}

        {!usedForBuilding && !isTimerExpired && isActive && (
          <TouchableOpacity style={styles.timerButton} onPress={isRunning ? handlePauseTimer : handleStartTimer}>
            <FontAwesome6 name={isRunning ? "pause" : "play"} size={16} color={Colors.accent.primary} />
          </TouchableOpacity>
        )}
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

export default DurationSetItem;

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
    width: 150,
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
  stopwatchText: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 24,
  },
  timerButton: {
    borderRadius: 6,
    backgroundColor: Colors.background.secondary,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
