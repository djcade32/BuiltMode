import { Colors, Typography } from "@/constants/theme";
import { useQuery } from "@/hooks/useQuery";
import { fetchUserWeekAggregate } from "@/services/user-service";
import { useUserStore } from "@/stores/user-store";
import { getWeekId } from "@builtmode/shared";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import Progressbar from "../ui/Progressbar";

const TrainingTargetWidget = () => {
  const { user } = useUserStore();

  const uid = user?.uid;

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-week-aggregate", user ? getWeekId(new Date(), user.homeTimezone) : "", uid],
    queryFn: fetchUserWeekAggregate,
    params: { uid: uid ?? "", weekId: user ? getWeekId(new Date(), user.homeTimezone) : "" },
    enabled: !!user,
  });

  const getPercentage = useCallback(
    () => (data && user ? (data.activeDaysThisWeek / user.weeklyTargetDays) * 100 : 0),
    [user?.weeklyTargetDays, data?.activeDaysThisWeek],
  );

  const getDaysLeft = () => {
    const today = new Date().getDay();
    if (today === 0) return 1;
    return Math.abs(today - 8);
  };

  if (!user) return null;

  return (
    <View style={[styles.container, data?.metTargetThisWeek ? styles.targetMet : null]}>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.loading}>
          <ThemedText style={{ color: Colors.icon, fontSize: 12 }}>
            Error loading training metrics
          </ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>TRAINING TARGET</ThemedText>
            <ThemedText style={styles.headerTitle}>
              {user.isPracticeWeek ? "OFFICIAL START" : "THIS WEEK"}
            </ThemedText>
          </View>

          <View style={styles.infoTextContainer}>
            <ThemedText style={styles.targetDaysText}>
              {user.weeklyTargetDays} Days / Week
            </ThemedText>

            {user.isPracticeWeek ? (
              <ThemedText
                style={{
                  fontFamily: Typography.family.primary.bold,
                  fontSize: 16,
                  lineHeight: 24,
                  color: Colors.accent.primary,
                }}
              >
                In {getDaysLeft()} {getDaysLeft() > 1 ? "Days" : "Day"}
              </ThemedText>
            ) : (
              <ThemedText
                style={{
                  fontFamily: Typography.family.primary.bold,
                  fontSize: 18,
                  lineHeight: 28,
                  color: Colors.icon,
                }}
              >
                <ThemedText
                  style={{
                    fontFamily: Typography.family.primary.bold,
                    fontSize: 24,
                    lineHeight: 32,
                    color: data?.metTargetThisWeek ? Colors.accent.primary : Colors.text.primary,
                  }}
                >
                  {data?.activeDaysThisWeek ?? 0}
                </ThemedText>{" "}
                /{user.weeklyTargetDays}
              </ThemedText>
            )}
          </View>

          {user.isPracticeWeek && (
            <View style={{ height: 1, width: "100%", backgroundColor: Colors.inputBorder }} />
          )}

          {user.isPracticeWeek ? (
            <ThemedText
              style={{
                fontSize: 12,
                color: Colors.icon,
                lineHeight: 16,
                textAlign: "center",
                marginTop: 16,
              }}
            >
              Your streak and Mode Score activate next week.
            </ThemedText>
          ) : (
            <View>
              <Progressbar percentage={getPercentage()} />
              {data?.metTargetThisWeek ? (
                <ThemedText
                  style={{
                    fontSize: 12,
                    color: Colors.accent.primary,
                    lineHeight: 16,
                    textAlign: "right",
                    marginTop: 10,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={12} /> Target met
                </ThemedText>
              ) : null}
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default TrainingTargetWidget;

const styles = StyleSheet.create({
  loading: {
    justifyContent: "center",
    alignItems: "center",
    height: 80,
  },
  container: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.65,
    // shadowRadius: 6,
    // elevation: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    letterSpacing: 2.4,
    lineHeight: 16,
    color: Colors.icon,
  },
  infoTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  targetDaysText: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  targetMet: {
    borderTopWidth: 3,
    borderTopColor: Colors.accent.primary,
  },
});
