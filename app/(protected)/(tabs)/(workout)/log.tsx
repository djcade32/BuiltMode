import { ThemedText } from "@/components/themed-text";
import ThemedButton from "@/components/ui/ThemedButton";
import WorkoutHistoryCard from "@/components/workout/workoutHistory/WorkoutHistoryCard";
import { Border, Colors, Typography } from "@/constants/theme";
import { Template } from "@/functions/src/types/template";
import { Workout } from "@/functions/src/types/workout";
import { useUserTemplatesInfinite } from "@/hooks/workouts/useUserTemplatesInfinite";
import { useUserWorkoutsInfinite } from "@/hooks/workouts/useUserWorkoutsInfinite";
import { firstLetterToUpperCase } from "@/lib/utils/string";
import { durationTimeString } from "@/lib/utils/time";
import { useUserStore } from "@/stores/user-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, RelativePathString, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
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

type SectionDividerProps = {
  title: string;
  variant?: "gold" | "gray";
};

type EmptySectionCardProps = {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  body: string;
};

const SectionDivider = ({ title, variant = "gold" }: SectionDividerProps) => {
  const accentColor = variant === "gold" ? PRIMARY_GRADIENT_COLOR : PRIMARY_GRADIENT_COLOR_HISTORY;

  return (
    <View style={styles.sectionDivider}>
      <LinearGradient
        colors={[SECONDARY_GRADIENT_COLOR, accentColor]}
        start={{ x: 1.0, y: 0.5 }}
        end={{ x: 0.0, y: 0.5 }}
        style={styles.titleUnderline}
      />

      <ThemedText style={styles.sessionLogTitle}>{title}</ThemedText>

      <LinearGradient
        colors={[accentColor, SECONDARY_GRADIENT_COLOR]}
        start={{ x: 1.0, y: 0.5 }}
        end={{ x: 0.0, y: 0.5 }}
        style={styles.titleUnderline}
      />
    </View>
  );
};

const EmptySectionCard = ({ iconName, title, body }: EmptySectionCardProps) => {
  return (
    <View style={styles.emptySectionCard}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name={iconName} size={32} color={Colors.accent.primary} />
      </View>

      <View style={styles.emptyCopyContainer}>
        <ThemedText style={styles.emptySectionTitle}>{title}</ThemedText>
        <ThemedText style={styles.emptySectionBody}>{body}</ThemedText>
      </View>
    </View>
  );
};

const TemplateItem = ({ template, onPress }: TemplateItemProps) => {
  const { name, exercises, workoutType } = template;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.templateItemContainer}
      onPress={() => onPress(template)}
    >
      <ThemedText style={styles.templateItemTitle} ellipsizeMode="tail" numberOfLines={1}>
        {name}
      </ThemedText>

      <ThemedText style={[styles.templateItemNumOfExercises, styles.templateExerciseCount]}>
        {`${exercises.length} exercises`}
      </ThemedText>

      <ThemedText style={styles.templateItemNumOfExercises}>
        {firstLetterToUpperCase(workoutType ?? "other")}
      </ThemedText>
    </TouchableOpacity>
  );
};

const LastWorkout = ({ workout, onPress }: WorkoutItemProps) => {
  const { name, duration, exercises, workoutType, workoutLocalDisplayDate } =
    workout;

  return (
    <View style={styles.lastWorkoutContainer}>
      <View style={styles.lastWorkoutHeader}>
        <ThemedText style={styles.lastWorkoutTitleText}>LAST WORKOUT</ThemedText>

        <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(workout)}>
          <ThemedText style={styles.repeatButtonText}>REPEAT</ThemedText>
        </TouchableOpacity>
      </View>

      <ThemedText style={styles.lastWorkoutName} ellipsizeMode="tail" numberOfLines={1}>
        {name}
      </ThemedText>

      <ThemedText style={styles.lastWorkoutInfoText}>
        {exercises.length} exercises • {firstLetterToUpperCase(workoutType ?? "other")}
      </ThemedText>

      <View style={styles.lastWorkoutFooterContainer}>
        <ThemedText style={styles.lastWorkoutFooterText}>
          <Ionicons name="calendar-clear" size={12} />{" "}
          {workoutLocalDisplayDate}
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

  const handleBuildWorkoutPress = () => {
    setInitialWorkout(null);
    router.push("/(protected)/(tabs)/(workout)/buildWorkout");
  };

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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <ThemedText type="title">LOG</ThemedText>
          <ThemedText style={styles.subtitle}>Build your session. Then start.</ThemedText>
        </View>

        <View style={styles.primaryButtonWrapper}>
          <ThemedButton
            title="BUILD WORKOUT"
            fontSize={Typography.size.sm}
            onPress={handleBuildWorkoutPress}
          />
        </View>

        {/* Quick Start Section */}
        <View style={styles.quickStartSection}>
          <SectionDivider title="QUICK START" />

          <View style={styles.sectionHorizontalPadding}>
            {fetchedWorkoutsIsLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={Colors.icon} />
              </View>
            ) : fetchedWorkoutsError ? (
              <EmptySectionCard
                iconName="alert-circle-outline"
                title="Could not load quick start"
                body="Pull down to refresh or try again in a moment."
              />
            ) : workouts.length ? (
              <LastWorkout
                workout={workouts[0]}
                onPress={() => handleRepeatWorkoutPress(workouts[0])}
              />
            ) : (
              <EmptySectionCard
                iconName="flash-outline"
                title="No quick starts yet"
                body="Build a workout and start it to see your quick start options here."
              />
            )}
          </View>
        </View>

        {/* Templates Section */}
        <View style={styles.templatesSection}>
          <View style={styles.templatesHeader}>
            <ThemedText style={styles.templatesSectionTitle}>TEMPLATES</ThemedText>

            {templates.length ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push("/(protected)/(tabs)/(workout)/viewTemplates")}
              >
                <ThemedText style={styles.viewAllButton}>
                  VIEW ALL <FontAwesome6 name="arrow-right" size={12} />
                </ThemedText>
              </TouchableOpacity>
            ) : null}
          </View>

          {fetchedTemplatesIsLoading ? (
            <View style={[styles.loadingCard, styles.templatesLoadingCard]}>
              <ActivityIndicator color={Colors.icon} />
            </View>
          ) : fetchedTemplatesError ? (
            <View style={styles.templatesEmptyWrapper}>
              <EmptySectionCard
                iconName="alert-circle-outline"
                title="Could not load templates"
                body="Pull down to refresh or try again in a moment."
              />
            </View>
          ) : !fetchedTemplates ? (
            <View style={styles.templatesEmptyWrapper}>
              <EmptySectionCard
                iconName="document-text-outline"
                title="Templates not found"
                body="Your saved workout templates will appear here."
              />
            </View>
          ) : templates.length ? (
            <FlatList
              data={templates}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TemplateItem template={item} onPress={() => handleTemplatePress(item)} />
              )}
              horizontal
              style={styles.templatesContainer}
              contentContainerStyle={styles.templatesListContent}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <View style={styles.templatesEmptyWrapper}>
              <EmptySectionCard
                iconName="document-text-outline"
                title="No templates"
                body="Save workouts as templates to build faster next time."
              />
            </View>
          )}
        </View>

        {/* History Section */}
        <View style={styles.historySectionContainer}>
          <SectionDivider title="HISTORY" variant="gray" />

          <View style={styles.historyContent}>
            {fetchedWorkoutsIsLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={Colors.icon} />
              </View>
            ) : fetchedWorkoutsError ? (
              <EmptySectionCard
                iconName="alert-circle-outline"
                title="Could not load history"
                body="Pull down to refresh or try again in a moment."
              />
            ) : workouts.length ? (
              <View style={styles.historyList}>
                {workouts.map((workout) => (
                  <WorkoutHistoryCard
                    key={workout.sessionId}
                    workout={workout}
                    onPress={() => router.push(`/(workoutHistoryDetails)/${workout.sessionId}`)}
                  />
                ))}
              </View>
            ) : (
              <EmptySectionCard
                iconName="time-outline"
                title="No workout history"
                body="Your completed workouts will appear here."
              />
            )}
          </View>
        </View>

        <Link href={historyHref as RelativePathString} asChild>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.viewHistoryButtonContainer}
            disabled={!hasUid}
          >
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

  scrollContent: {
    paddingBottom: 32,
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

  primaryButtonWrapper: {
    paddingHorizontal: 24,
  },

  quickStartSection: {
    gap: 16,
    marginTop: 32,
  },

  sectionHorizontalPadding: {
    paddingHorizontal: 24,
  },

  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 24,
  },

  sessionLogTitle: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.icon,
  },

  titleUnderline: {
    height: 1.5,
    flex: 1,
  },

  loadingCard: {
    minHeight: 102,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: "rgba(255, 255, 255, 0.012)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptySectionCard: {
    minHeight: 102,
    padding: 18,
    backgroundColor: "rgba(255, 255, 255, 0.012)",
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.035)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.045)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCopyContainer: {
    flex: 1,
    gap: 6,
  },

  emptySectionTitle: {
    color: "#FFFFFF",
    fontFamily: Typography.family.primary.bold,
    fontSize: 15,
    lineHeight: 20,
  },

  emptySectionBody: {
    color: Colors.icon,
    fontFamily: Typography.family.primary.medium,
    fontSize: 14,
    lineHeight: 20,
  },

  templatesSection: {
    marginTop: 32,
    paddingLeft: 24,
    paddingBottom: 32,
  },

  templatesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 24,
    alignItems: "center",
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

  templatesListContent: {
    gap: 12,
    paddingRight: 24,
  },

  templatesEmptyWrapper: {
    paddingTop: 16,
    paddingRight: 24,
  },

  templatesLoadingCard: {
    marginTop: 16,
    marginRight: 24,
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

  templateExerciseCount: {
    marginBottom: 5,
    color: Colors.gray,
  },

  lastWorkoutContainer: {
    padding: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.md,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },

  lastWorkoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
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

  historySectionContainer: {
    paddingHorizontal: 24,
  },

  historyContent: {
    paddingTop: 16,
  },

  historyList: {
    gap: 12,
  },

  viewHistoryButtonContainer: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 24,
  },

  viewHistoryButton: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 12,
    color: Colors.gray,
    textAlign: "center",
    letterSpacing: 1.2,
  },
});
