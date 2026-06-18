import WorkoutCompleteFeedItem from "@/components/feed/feedItems/WorkoutCompleteFeedItem";
import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { useUserFeedInfinite } from "@/hooks/social/useUserFeedInfinite";
import { useUserStore } from "@/stores/user-store";
import { FeedItem } from "@builtmode/shared";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FeedFilterOptions = ["ALL", "WORKOUTS", "MILESTONES"];

function EmptyFeedState({
  onFindFriends,
  onLogWorkout,
}: {
  onFindFriends: () => void;
  onLogWorkout: () => void;
}) {
  return (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIllustration}>
        <View style={[styles.feedPreviewCard, styles.feedPreviewCardLeft]}>
          <View style={styles.previewAvatar}>
            <FontAwesome5 name="user" size={10} color={Colors.gray} />
          </View>

          <View style={styles.previewIconRow}>
            <FontAwesome5 name="dumbbell" size={24} color={Colors.icon} />
            <View style={styles.previewCheck}>
              <FontAwesome5 name="check" size={9} color={Colors.accent.primary} />
            </View>
          </View>

          <View style={styles.previewLine} />
          <View style={[styles.previewLine, styles.previewLineShort]} />
        </View>

        <View style={[styles.feedPreviewCard, styles.feedPreviewCardRight]}>
          <View style={styles.previewAvatar}>
            <FontAwesome5 name="user" size={10} color={Colors.gray} />
          </View>

          <View style={[styles.previewIconRow, { paddingLeft: 35 }]}>
            <FontAwesome5 name="mountain" size={25} color={Colors.accent.primary} />
          </View>

          <View style={styles.previewLine} />
          <View style={[styles.previewLine, styles.previewLineShort]} />
        </View>

        <View style={styles.emptyCenterBadge}>
          <FontAwesome5 name="user-friends" size={26} color={Colors.accent.primary} />
        </View>

        <View style={[styles.emptyDot, styles.emptyDotOne]} />
        <View style={[styles.emptyDot, styles.emptyDotTwo]} />
        <View style={[styles.emptyDot, styles.emptyDotThree]} />
      </View>

      <ThemedText style={styles.emptyHeadline}>Your feed is quiet</ThemedText>

      <ThemedText style={styles.emptyBody}>
        Add friends to see completed workouts, milestones, and weekly progress show up here.
      </ThemedText>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.primaryEmptyButton}
        onPress={onFindFriends}
      >
        <ThemedText style={styles.primaryEmptyButtonText}>Find Friends</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.secondaryEmptyButton}
        onPress={onLogWorkout}
      >
        <ThemedText style={styles.secondaryEmptyButtonText}>Log a Workout</ThemedText>
      </TouchableOpacity>

      <View style={styles.emptyPrivacyRow}>
        <FontAwesome5 name="lock" size={13} color={Colors.gray} />
        <ThemedText style={styles.emptyPrivacyText}>Friends-only activity. No noise.</ThemedText>
      </View>
    </View>
  );
}

export default function feed() {
  const router = useRouter();
  const { user } = useUserStore();

  const uid = user?.uid ?? "";

  const [feedFilter, setFeedFilter] = useState(FeedFilterOptions[0]);

  const {
    data,
    error,
    isLoading,
    isPending,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useUserFeedInfinite(uid);

  const feedItems = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  const renderFeedItem = (item: FeedItem) => {
    switch (item.type) {
      case "workout_completed":
        return <WorkoutCompleteFeedItem feedItem={item} />;

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image source={require("@/assets/images/full_logo.png")} style={styles.logo} />

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.iconContainer}
          onPress={() => router.push("/(protected)/(tabs)/(feed)/friendsList")}
        >
          <FontAwesome5 name="user-friends" size={14} color={Colors.gray} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={Colors.icon} />
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <ThemedText style={styles.errorText}>Error loading feed</ThemedText>
          </View>
        ) : (
          <FlatList
            data={feedItems}
            keyExtractor={(item) => item.feedItemId}
            renderItem={({ item }) => renderFeedItem(item)}
            contentContainerStyle={[
              styles.feedList,
              feedItems.length === 0 && styles.feedListEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyFeedState
                onFindFriends={() => router.push("/(protected)/(tabs)/(feed)/findFriends")}
                onLogWorkout={() => router.push("/(protected)/(tabs)/(workout)/log" as any)}
              />
            }
            refreshControl={
              <RefreshControl
                refreshing={isPending}
                onRefresh={refetch}
                colors={["#6B7280"]}
                tintColor="#6B7280"
              />
            }
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

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

  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  builtmodeText: {
    fontSize: 20,
    fontFamily: Typography.family.tertiary.regular,
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

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    color: Colors.icon,
    fontSize: 12,
  },

  feedList: {
    paddingVertical: 10,
    gap: 15,
  },

  feedListEmpty: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 70,
  },

  logo: {
    height: 20,
    width: 120,
    resizeMode: "contain",
  },

  emptyStateContainer: {
    alignItems: "center",
  },

  emptyIllustration: {
    width: 260,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },

  feedPreviewCard: {
    position: "absolute",
    width: 128,
    height: 106,
    borderRadius: 22,
    backgroundColor: "rgba(21, 24, 28, 0.58)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
  },

  feedPreviewCardLeft: {
    left: 12,
    top: 38,
    transform: [{ rotate: "-10deg" }],
  },

  feedPreviewCardRight: {
    right: 12,
    top: 48,
    transform: [{ rotate: "8deg" }],
  },

  previewAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.09)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  previewIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  previewCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  previewLine: {
    height: 4,
    width: "82%",
    borderRadius: 99,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 7,
  },

  previewLineShort: {
    width: "58%",
  },

  emptyCenterBadge: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#15181cdf",
    borderWidth: 1.5,
    borderColor: Colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.icon,
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  emptyDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.icon,
    opacity: 0.75,
  },

  emptyDotOne: {
    top: 32,
    left: 58,
  },

  emptyDotTwo: {
    right: 34,
    top: 72,
  },

  emptyDotThree: {
    left: 36,
    bottom: 48,
  },

  emptyHeadline: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: Typography.family.primary.bold,
    textAlign: "center",
    marginBottom: 12,
  },

  emptyBody: {
    color: Colors.icon,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 315,
    marginBottom: 34,
  },

  primaryEmptyButton: {
    width: "100%",
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  primaryEmptyButtonText: {
    color: Colors.background.primary,
    fontSize: 17,
    fontFamily: Typography.family.primary.bold,
  },

  secondaryEmptyButton: {
    width: "100%",
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  secondaryEmptyButtonText: {
    color: Colors.accent.primary,
    fontSize: 17,
    fontFamily: Typography.family.primary.semibold,
  },

  emptyPrivacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  emptyPrivacyText: {
    color: Colors.icon,
    fontSize: 14,
  },
});
