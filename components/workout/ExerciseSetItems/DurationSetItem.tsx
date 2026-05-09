import { ThemedText } from "@/components/themed-text";
import Input from "@/components/ui/Input";
import { Border, Colors, Typography } from "@/constants/theme";
import { timeStringToSeconds } from "@/lib/utils/conversions";
import { durationTimeString, formatTimeInput } from "@/lib/utils/time";
import { ExerciseSet } from "@/packages/shared/src";
import { Feather, FontAwesome6 } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import { useTimer } from "react-timer-hook";
import { StopwatchDisplay } from "../StopwatchDisplay";

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

const getExpiryTimestamp = (durationSec: number) => {
  const time = new Date();
  time.setSeconds(time.getSeconds() + durationSec);
  return time;
};

const timer_sound = require("@/assets/sounds/double_bell.mp3");

const DurationSetItem = ({
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
  const [isTimerStarted, setIsTimerStarted] = useState(false);
  const [isTimerExpired, setIsTimerExpired] = useState(false);

  const timerCompletePlayer = useAudioPlayer(timer_sound);

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
    setIsTimerExpired(true);
  };

  const { seconds, minutes, hours, isRunning, start, pause, restart } = useTimer({
    expiryTimestamp: getExpiryTimestamp(set.durationSec ?? 0),
    onExpire: handleTimerExpire,
    autoStart: false,
  });

  useEffect(() => {
    if (isTimerStarted) return;

    restart(getExpiryTimestamp(set.durationSec ?? 0), false);
    setIsTimerExpired(false);
  }, [set.durationSec, restart, isTimerStarted]);

  const getDurationString = useMemo(() => {
    const value = set.durationSec ?? 0;
    return value > 0 ? durationTimeString(value) : undefined;
  }, [set.durationSec]);

  const handleChangeValue = (value: string) => {
    const stripped = value.replace(":", "");
    const restructured = formatTimeInput(stripped);

    onEditSet(exerciseId, set.id, {
      ...set,
      durationSec: timeStringToSeconds(restructured),
    });
  };

  const handleStartTimer = () => {
    if (!isTimerStarted) {
      setIsTimerStarted(true);
    }

    isRunning ? pause() : start();
  };

  return (
    <View style={[styles.exerciseSetContainer, containerStyle]}>
      {(isCompleted || isTimerExpired) && (
        <View style={styles.checkmarkIconContainer}>
          <Feather name="check" size={18} color={Colors.accent.primary} />
        </View>
      )}

      <ThemedText style={styles.exerciseSetSetText}>
        ROUND{"\n"}
        {setIndex}
      </ThemedText>

      {usedForBuilding || isActive ? (
        <View style={styles.inputAndTimerContainer}>
          {isTimerStarted ? (
            <StopwatchDisplay
              hours={hours}
              minutes={minutes}
              seconds={seconds}
              style={styles.stopwatchText}
            />
          ) : (
            <Input
              placeholder="00:00:00"
              placeholderTextColor={Colors.icon}
              style={styles.inputText}
              value={getDurationString}
              onChangeText={handleChangeValue}
              postText="duration"
              postTextStyle={styles.postText}
              containerStyle={styles.inputContainer}
              keyboardType="number-pad"
              autoFocus
            />
          )}

          {!usedForBuilding && !isTimerExpired && (
            <TouchableOpacity style={styles.timerButton} onPress={handleStartTimer}>
              <FontAwesome6
                name={isRunning ? "pause" : "play"}
                size={20}
                color={Colors.accent.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ThemedText>{`${formatTimeInput(set.durationSec ?? "")} duration`}</ThemedText>
      )}

      {usedForBuilding && (
        <Pressable onPress={() => onDeleteSet?.(exerciseId, set.id)} hitSlop={15}>
          <Feather name="x" size={16} color={Colors.icon} />
        </Pressable>
      )}
    </View>
  );
};

export default DurationSetItem;

const styles = StyleSheet.create({
  exerciseSetContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1f222888",
    borderRadius: Border.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 10,
  },
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
  inputAndTimerContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    justifyContent: "space-between",
  },
  stopwatchText: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 24,
  },
  inputText: {
    letterSpacing: 0.6,
  },
  postText: {
    color: Colors.icon,
    fontSize: 12,
  },
  inputContainer: {
    backgroundColor: Colors.background.primary,
    borderColor: Colors.inputBorder,
    gap: 2,
    paddingHorizontal: 8,
    flex: 1,
  },
  timerButton: {
    borderRadius: 6,
    backgroundColor: Colors.background.secondary,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
