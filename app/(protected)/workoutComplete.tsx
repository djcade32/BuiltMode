import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ThemedButton from "@/components/ui/ThemedButton";
import { Colors, Typography } from "@/constants/theme";
import { useQuery } from "@/hooks/useQuery";
import { uploadImageAsync } from "@/lib/firestorage";
import { breakdownSeconds } from "@/lib/utils/conversions";
import { ExerciseMetricType } from "@/packages/shared/src";
import { fetchUserStats } from "@/services/user-service";
import { publishCompletedWorkoutToFeed } from "@/services/workout-service";
import { useUserStore } from "@/stores/user-store";
import { useWorkoutStore } from "@/stores/workout-store";
import * as ImagePicker from "expo-image-picker";
import { Redirect, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";

const workoutComplete = () => {
  const router = useRouter();
  const { duration, completeWorkoutResponse, clearWorkout, activeWorkoutDraft } = useWorkoutStore();
  const { user } = useUserStore();
  const [workoutPhotoUri, setWorkoutPhotoUri] = useState<string | null>(null);
  const [isOpeningCamera, setIsOpeningCamera] = useState(false);
  const [isPublishingWorkout, setIsPublishingWorkout] = useState(false);

  const uid = user?.uid;
  const isPracticeWeek = user?.isPracticeWeek;

  const { data: userStats } = useQuery({
    queryKey: ["user-stats", uid],
    queryFn: fetchUserStats,
    params: { uid: uid ?? "" },
    enabled: !!uid,
  });

  const durationStr = useMemo(() => {
    if (!duration) return "00:00:00";
    const breakdown = breakdownSeconds(duration);
    const { minutes, hours, seconds } = breakdown;
    return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }, [duration]);

  const getExerciseMetricText = (type: ExerciseMetricType) => {
    switch (type) {
      case "weight_reps":
        return "set";
      case "reps_only":
      case "duration":
        return "round";
      case "distance":
        return "attempt";

      default:
        return "set";
    }
  };

  const handleTakeWorkoutPhoto = async () => {
    if (isOpeningCamera) return;

    try {
      setIsOpeningCamera(true);

      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Camera access needed", "BuiltMode needs camera access so you can add a post-workout photo to your completed workout.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.85,
      });

      if (!result.canceled) {
        setWorkoutPhotoUri(result.assets[0]?.uri ?? null);
      }
    } catch (error) {
      console.error("Error taking workout photo", error);
      Alert.alert("Photo failed", "We couldn't open the camera. Please try again.");
    } finally {
      setIsOpeningCamera(false);
    }
  };

  const handleRemoveWorkoutPhoto = () => {
    setWorkoutPhotoUri(null);
  };

  const handleDone = async () => {
    setIsPublishingWorkout(true);
    if (completeWorkoutResponse?.sessionId) {
      let convertedUrl = null;
      if (workoutPhotoUri) {
        convertedUrl = (await uploadImageAsync(workoutPhotoUri, `workouts/${uid}_${completeWorkoutResponse.sessionId}`)) ?? null;

        if (!convertedUrl) {
          console.warn("Avatar upload failed; creating profile without avatar");
        }
      }
      const result = await publishCompletedWorkoutToFeed(completeWorkoutResponse.sessionId, convertedUrl, null);
      if (result.feedStatus !== "published") {
        console.error("Error publishing workout to feed.");
      }
      clearWorkout();
      router.replace("/(protected)/(tabs)/(workout)/log");
    } else {
      console.warn("Cannot publish workout to feed. No session id provided.");
    }
    setIsPublishingWorkout(false);
  };

  const isTrainingTargetMet = (completeWorkoutResponse?.activeDaysThisWeek ?? 0) >= (completeWorkoutResponse?.weeklyTargetDays ?? 0);

  if (!completeWorkoutResponse) return <Redirect href={"/(protected)/(tabs)/(workout)/log"} />;

  if (!user) return null;

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} style={{ backgroundColor: Colors.background.primary }}>
      <ThemedView style={styles.container}>
        <View style={{ gap: 8, paddingBottom: 32 }}>
          <ThemedText type="title" style={{ textAlign: "center" }}>
            Workout Complete
          </ThemedText>
          <ThemedText style={[styles.subtitle, { textAlign: "center" }]}>SESSION LOGGED.</ThemedText>
        </View>

        <View>
          <View style={styles.timeInfoContainer}>
            <ThemedText style={styles.duration}>{durationStr}</ThemedText>
            <ThemedText style={[styles.subtitle, { textAlign: "center" }]}>DURATION</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.subtitle}>{isPracticeWeek ? "PRACTICE WEEK" : "MODE SCORE"}</ThemedText>
          {isPracticeWeek ? (
            <View style={styles.modeScoreContainer}>
              <ThemedText
                style={{
                  fontFamily: Typography.family.primary.bold,
                  fontSize: 20,
                  lineHeight: 28,
                  letterSpacing: -0.5,
                }}
              >
                Official tracking starts soon
              </ThemedText>
              <ThemedText
                style={{
                  fontSize: 14,
                  lineHeight: 22.8,
                  color: Colors.gray,
                }}
              >
                This workout is saved, but it won&apos;t affect your Mode Score or Week Streak yet.
              </ThemedText>
              <ThemedText
                style={{
                  fontSize: 12,
                  lineHeight: 16,
                  color: Colors.icon,
                }}
              >
                Your first official week begins Monday at 4:00 AM.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.modeScoreContainer}>
              <View
                style={{
                  justifyContent: "space-between",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <ThemedText style={styles.modeScoreText}>{completeWorkoutResponse.modeScore ?? 0}</ThemedText>
                {completeWorkoutResponse.modeScoreDifference ? (
                  <ThemedText
                    style={{
                      fontFamily: Typography.family.secondary.semibold,
                      fontSize: 14,
                      color: Colors.accent.primary,
                    }}
                  >
                    {completeWorkoutResponse.modeScoreDifference >= 1 ? "+" : "-"}
                    {Math.abs(completeWorkoutResponse.modeScoreDifference)} today
                  </ThemedText>
                ) : (
                  <></>
                )}
              </View>

              <ThemedText style={styles.modeScoreInfoText}>Based on recent activity and adherence.</ThemedText>
            </View>
          )}
        </View>
        <View style={styles.section}>
          <ThemedText style={styles.subtitle}>{isPracticeWeek ? "PREPARATION" : "WEEK PROGRESS"}</ThemedText>
          {isPracticeWeek ? (
            <View style={styles.modeScoreContainer}>
              <View
                style={{
                  borderBottomColor: Colors.inputBorder,
                  borderBottomWidth: 1,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingBottom: 10,
                }}
              >
                <View>
                  <ThemedText
                    style={{
                      fontFamily: Typography.family.primary.semibold,
                      fontSize: 12,
                      lineHeight: 16,
                      letterSpacing: 0.6,
                      color: Colors.icon,
                      marginBottom: 5,
                    }}
                  >
                    TOTAL WORKOUTS
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontFamily: Typography.family.secondary.bold,
                      fontSize: 30,
                      lineHeight: 36,
                    }}
                  >
                    {userStats?.totalWorkoutsLogged ?? 0}
                  </ThemedText>
                </View>

                <View
                  style={{
                    height: 50,
                    width: 1,
                    backgroundColor: Colors.inputBorder,
                  }}
                />

                <View>
                  <ThemedText
                    style={{
                      fontFamily: Typography.family.primary.semibold,
                      fontSize: 12,
                      lineHeight: 16,
                      letterSpacing: 0.6,
                      color: Colors.icon,
                      marginBottom: 5,
                    }}
                  >
                    OFFICIAL START
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontFamily: Typography.family.secondary.bold,
                      fontSize: 30,
                      lineHeight: 36,
                    }}
                  >
                    Monday
                  </ThemedText>
                </View>
              </View>
              <ThemedText
                style={{
                  fontSize: 12,
                  lineHeight: 16,
                  color: Colors.icon,
                  textAlign: "center",
                }}
              >
                Build rhythm before the standard begins.
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.modeScoreContainer, isTrainingTargetMet ? styles.targetMet : null]}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <ThemedText style={styles.progressText}>
                  <ThemedText style={[styles.progressText, isTrainingTargetMet ? { color: Colors.accent.primary } : null]}>{completeWorkoutResponse?.activeDaysThisWeek}</ThemedText>/
                  {completeWorkoutResponse?.weeklyTargetDays}
                </ThemedText>
                <ThemedText style={styles.daysCompletedText}>DAYS COMPLETED</ThemedText>
              </View>

              {isTrainingTargetMet && <ThemedText style={{ fontSize: 12, color: Colors.gray }}>You met your standard for the week.</ThemedText>}
              <View style={{ backgroundColor: Colors.background.primary, height: 6, borderRadius: 3 }}>
                <View
                  style={{
                    backgroundColor: Colors.accent.primary,
                    height: 6,
                    width: `${completeWorkoutResponse.weeklyTargetDays > 0 ? Math.min(100, (completeWorkoutResponse.activeDaysThisWeek / completeWorkoutResponse.weeklyTargetDays) * 100) : 0}%`,
                    borderRadius: 3,
                  }}
                />
              </View>
              {isTrainingTargetMet && <ThemedText style={{ fontSize: 12, color: Colors.icon }}>Additional workouts still count toward your history.</ThemedText>}
            </View>
          )}
        </View>
        <View style={styles.section}>
          <ThemedText style={styles.subtitle}>SESSION BREAKDOWN</ThemedText>
          <View style={{ gap: 12 }}>
            {activeWorkoutDraft?.exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseContainer}>
                <View style={styles.listNumContainer}>
                  <ThemedText style={styles.listNumText}>{index + 1}</ThemedText>
                </View>
                <View>
                  <ThemedText style={styles.exerciseName}>{exercise.name}</ThemedText>
                  <ThemedText style={styles.exerciseSet}>{`${exercise.sets.length} ${getExerciseMetricText(exercise.metricType)}${exercise.sets.length > 1 ? "s" : ""}`}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.subtitle}>POST-WORKOUT PHOTO</ThemedText>
          <View style={styles.photoCard}>
            {workoutPhotoUri ? (
              <>
                <Image source={{ uri: workoutPhotoUri }} style={styles.workoutPhotoPreview} />
                <View style={styles.photoActions}>
                  <Pressable accessibilityRole="button" onPress={handleTakeWorkoutPhoto} style={styles.secondaryPhotoButton}>
                    <ThemedText style={styles.secondaryPhotoButtonText}>RETAKE</ThemedText>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={handleRemoveWorkoutPhoto} style={styles.secondaryPhotoButton}>
                    <ThemedText style={styles.secondaryPhotoButtonText}>REMOVE</ThemedText>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.photoEmptyState}>
                  <ThemedText style={styles.photoEmptyTitle}>Show the work.</ThemedText>
                  <ThemedText style={styles.photoEmptyText}>Add an optional photo to appear with this completed workout in the feed.</ThemedText>
                </View>
                <ThemedButton title={isOpeningCamera ? "OPENING CAMERA..." : "TAKE PHOTO"} onPress={handleTakeWorkoutPhoto} />
              </>
            )}
          </View>
        </View>

        {isPracticeWeek ? (
          <ThemedText
            style={{
              color: Colors.icon,
              fontSize: 12,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Practice logged. Keep building.
          </ThemedText>
        ) : (
          <ThemedText
            style={{
              color: Colors.icon,
              fontSize: 12,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {isTrainingTargetMet ? "Great Work!" : completeWorkoutResponse.modeScoreDifference > -1 ? "Keep showing up." : "Stay consistent."}
          </ThemedText>
        )}

        <View style={styles.footContainer}>
          <ThemedButton title="DONE" onPress={handleDone} isLoading={isPublishingWorkout} />
        </View>
      </ThemedView>
    </ScrollView>
  );
};

export default workoutComplete;

const styles = StyleSheet.create({
  container: {
    paddingTop: 74,
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 1.8,
    color: Colors.icon,
  },
  section: {
    flex: 1,
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 16,
  },
  timeInfoContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
    paddingBottom: 32,
  },
  duration: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 60,
    textAlign: "center",
  },
  modeScoreContainer: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  modeScoreText: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 48,
  },
  modeScoreInfoText: {
    fontSize: 12,
    color: Colors.icon,
  },
  progressText: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 24,
  },
  daysCompletedText: {
    fontSize: 12,
    color: Colors.icon,
    letterSpacing: 0.6,
    fontFamily: Typography.family.primary.semibold,
  },
  exerciseContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  listNumContainer: {
    backgroundColor: "#c6a34a38",
    justifyContent: "center",
    alignItems: "center",
    height: 32,
    width: 32,
    borderRadius: 8,
  },
  listNumText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.accent.primary,
  },
  exerciseName: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 14,
  },
  exerciseSet: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.icon,
    marginTop: 3,
  },

  photoCard: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  photoEmptyState: {
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    gap: 6,
    alignItems: "center",
  },
  photoEmptyTitle: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 16,
  },
  photoEmptyText: {
    color: Colors.icon,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  workoutPhotoPreview: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 12,
    backgroundColor: Colors.background.primary,
  },
  photoActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryPhotoButton: {
    flex: 1,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryPhotoButtonText: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: Colors.accent.primary,
  },
  footContainer: {
    // paddingHorizontal: 24,
    // paddingTop: 24,
    padding: 24,
    borderTopColor: Colors.background.secondary,
    borderTopWidth: 1,
  },

  targetMet: {
    borderTopColor: Colors.accent.primary,
    borderTopWidth: 3,
  },
});
