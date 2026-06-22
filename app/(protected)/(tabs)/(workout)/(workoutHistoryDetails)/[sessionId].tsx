import { ThemedText } from "@/components/themed-text";
import DropdownMenu, { DropdownMenuOption } from "@/components/ui/DropdownMenu";
import WorkoutHistoryExerciseBreakdown from "@/components/workout/workoutHistory/WorkoutHistoryExerciseBreakdown";
import WorkoutNameSheet from "@/components/workout/WorkoutNameSheet";
import { Border, Colors, Typography } from "@/constants/theme";
import { Workout } from "@/functions/src/types/workout";
import { useQuery } from "@/hooks/useQuery";
import { breakdownSeconds } from "@/lib/utils/conversions";
import { formatWorkoutLocalDate } from "@/lib/utils/date";
import { firstLetterToUpperCase } from "@/lib/utils/string";
import { getWorkoutBySessionId } from "@/services/workout-service";
import { useUserStore } from "@/stores/user-store";
import { useWorkoutStore } from "@/stores/workout-store";
import {
  FontAwesome,
  FontAwesome6,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { RelativePathString, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const PRIMARY_GRADIENT_COLOR = "#c6a34a38";
const SECONDARY_GRADIENT_COLOR = Colors.background.primary;

const WorkoutHistoryDetails = () => {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: RelativePathString }>();

  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const { saveWorkoutAsTemplate, setInitialWorkout } = useWorkoutStore();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [isDropdownOpened, setIsDropdownOpened] = useState<boolean>(false);
  const [isWorkoutNameSheetVisible, setIsWorkoutNameSheetVisible] = useState<boolean>(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["workout", sessionId],
    queryFn: getWorkoutBySessionId,
    params: { sessionId },
    enabled: !!sessionId,
  });

  const dropDownOptions: DropdownMenuOption[] = useMemo(
    () => [
      {
        onSelect: () => data && handleCopyPress(data),
        text: "COPY",
        icon: <MaterialIcons name="content-copy" size={20} color={Colors.gray} />,
      },
      {
        onSelect: () => setIsWorkoutNameSheetVisible(true),
        text: "SAVE AS TEMPLATE",
        icon: <MaterialIcons name="save" size={20} color={Colors.gray} />,
        disabled: !data,
      },
    ],
    [data],
  );

  const workoutName = () => {
    return data?.name === ""
      ? `${firstLetterToUpperCase(data?.workoutType ?? "")} Workout`
      : data?.name;
  };

  const dateInfo = () => {
    return data?.workoutLocalDisplayTime && data.workoutLocalDate && data.workoutTimezone && data.workoutLocalDisplayDate
      ? `${data.workoutLocalDisplayDate.split(',')[0]} • ${formatWorkoutLocalDate(data.workoutLocalDate)} • ${data.workoutLocalDisplayTime}`
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

  const showToast = (message: string, actionText?: string, action?: () => void) => {
    Toast.show({
      type: "success",
      text1: message,
      props: { action, actionText: actionText },
    });
  };

  async function handleSaveAsTemplate(name?: string) {
    try {
      if (!data) return;
      const template = await saveWorkoutAsTemplate({
        ...data,
        name: name ?? data.name,
      });
      if (!template) {
        ErrorAlert();
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["templates", user?.uid ?? ""] });
      showToast("Workout saved as template", "View", () =>
        router.push("/(protected)/(tabs)/(workout)/viewTemplates"),
      );
    } catch (error) {
      console.error("Error saving workout as template: ", error);
      ErrorAlert();
    }
  }

  const handleCopyPress = (workout: Workout) => {
    setInitialWorkout({
      name: workout.name ?? "",
      exercises: workout.exercises,
      workoutType: workout.workoutType ?? "other",
    });

    router.push("/(protected)/(tabs)/(workout)/buildWorkout");
    showToast("Workout copied");
  };

  const handleBack = () => {
    if (returnTo) {
      router.replace(returnTo);
      return;
    }

    router.back();
  };

  function ErrorAlert() {
    return Alert.alert("Oops", "There was an error saving workout as template.", [
      { text: "Try again", onPress: handleSaveAsTemplate },
      {
        text: "Close",
        style: "destructive",
      },
    ]);
  }

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
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconContainer} onPress={handleBack}>
          <FontAwesome6 name="arrow-left" size={14} color={Colors.gray} />
        </TouchableOpacity>

        <ThemedText style={styles.headerText}>WORKOUT</ThemedText>
        <TouchableOpacity style={styles.iconContainer}>
          <DropdownMenu
            onOpen={() => setIsDropdownOpened(true)}
            onClose={() => setIsDropdownOpened(false)}
            renderTriggerItem={<MaterialIcons name="more-horiz" size={22} color={Colors.icon} />}
            options={dropDownOptions}
          />
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.messageContainer}>
          <ThemedText>Something went wrong loading workout.</ThemedText>
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
            <ThemedText style={styles.workoutDateText}>{`(${data.workoutTimezone})`}</ThemedText>
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
      <WorkoutNameSheet
        title="Name Template"
        visible={isWorkoutNameSheetVisible}
        onClose={() => setIsWorkoutNameSheetVisible(false)}
        onSave={(name) => {
          setIsWorkoutNameSheetVisible(false);
          handleSaveAsTemplate(name);
        }}
      />
    </SafeAreaView>
  );
};

export default WorkoutHistoryDetails;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#15181c49",
    alignItems: "center",
    height: 65,
  },
  headerText: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.4,
    fontFamily: Typography.family.primary.semibold,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
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

  // Dropdown
  dropdownOptionsContainer: {
    backgroundColor: Colors.input,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    padding: 3,
    zIndex: 101,
  },
  dropdownOptionContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
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
