import { ThemedText } from "@/components/themed-text";
import ThemedButton from "@/components/ui/ThemedButton";
import WorkoutHistoryCard from "@/components/workout/workoutHistory/WorkoutHistoryCard";
import { Border, Colors, Typography } from "@/constants/theme";
import { Template } from "@/functions/src/types/template";
import { Workout } from "@/functions/src/types/workout";
import { useUserTemplatesInfinite } from "@/hooks/workouts/useUserTemplatesInfinite";
import { useUserWorkoutsInfinite } from "@/hooks/workouts/useUserWorkoutsInfinite";
import { formatFirestoreTimestamp } from "@/lib/utils/date";
import { firstLetterToUpperCase } from "@/lib/utils/string";
import { durationTimeString } from "@/lib/utils/time";

import { useUserStore } from "@/stores/user-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, RelativePathString, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY_GRADIENT_COLOR = "#c6a34a38";
const SECONDARY_GRADIENT_COLOR = Colors.background.primary;

const PRIMARY_GRADIENT_COLOR_HISTORY = Colors.icon;

type WorkoutItemProps = {
  workout: Workout;
  onPress: (workout: Workout) => void;
};

type TemplateItemProps = {
  template: Template;
  onPress: (workout: Template) => void;
};

const TemplateItem = ({ template, onPress }: TemplateItemProps) => {
  const { name, exercises, workoutType } = template;

  return (
    <TouchableOpacity style={styles.templateItemContainer} onPress={() => onPress(template)}>
      <ThemedText style={styles.templateItemTitle} ellipsizeMode="tail" numberOfLines={1}>
        {name}
      </ThemedText>
      <ThemedText
        style={[styles.templateItemNumOfExercises, { marginBottom: 5, color: Colors.gray }]}
      >{`${exercises.length} exercises`}</ThemedText>
      <ThemedText style={styles.templateItemNumOfExercises}>
        {firstLetterToUpperCase(workoutType ?? "other")}
      </ThemedText>
    </TouchableOpacity>
  );
};

const LastWorkout = ({ workout, onPress }: WorkoutItemProps) => {
  const { name, completedAt, duration, exercises, workoutType } = workout;

  return (
    <View style={styles.lastWorkoutContainer}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <ThemedText style={styles.lastWorkoutTitleText}>LAST WORKOUT</ThemedText>
        <TouchableOpacity onPress={() => onPress(workout)}>
          <ThemedText style={styles.repeatButtonText}>REPEAT</ThemedText>
        </TouchableOpacity>
      </View>
      <ThemedText style={styles.lastWorkoutName} ellipsizeMode="tail" numberOfLines={1}>
        {name}
      </ThemedText>
      <View>
        <ThemedText style={styles.lastWorkoutInfoText}>
          {exercises.length} exercises • {firstLetterToUpperCase(workoutType ?? "other")}
        </ThemedText>
      </View>
      <View style={styles.lastWorkoutFooterContainer}>
        <ThemedText style={styles.lastWorkoutFooterText}>
          <Ionicons name="calendar-clear" size={12} /> {formatFirestoreTimestamp(completedAt)}
        </ThemedText>
        <ThemedText style={styles.lastWorkoutFooterText}>
          <MaterialCommunityIcons name="clock" size={12} /> {durationTimeString(duration)}
        </ThemedText>
      </View>
    </View>
  );
};

const Log = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { setInitialWorkout } = useWorkoutStore();

  const uid = user?.uid ?? "";
  const hasUid = Boolean(uid);
  const historyHref = hasUid
    ? `/(protected)/(tabs)/(workout)/(viewHistory)/${uid}`
    : "/(protected)/(tabs)/(workout)/log";

  const {
    data: fetchedTemplates,
    error: fetchedTemplatesError,
    isLoading: fetchedTemplatesIsLoading,
  } = useUserTemplatesInfinite(uid, 6);
  const {
    data: fetchedWorkouts,
    error: fetchedWorkoutsError,
    isLoading: fetchedWorkoutsIsLoading,
  } = useUserWorkoutsInfinite(uid, 3);

  const templates = useMemo(() => {
    return (fetchedTemplates?.pages.flatMap((page) => page.items) ?? []).slice(0, 6);
  }, [fetchedTemplates]);

  const workouts = useMemo(() => {
    return (fetchedWorkouts?.pages.flatMap((page) => page.items) ?? []).slice(0, 3);
  }, [fetchedWorkouts]);

  const handleRepeatWorkoutPress = (workout: Workout) => {
    setInitialWorkout({
      name: workout.name ?? "",
      exercises: workout.exercises,
      workoutType: workout.workoutType ?? "other",
    });

    router.push("/(protected)/(tabs)/(workout)/confirmWorkout");
  };

  const handleTemplatePress = (template: Template) => {
    setInitialWorkout({
      name: template.name ?? "",
      exercises: template.exercises,
      workoutType: template.workoutType ?? "other",
    });

    router.push("/(protected)/(tabs)/(workout)/buildWorkout");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image source={require("@/assets/images/full_logo.png")} style={styles.logo} />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 15 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <ThemedText type="title">LOG</ThemedText>
          <ThemedText style={styles.subtitle}>Build your session. Then start.</ThemedText>
        </View>
        <View style={{ paddingHorizontal: 24 }}>
          <ThemedButton
            title="BUILD WORKOUT"
            fontSize={Typography.size.sm}
            onPress={() => {
              setInitialWorkout(null);
              router.push("/(protected)/(tabs)/(workout)/buildWorkout");
            }}
          />
        </View>

        <View style={{ gap: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              marginTop: 32,
              paddingHorizontal: 24,
            }}
          >
            <LinearGradient
              colors={[SECONDARY_GRADIENT_COLOR, PRIMARY_GRADIENT_COLOR]}
              start={{ x: 1.0, y: 0.5 }}
              end={{ x: 0.0, y: 0.5 }}
              style={styles.titleUnderline}
            />
            <ThemedText style={styles.sessionLogTitle}>QUICK START</ThemedText>
            <LinearGradient
              colors={[PRIMARY_GRADIENT_COLOR, SECONDARY_GRADIENT_COLOR]}
              start={{ x: 1.0, y: 0.5 }}
              end={{ x: 0.0, y: 0.5 }}
              style={styles.titleUnderline}
            />
          </View>

          {/* Last Workout Section */}
          <View style={{ paddingHorizontal: 24 }}>
            {workouts.length ? (
              <LastWorkout
                workout={workouts[0]}
                onPress={() => handleRepeatWorkoutPress(workouts[0])}
              />
            ) : null}
          </View>

          {/* Templates Section */}
          <View style={styles.templatesSection}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingRight: 24,
                alignItems: "center",
              }}
            >
              <ThemedText style={styles.templatesSectionTitle}>TEMPLATES</ThemedText>
              {templates.length ? (
                <TouchableOpacity
                  onPress={() => router.push("/(protected)/(tabs)/(workout)/viewTemplates")}
                >
                  <ThemedText style={styles.viewAllButton}>
                    VIEW ALL <FontAwesome6 name="arrow-right" size={12} />
                  </ThemedText>
                </TouchableOpacity>
              ) : null}
            </View>
            {fetchedTemplatesIsLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator />
              </View>
            ) : fetchedTemplatesError ? (
              <View style={styles.messageContainer}>
                <ThemedText>Something went wrong loading templates.</ThemedText>
              </View>
            ) : !fetchedTemplates ? (
              <View style={styles.messageContainer}>
                <ThemedText>Templates not found.</ThemedText>
              </View>
            ) : (
              <>
                <FlatList
                  data={templates}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TemplateItem template={item} onPress={() => handleTemplatePress(item)} />
                  )}
                  horizontal
                  style={styles.templatesContainer}
                  contentContainerStyle={{ gap: 12, paddingRight: 24 }}
                  showsHorizontalScrollIndicator={false}
                  ListEmptyComponent={() => (
                    <View style={styles.messageContainer}>
                      <ThemedText style={styles.emptyMessageText}>No Templates</ThemedText>
                    </View>
                  )}
                  scrollEnabled={!!templates.length}
                />
              </>
            )}
          </View>
        </View>

        {/* History section */}
        <View style={styles.historySectionContainer}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <LinearGradient
              colors={[SECONDARY_GRADIENT_COLOR, PRIMARY_GRADIENT_COLOR_HISTORY]}
              start={{ x: 1.0, y: 0.5 }}
              end={{ x: 0.0, y: 0.5 }}
              style={styles.titleUnderline}
            />
            <ThemedText style={styles.sessionLogTitle}>HISTORY</ThemedText>
            <LinearGradient
              colors={[PRIMARY_GRADIENT_COLOR_HISTORY, SECONDARY_GRADIENT_COLOR]}
              start={{ x: 1.0, y: 0.5 }}
              end={{ x: 0.0, y: 0.5 }}
              style={styles.titleUnderline}
            />
          </View>
          <View style={{ paddingTop: 16 }}>
            {fetchedWorkoutsIsLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator />
              </View>
            ) : fetchedWorkoutsError ? (
              <View style={styles.messageContainer}>
                <ThemedText>Something went wrong loading workout history.</ThemedText>
              </View>
            ) : !workouts.length ? (
              <View style={styles.messageContainer}>
                <ThemedText style={styles.emptyMessageText}>No Workout History</ThemedText>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {workouts.map((workout) => (
                  <WorkoutHistoryCard
                    key={workout.sessionId}
                    workout={workout}
                    onPress={() => router.push(`/(workoutHistoryDetails)/${workout.sessionId}`)}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        <Link href={historyHref as RelativePathString} asChild style={{ marginTop: 24 }}>
          <TouchableOpacity style={styles.viewHistoryButtonContainer} disabled={!hasUid}>
            <ThemedText style={styles.viewHistoryButton}>VIEW ALL HISTORY</ThemedText>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Log;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#15181c49",
    justifyContent: "center",
    height: 65,
  },
  logo: {
    height: 20,
    width: 120,
    objectFit: "contain",
  },
  titleContainer: {
    paddingTop: 10,
    paddingHorizontal: 24,
    gap: 8,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.icon,
    fontFamily: Typography.family.primary.medium,
  },
  templatesSection: {
    marginTop: 16,
    paddingLeft: 24,
    paddingBottom: 32,
  },
  templatesSectionTitle: {
    fontSize: 12,
    color: Colors.icon,
    fontFamily: Typography.family.primary.semibold,
  },
  viewAllButton: {
    fontSize: 12,
    color: Colors.gray,
    fontFamily: Typography.family.primary.semibold,
  },
  templatesContainer: {
    paddingTop: 16,
  },
  lastWorkoutContainer: {
    padding: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.md,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  lastWorkoutTitleText: {
    fontSize: 9,
    color: Colors.icon,
    letterSpacing: 0.45,
    fontFamily: Typography.family.primary.semibold,
  },
  repeatButtonText: {
    fontSize: 14,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 0.7,
    color: Colors.accent.primary,
  },
  lastWorkoutName: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 18,
    letterSpacing: 0.45,
  },
  lastWorkoutInfoText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.gray,
    paddingTop: 4,
  },
  lastWorkoutFooterContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: 12,
    flexDirection: "row",
    gap: 20,
  },
  lastWorkoutFooterText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.icon,
  },
  templateItemContainer: {
    padding: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignSelf: "flex-start",
    width: 140,
  },
  templateItemIcon: {
    backgroundColor: "#c6a34a38",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: Border.radius.md,
  },
  templateItemTitle: {
    fontSize: 14,
    fontFamily: Typography.family.primary.semibold,
    marginBottom: 12,
  },
  templateItemNumOfExercises: {
    fontSize: 12,
    fontFamily: Typography.family.secondary.regular,
    color: Colors.icon,
  },
  historySectionContainer: {
    paddingHorizontal: 24,
  },
  viewHistoryButtonContainer: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    padding: 16,
    marginHorizontal: 24,
  },
  viewHistoryButton: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 12,
    color: Colors.gray,
    textAlign: "center",
    letterSpacing: 1.2,
  },

  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 24,
    flex: 1,
  },
  emptyMessageText: {
    color: Colors.icon,
    textAlign: "center",
    fontSize: 12,
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
});
