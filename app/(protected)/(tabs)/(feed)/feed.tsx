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

export default function Feed() {
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
          style={styles.iconContainer}
          onPress={() => router.push("/(protected)/(tabs)/(feed)/friendsList")}
        >
          <FontAwesome5 name="user-friends" size={14} color={Colors.gray} />
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: 24, flex: 1 }}>
        {/* <View style={{ paddingHorizontal: 24, paddingTop: 16, flex: 1 }}> */}
        {/* <Switch
          options={FeedFilterOptions.map((option) => option.toLocaleUpperCase())}
          onChange={(value) => setFeedFilter(value)}
          defaultIndex={0}
          optionContainerStyle={{
            flex: 1,
            minWidth: 100,
            alignItems: "center",
          }}
        /> */}

        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={Colors.icon} />
          </View>
        ) : error ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ThemedText style={{ color: Colors.icon, fontSize: 12 }}>Error loading feed</ThemedText>
          </View>
        ) : (
          <FlatList
            data={feedItems}
            keyExtractor={(item) => item.feedItemId}
            renderItem={({ item }) => renderFeedItem(item)}
            contentContainerStyle={styles.feedList}
            showsVerticalScrollIndicator={false}
            // style={{ marginTop: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={isPending}
                onRefresh={refetch}
                colors={[Colors.icon]}
                tintColor={Colors.icon}
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

  feedList: {
    paddingVertical: 10,
    gap: 15,
  },
  logo: {
    height: 20,
    width: 120,
    objectFit: "contain",
  },
});
