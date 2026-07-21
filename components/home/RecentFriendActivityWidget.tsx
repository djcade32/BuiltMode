import { Border, Colors, Typography } from "@/constants/theme";
import { useUserFeedInfinite } from "@/hooks/social/useUserFeedInfinite";
import dayjs from "@/lib/dayjs";
import { formatFirestoreDateTimeISO } from "@/lib/utils/date";
import { useUserStore } from "@/stores/user-store";
import { FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import Avatar from "../ui/Avatar";

const RecentFriendActivityWidget = ({ isRefreshing }: { isRefreshing?: boolean }) => {
  const router = useRouter();
  const { user } = useUserStore();

  const uid = user?.uid ?? "";

  const { data, error, isLoading, hasNextPage, fetchNextPage, refetch } = useUserFeedInfinite(uid);

  const feedItems = useMemo(() => {
    const allData = data?.pages.flatMap((page) => page.items) ?? [];
    return allData.filter((item) => item.actorUid !== uid).slice(0, 3);
  }, [data, uid]);

  const navigateToFriendProfile = (uid: string) =>
    router.push({
      pathname: "/(protected)/(tabs)/(feed)/(friendProfile)/[id]",
      params: {
        id: uid,
        returnTo: "/(protected)/(tabs)",
      },
    });

  const navigateToFeed = () => {
    router.push("/(protected)/(tabs)/(feed)/feed");
  };

  useEffect(() => {
    if (feedItems.length < 3 && !isLoading && hasNextPage) {
      fetchNextPage();
    }
  }, [feedItems.length, isLoading, hasNextPage, fetchNextPage]);

  useEffect(() => {
    if (isRefreshing) {
      refetch();
    }
  }, [isRefreshing]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.icon} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContent}>
          <View style={styles.emptyIconCircle}>
            <FontAwesome5 name="exclamation-circle" size={24} color={Colors.icon} />
          </View>

          <View style={styles.emptyCopy}>
            <ThemedText style={styles.emptyTitle}>Activity unavailable</ThemedText>
            <ThemedText style={styles.emptyBody}>We couldn&apos;t load friend activity right now.</ThemedText>
          </View>
        </View>
      );
    }

    if (!feedItems.length) {
      return (
        <View style={styles.emptyContent}>
          <View style={styles.emptyIconCircle}>
            <FontAwesome5 name="user-friends" size={27} color={Colors.icon} />
          </View>

          <View style={styles.emptyCopy}>
            <ThemedText style={styles.emptyTitle}>No recent activity yet</ThemedText>
            <ThemedText style={styles.emptyBody}>
              When your friends log workouts,{"\n"}you&apos;ll see their activity here.
            </ThemedText>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.activityList}>
        {feedItems.map((item) => {
          const createdAtDayjs = dayjs(formatFirestoreDateTimeISO(item.completedAt));

          return (
            <View style={styles.activityRow} key={item.feedItemId}>
              <Avatar
                uid={item.actorUid}
                displayName={item.actorDisplayName}
                onPress={() => navigateToFriendProfile(item.actorUid)}
              />

              <View style={styles.activityCopy}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.friendNameButton}
                  onPress={() => navigateToFriendProfile(item.actorUid)}
                >
                  <ThemedText style={styles.friendName}>{item.actorDisplayName}</ThemedText>
                  <ThemedText style={styles.activitySummary}>@{item.actorUsername}</ThemedText>
                </TouchableOpacity>

                <ThemedText style={styles.activitySummary}>
                  {item.exerciseCount} exercises · {item.workoutName}
                </ThemedText>

                <ThemedText style={styles.elapsedTime}>{createdAtDayjs.fromNow()}</ThemedText>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>RECENT FRIEND ACTIVITY</ThemedText>
      </View>

      {renderContent()}

      <TouchableOpacity activeOpacity={0.85} style={styles.viewFeedButton} onPress={navigateToFeed}>
        <ThemedText style={styles.viewFeedButtonText}>VIEW FEED</ThemedText>
        <FontAwesome6 name="arrow-right" size={15} color={Colors.icon} />
      </TouchableOpacity>
    </View>
  );
};

export default RecentFriendActivityWidget;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },

  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#1f222884",
    paddingBottom: 18,
  },

  headerTitle: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    letterSpacing: 2.8,
    lineHeight: 16,
    color: Colors.icon,
  },

  centerState: {
    minHeight: 112,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingTop: 22,
    paddingBottom: 24,
  },

  emptyIconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.11)",
    backgroundColor: "rgba(255, 255, 255, 0.018)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCopy: {
    flex: 1,
    gap: 8,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontFamily: Typography.family.primary.bold,
    fontSize: 16,
    lineHeight: 22,
  },

  emptyBody: {
    color: Colors.icon,
    fontFamily: Typography.family.primary.medium,
    fontSize: 14,
    lineHeight: 22,
  },

  activityList: {
    paddingTop: 2,
  },

  activityRow: {
    paddingTop: 16,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1f222884",
    paddingBottom: 12,
    gap: 12,
  },

  activityCopy: {
    flex: 1,
  },

  friendNameButton: {
    marginBottom: 5,
  },

  friendName: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 14,
    lineHeight: 20,
  },

  activitySummary: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.icon,
    marginBottom: 3,
  },

  elapsedTime: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 10,
    lineHeight: 15,
    color: Colors.inputBorder,
  },

  viewFeedButton: {
    height: 48,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.008)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  viewFeedButtonText: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 13,
    letterSpacing: 1.7,
    color: Colors.icon,
  },
});
