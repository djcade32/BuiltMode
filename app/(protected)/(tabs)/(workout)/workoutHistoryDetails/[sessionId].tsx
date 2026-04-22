import { ThemedText } from "@/components/themed-text";
import WorkoutHistoryExerciseBreakdown from "@/components/workout/workoutHistory/WorkoutHistoryExerciseBreakdown";
import { Border, Colors, Typography } from "@/constants/theme";
import { useQuery } from "@/hooks/useQuery";
import { breakdownSeconds } from "@/lib/utils/conversions";
import { formatFirestoreDateTime, getFirestoreDayLabel } from "@/lib/utils/date";
import { firstLetterToUpperCase } from "@/lib/utils/string";
import { getWorkoutBySessionId } from "@/services/workout-service";
import { FontAwesome, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Menu, MenuOption, MenuOptions, MenuTrigger, renderers } from "react-native-popup-menu";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY_GRADIENT_COLOR = "#c6a34a38";
const SECONDARY_GRADIENT_COLOR = Colors.background.primary;

const WorkoutHistoryDetails = () => {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [isDropdownOpened, setIsDropdownOpened] = useState<boolean>(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["workout", sessionId],
    queryFn: getWorkoutBySessionId,
    params: { sessionId },
    enabled: !!sessionId,
  });

  const DropDown = useCallback(() => {
    return (
      <Menu
        renderer={renderers.ContextMenu}
        rendererProps={{ placement: "bottom" }}
        onClose={() => setIsDropdownOpened(false)}
      >
        <MenuTrigger
          customStyles={{ TriggerTouchableComponent: TouchableOpacity }}
          onPress={() => setIsDropdownOpened((prev) => !prev)}
        >
          <MaterialIcons name="more-horiz" size={22} color={Colors.icon} />
        </MenuTrigger>
        <MenuOptions
          customStyles={{
            optionsContainer: styles.dropdownOptionsContainer,
          }}
        >
          <MenuOption
            onSelect={() => {}}
            customStyles={{
              OptionTouchableComponent: TouchableOpacity,
              optionWrapper: styles.dropdownOptionContainer,
            }}
          >
            <MaterialIcons name="content-copy" size={20} color={Colors.gray} />
            <ThemedText style={styles.dropdownOptionText}>COPY</ThemedText>
          </MenuOption>

          <MenuOption
            onSelect={() => {}}
            customStyles={{
              OptionTouchableComponent: TouchableOpacity,
              optionWrapper: styles.dropdownOptionContainer,
            }}
          >
            <MaterialIcons name="save" size={20} color={Colors.gray} />
            <ThemedText style={styles.dropdownOptionText}>SAVE TEMPLATE</ThemedText>
          </MenuOption>
        </MenuOptions>
      </Menu>
    );
  }, []);

  const workoutName = () => {
    return data?.name === ""
      ? `${firstLetterToUpperCase(data?.workoutType ?? "")} Workout`
      : data?.name;
  };

  const dateInfo = () => {
    return data?.completedAt
      ? `${getFirestoreDayLabel(data.completedAt)} • ${formatFirestoreDateTime(data.completedAt)}`
      : "";
  };

  const durationTime = () => {
    const { hours, minutes, seconds } = breakdownSeconds(data?.duration ?? 0);

    if (hours > 0) {
      return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }

    return `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const workoutType = () => {
    return data?.workoutType ? firstLetterToUpperCase(data.workoutType) : "";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
      <View style={styles.headerContainer}>
        <Pressable testID="workout-details-back-button" onPress={() => router.back()} hitSlop={15}>
          <MaterialIcons name="keyboard-arrow-left" size={24} color={Colors.icon} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>WORKOUT</ThemedText>
        <TouchableOpacity style={styles.moreButtonContainer}>
          <DropDown />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.messageContainer}>
          <ThemedText>Something went wrong loading workouts.</ThemedText>
        </View>
      ) : !data ? (
        <View style={styles.messageContainer}>
          <ThemedText>Workout not found.</ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.workoutInfoContainer}>
            <ThemedText style={styles.workoutName}>{workoutName()}</ThemedText>
            <ThemedText style={styles.workoutDateText}>{dateInfo()}</ThemedText>
            <View style={styles.moreInfoContainer}>
              <View style={{ flexDirection: "row", gap: 5 }}>
                <MaterialCommunityIcons name="clock" size={14} color={Colors.gray} />
                <ThemedText style={styles.workoutMoreInfoText}>{durationTime()}</ThemedText>
              </View>

              <View style={styles.separator} />
              <ThemedText style={styles.workoutMoreInfoText}>{workoutType()}</ThemedText>
              <View style={styles.separator} />
              <ThemedText style={styles.workoutMoreInfoText}>
                {data.exercises.length} exercise{data.exercises.length > 1 ? "s" : ""}
              </ThemedText>
            </View>
          </View>
          <View style={styles.exercisesBreakdownContainer}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LinearGradient
                colors={[SECONDARY_GRADIENT_COLOR, PRIMARY_GRADIENT_COLOR]}
                start={{ x: 1.0, y: 0.5 }}
                end={{ x: 0.0, y: 0.5 }}
                style={styles.titleUnderline}
              />
              <ThemedText style={styles.sessionLogTitle}>SESSION LOG</ThemedText>
              <LinearGradient
                colors={[PRIMARY_GRADIENT_COLOR, SECONDARY_GRADIENT_COLOR]}
                start={{ x: 1.0, y: 0.5 }}
                end={{ x: 0.0, y: 0.5 }}
                style={styles.titleUnderline}
              />
            </View>
            <FlatList
              style={{ flex: 1 }}
              data={data.exercises}
              showsVerticalScrollIndicator={false}
              renderItem={(exercise) => (
                <WorkoutHistoryExerciseBreakdown exercise={exercise.item} />
              )}
              keyExtractor={(exercise) => exercise.id}
              contentContainerStyle={{ gap: 24, paddingTop: 24, paddingBottom: 15 }}
              ListFooterComponentStyle={{ flex: 1, justifyContent: "flex-end" }}
              ListFooterComponent={() => {
                if (!data.notes) return null;
                return (
                  <View style={styles.notesContainer}>
                    <View style={styles.notesHeaderContainer}>
                      <FontAwesome name="sticky-note" size={12} color={Colors.icon} />
                      <ThemedText style={styles.notesTitle}>NOTES</ThemedText>
                    </View>
                    <ThemedText style={styles.notesText}>{data.notes}</ThemedText>
                  </View>
                );
              }}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

export default WorkoutHistoryDetails;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Typography.family.primary.bold,
  },
  workoutInfoContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 8,
    borderBottomColor: Colors.cardBorder,
    borderBottomWidth: 1,
    paddingBottom: 20,
  },
  workoutName: {
    fontFamily: Typography.family.primary.bold,
  },
  workoutDateText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.icon,
  },
  moreInfoContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  workoutMoreInfoText: {
    fontFamily: Typography.family.primary.medium,
    color: Colors.gray,
    fontSize: 12,
  },
  separator: {
    height: 11,
    width: 1,
    borderRadius: 9999,
    backgroundColor: Colors.inputBorder,
  },
  sessionLogTitle: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.icon,
  },
  titleUnderline: {
    height: 1.5,
    flex: 1,
  },
  exercisesBreakdownContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    flex: 1,
  },
  moreButtonContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.md,
    alignItems: "center",
    justifyContent: "center",
    height: 32,
    width: 32,
  },

  // Dropdown
  dropdownOptionsContainer: {
    backgroundColor: Colors.input,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    padding: 8,
    width: 165,
    zIndex: 101,
  },
  dropdownOptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dropdownOptionText: {
    fontSize: 12,
    color: Colors.gray,
    letterSpacing: 0.6,
  },

  // Notes
  notesContainer: {
    gap: 5,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  notesHeaderContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  notesTitle: {
    fontSize: 12,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 0.6,
    color: Colors.icon,
  },
  notesText: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 22.8,
  },

  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageContainer: {
    paddingTop: 24,
  },
});
