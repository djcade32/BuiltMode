import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc";
import { ScrollView, StyleSheet, View } from "react-native";

import ModeScoreWidget from "@/components/home/ModeScoreWidget";
import PerformanceSnapshotWidget from "@/components/home/PerformanceSnapshotWidget";
import RecentFriendActivityWidget from "@/components/home/RecentFriendActivityWidget";
import TrainingTargetWidget from "@/components/home/TrainingTargetWidget";
import { ThemedText } from "@/components/themed-text";
import ThemedButton from "@/components/ui/ThemedButton";
import { Border, Colors, Typography } from "@/constants/theme";
import { useQuery } from "@/hooks/useQuery";
import { fetchUserStats } from "@/services/user-service";
import { useUserStore } from "@/stores/user-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function HomeScreen() {
  const router = useRouter();
  const { setInitialWorkout } = useWorkoutStore();
  const { user } = useUserStore();

  const uid = user?.uid;

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-stats", uid],
    queryFn: fetchUserStats,
    params: { uid: uid ?? "" },
    enabled: !!uid,
  });

  if (!user) return null;
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <ThemedText style={styles.builtmodeText}>
          BUILT
          <ThemedText
            style={[
              styles.builtmodeText,
              {
                color: Colors.accent.primary,
              },
            ]}
          >
            MODE
          </ThemedText>
        </ThemedText>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 15 }}
        showsVerticalScrollIndicator={false}
      >
        {/* WEEK STREAK HEADER */}
        <View style={styles.weekStreakHeaderSection}>
          {user.isPracticeWeek ? (
            <>
              <ThemedText
                style={{
                  fontFamily: Typography.family.primary.regular,
                  fontSize: 12,
                  lineHeight: 16,
                  letterSpacing: 3.6,
                  color: Colors.icon,
                }}
              >
                OFFICIAL START
              </ThemedText>
              <ThemedText
                style={{
                  color: Colors.accent.primary,
                  fontFamily: Typography.family.primary.bold,
                  fontSize: 24,
                  lineHeight: 32,
                  letterSpacing: 0.6,
                  marginTop: 8,
                }}
              >
                4:00 AM
              </ThemedText>
              <ThemedText
                style={{
                  fontFamily: Typography.family.tertiary.regular,
                  fontSize: 56,
                  lineHeight: 56,
                  letterSpacing: -1.4,
                  marginTop: 16,
                }}
              >
                MONDAY
              </ThemedText>
              <ThemedText
                style={{
                  color: Colors.gray,
                  fontFamily: Typography.family.primary.medium,
                  fontSize: 14,
                  lineHeight: 22.8,
                  marginTop: 24,
                }}
              >
                Your first official week begins soon.
              </ThemedText>
              <ThemedText
                style={{
                  color: Colors.icon,
                  fontSize: 12,
                  lineHeight: 19.5,
                  marginTop: 16,
                }}
              >
                Prepare now. Build consistency early.
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText style={styles.weekStreakNumber}>
                {data ? data.currentWeekStreak : 0}
              </ThemedText>
              <View style={{ marginTop: 24, alignItems: "center", gap: 8 }}>
                <ThemedText style={styles.weekStreakText}>WEEK STREAK</ThemedText>
                <ThemedText style={styles.subtext}>Consecutive Weeks Meeting Target</ThemedText>
              </View>
              <ThemedText
                style={[
                  styles.subtext,
                  {
                    letterSpacing: 0.3,
                    fontFamily: Typography.family.primary.medium,
                    color: Colors.gray,
                    marginTop: 24,
                  },
                ]}
              >
                Build Daily.
                <ThemedText
                  style={[
                    styles.subtext,
                    { letterSpacing: 0, fontFamily: Typography.family.primary.medium },
                  ]}
                >
                  Become Relentless.
                </ThemedText>
              </ThemedText>
            </>
          )}
        </View>

        {/* WIDGETS */}
        <View style={styles.widgetsContainer}>
          <TrainingTargetWidget />
          {user.isPracticeWeek ? null : <ModeScoreWidget />}
          <ThemedButton
            title="LOG WORKOUT"
            fontSize={Typography.size.sm}
            onPress={() => {
              setInitialWorkout(null);
              router.push("/(protected)/(tabs)/(workout)/log");
            }}
          />
          <PerformanceSnapshotWidget />
          <RecentFriendActivityWidget />
          {!user.isPracticeWeek ? null : (
            <View style={styles.infoContainer}>
              <View style={styles.iconContainer}>
                <FontAwesome5 name="info-circle" size={14} color={Colors.accent.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={{
                    fontFamily: Typography.family.primary.bold,
                    fontSize: 14,
                    lineHeight: 20,
                    marginBottom: 8,
                  }}
                >
                  Why doesn&apos;t my score start yet?
                </ThemedText>
                <ThemedText style={{ fontSize: 12, lineHeight: 19.5, color: Colors.icon }}>
                  To keep weekly tracking fair, all users begin on a full training week. Use this
                  time to explore and set up your routines.
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  builtmodeText: {
    fontSize: 20,
    fontFamily: Typography.family.tertiary.regular,
  },
  weekStreakNumber: {
    fontFamily: Typography.family.tertiary.regular,
    fontSize: 120,
    letterSpacing: -3,
    lineHeight: 120,
  },
  weekStreakText: {
    fontSize: 14,
    fontFamily: Typography.family.primary.bold,
    letterSpacing: 3.5,
    lineHeight: 20,
  },
  subtext: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.icon,
  },
  weekStreakHeaderSection: {
    marginTop: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  widgetsContainer: {
    paddingHorizontal: 24,
    paddingTop: 45,
    gap: 32,
  },

  infoContainer: {
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
    flexDirection: "row",
    gap: 12,
  },
  iconContainer: {
    backgroundColor: Colors.input,
    width: 40,
    height: 40,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
});
