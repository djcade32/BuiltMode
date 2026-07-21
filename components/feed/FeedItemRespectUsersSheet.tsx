import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { useGetFeedItemRespectUsersInfinite } from "@/hooks/social/useGetFeedItemRespectUsersInfinite";
import { PublicProfile } from "@/packages/shared/src";
import { getPublicProfile } from "@/services/user-service";
import { FontAwesome6 } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import Avatar from "../ui/Avatar";

type Props = {
  visible: boolean;
  feedItemId: string;
  onClose: () => void;
};

const FeedItemRespectUsersSheet = ({ visible, feedItemId, onClose }: Props) => {
  const [respectUsers, setIsRespectUsers] = useState<PublicProfile[]>([]);

  const { data, error, isLoading, refetch, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } =
    useGetFeedItemRespectUsersInfinite(feedItemId);

  useEffect(() => {
    const users = data?.pages.flatMap((page) => page.items) ?? [];

    const fetchUserProfiles = async () => {
      const userProfiles = [];
      for (const user of users) {
        const profile = await getPublicProfile(user.actorUid);
        if (profile) userProfiles.push(profile);
      }

      setIsRespectUsers(userProfiles);
    };

    fetchUserProfiles();
  }, [data]);

  const renderUser = ({ item }: { item: PublicProfile }) => {
    return (
      <View style={styles.userRow}>
        <Avatar uid={item.uid} avatarUrl={item.avatarUrl ?? null} displayName={item.displayName} size={44} />

        <View style={styles.userInfo}>
          <ThemedText style={styles.displayName} numberOfLines={1}>
            {item.displayName}
          </ThemedText>
          <ThemedText style={styles.username} numberOfLines={1}>
            @{item.username.toLowerCase()}
          </ThemedText>
        </View>

        <View style={styles.respectIconContainer}>
          <FontAwesome6 name="hand-fist" size={14} color={Colors.accent.primary} />
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerSide} />

            <View style={styles.headerTitleContainer}>
              <ThemedText style={styles.headerTitle}>RESPECT</ThemedText>
              {!isLoading && !error ? (
                <View style={styles.countBadge}>
                  <ThemedText style={styles.countText}>{respectUsers.length}</ThemedText>
                </View>
              ) : null}
            </View>

            <TouchableOpacity style={styles.headerSide} onPress={onClose} hitSlop={12}>
              <ThemedText style={styles.closeText}>CLOSE</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.privacyNote}>
            <FontAwesome6 name="lock" size={10} color={Colors.icon} />
            <ThemedText style={styles.privacyNoteText}>Only you can see who respected your post</ThemedText>
          </View>

          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={Colors.accent.primary} />
              <ThemedText style={styles.stateText}>Loading respect...</ThemedText>
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <View style={styles.stateIconContainer}>
                <FontAwesome6 name="triangle-exclamation" size={18} color={Colors.error} />
              </View>
              <ThemedText style={styles.stateTitle}>Unable to load respect</ThemedText>
              <ThemedText style={styles.stateText}>Check your connection and try again.</ThemedText>
              <TouchableOpacity style={styles.retryButton} onPress={() => void refetch()} disabled={isFetching}>
                {isFetching ? (
                  <ActivityIndicator size="small" color={Colors.background.primary} />
                ) : (
                  <ThemedText style={styles.retryButtonText}>TRY AGAIN</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={respectUsers}
              keyExtractor={(item) => item.uid}
              renderItem={renderUser}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.listContent, respectUsers.length === 0 && styles.emptyListContent]}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.centerState}>
                  <View style={styles.stateIconContainer}>
                    <FontAwesome6 name="hand-fist" size={18} color={Colors.icon} />
                  </View>
                  <ThemedText style={styles.stateTitle}>No respect yet</ThemedText>
                  <ThemedText style={styles.stateText}>People who respect this post will appear here.</ThemedText>
                </View>
              }
              onEndReachedThreshold={0.5}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default FeedItemRespectUsersSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    height: "62%",
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: Colors.inputBorder,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.inputBorder,
    alignSelf: "center",
    marginBottom: 18,
  },
  header: {
    minHeight: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerSide: {
    width: 54,
    alignItems: "flex-end",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  headerTitle: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 14,
    letterSpacing: 0.8,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: "#C6A34A1F",
    borderWidth: 1,
    borderColor: "#C6A34A3D",
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    color: Colors.accent.primary,
    fontFamily: Typography.family.secondary.bold,
    fontSize: 10,
  },
  closeText: {
    color: Colors.accent.primary,
    fontSize: Typography.size.xs,
    textAlign: "right",
  },
  privacyNote: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  privacyNoteText: {
    color: Colors.icon,
    fontFamily: Typography.family.primary.regular,
    fontSize: 10,
  },
  listContent: {
    paddingBottom: 28,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  userRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  displayName: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 14,
  },
  username: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 11,
    color: Colors.icon,
  },
  respectIconContainer: {
    width: 34,
    height: 34,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: "#C6A34A38",
    backgroundColor: "#C6A34A12",
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: 1,
    backgroundColor: Colors.cardBorder,
  },
  centerState: {
    flex: 1,
    minHeight: 210,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  stateIconContainer: {
    width: 46,
    height: 46,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  stateTitle: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 14,
    marginBottom: 5,
    textAlign: "center",
  },
  stateText: {
    fontFamily: Typography.family.primary.regular,
    fontSize: 11,
    lineHeight: 17,
    color: Colors.icon,
    textAlign: "center",
  },
  retryButton: {
    minWidth: 112,
    minHeight: 38,
    marginTop: 16,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  retryButtonText: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 10,
    letterSpacing: 0.7,
    color: Colors.background.primary,
  },
});
