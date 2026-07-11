import FriendRequestsSheet from "@/components/feed/friendsList/FriendRequestsSheet";
import FriendsListCard from "@/components/feed/friendsList/FriendsListCard";
import IncomingRequestsButton from "@/components/feed/friendsList/IncomingRequestsButton";
import SentRequestsButton from "@/components/feed/friendsList/SentRequestsButton";
import { ThemedText } from "@/components/themed-text";
import Input from "@/components/ui/Input";
import { Border, Colors, Typography } from "@/constants/theme";
import { useQuery } from "@/hooks/useQuery";
import {
  cancelFriendRequest,
  getIncomingFriendRequests,
  getSentFriendRequests,
  getUserFriends,
  removeFriend,
  respondToFriendRequest,
} from "@/services/social-service";
import { useUserStore } from "@/stores/user-store";
import { FontAwesome5, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RequestTab = "incoming" | "sent";

const FriendsEmptyState = ({ onFindFriends }: { onFindFriends: () => void }) => {
  return (
    <View style={styles.emptyCircleCard}>
      <View style={styles.emptyCircleIconWrap}>
        <View style={styles.emptyCircleDashedRing}>
          <FontAwesome5 name="user-friends" size={34} color={Colors.gray} />
        </View>
      </View>

      <ThemedText style={styles.emptyCircleTitle}>Your circle is empty</ThemedText>

      <ThemedText style={styles.emptyCircleBody}>
        Add friends to see their activity, stay accountable, and compete together.
      </ThemedText>

      <TouchableOpacity activeOpacity={0.85} style={styles.emptyFindFriendsButton} onPress={onFindFriends}>
        <FontAwesome6 name="user-plus" size={14} color={Colors.accent.primary} />
        <ThemedText style={styles.emptyFindFriendsText}>FIND FRIENDS</ThemedText>
      </TouchableOpacity>
    </View>
  );
};

const SearchEmptyState = () => {
  return (
    <View style={styles.searchEmptyStateContainer}>
      <ThemedText style={styles.searchEmptyStateTitle}>No match found</ThemedText>
      <ThemedText style={styles.searchEmptyStateText}>Try another exact username.</ThemedText>
    </View>
  );
};

const friendsList = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const uid = user?.uid ?? "";

  const [requestsSheetVisible, setRequestsSheetVisible] = useState(false);
  const [requestsSheetTab, setRequestsSheetTab] = useState<RequestTab>("incoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [totalFriends, setTotalFriends] = useState(0);
  const [removeFriendUid, setRemoveFriendUid] = useState<string | null>(null);

  const isSearching = submittedSearch.trim().length > 0;

  const navigateToFindFriends = () => {
    clearSearch();
    router.push("/(protected)/(tabs)/(feed)/findFriends");
  };

  const handleOpenRequestsSheet = (tab: RequestTab) => {
    setRequestsSheetTab(tab);
    setRequestsSheetVisible(true);
  };

  const {
    data: incomingRequests,
    isLoading: isLoadingIncomingRequests,
    refetch: refetchIncomingRequests,
  } = useQuery({
    queryKey: ["incoming-friend-requests", uid],
    queryFn: getIncomingFriendRequests,
    params: { uid },
    enabled: !!uid,
  });

  const {
    data: sentRequests,
    isLoading: isLoadingSentRequests,
    refetch: refetchSentRequests,
  } = useQuery({
    queryKey: ["sent-friend-requests", uid],
    queryFn: getSentFriendRequests,
    params: { uid },
    enabled: !!uid,
  });

  const {
    data: friends,
    isLoading: isLoadingFriends,
    error: friendsError,
    refetch: refetchFriends,
  } = useQuery({
    queryKey: ["user-friends", uid, submittedSearch],
    queryFn: getUserFriends,
    params: {
      uid,
      searchUsername: submittedSearch,
    },
    enabled: !!uid,
  });

  const { mutate: cancelFriendRequestFunc, isPending: isPendingCancel } = useMutation({
    mutationFn: async (requestId: string) => {
      const result = await cancelFriendRequest(requestId);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to cancel friend request.");
      }
      return result;
    },
    onSuccess: () => {
      refetchSentRequests();
    },
  });

  const { mutate: respondToFriendRequestFunc, isPending: isPendingResponse } = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: "accepted" | "declined" }) => {
      const result = await respondToFriendRequest(requestId, action);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to respond to friend request.");
      }
      return result;
    },
    onSuccess: () => {
      refetchIncomingRequests();
      refetchFriends();
    },
  });

  const { mutate: removeFriendFunc, isPending: isPendingRemoveFriend } = useMutation({
    mutationFn: async (friendUid: string) => {
      setRemoveFriendUid(friendUid);
      const result = await removeFriend(friendUid);
      if (!result.success) {
        setRemoveFriendUid(null);
        throw new Error(result.message ?? "Failed to remove friend.");
      }
      setRemoveFriendUid(null);
      return result;
    },
    onSuccess: () => {
      refetchFriends();
    },
  });

  useEffect(() => {
    clearSearch();
  }, []);

  useEffect(() => {
    if (submittedSearch === "") {
      setTotalFriends(friends?.total ?? 0);
    }
  }, [friends]);

  const isValidUsername = (username: string) => {
    const regex = new RegExp("^[a-zA-Z0-9_.]{3,20}$");
    return regex.test(username);
  };

  const handleSearchForUserButtonPress = () => {
    setSubmittedSearch(searchQuery);
  };

  const clearSearch = () => {
    setSubmittedSearch("");
    setSearchQuery("");
  };

  const listHeaderComponent = useMemo(() => {
    return (
      <View>
        <View style={styles.circleHeader}>
          <ThemedText style={styles.sectionTitle}>YOUR CIRCLE</ThemedText>

          <ThemedText style={styles.friendCount}>
            {totalFriends} {totalFriends === 1 ? "friend" : "friends"}
          </ThemedText>
        </View>

        <View style={styles.usernameSearchInputAndButton}>
          <Input
            selectTextOnFocus
            placeholder="Search exact username"
            placeholderTextColor={Colors.icon}
            value={searchQuery}
            onChangeText={(e) => {
              if (e === "" && submittedSearch !== "") {
                setSubmittedSearch("");
              }

              setSearchQuery(e);
            }}
            containerStyle={styles.searchInput}
            preIcon={{
              familyIcon: MaterialIcons,
              name: "alternate-email",
            }}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.usernameSearchButton, { opacity: !isValidUsername(searchQuery) ? 0.5 : 1 }]}
            onPress={handleSearchForUserButtonPress}
            disabled={!isValidUsername(searchQuery) && !!friends?.total}
          >
            <MaterialIcons name="search" size={24} color={Colors.background.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [totalFriends, searchQuery, submittedSearch]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.primary }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconContainer} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={14} color={Colors.gray} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerText}>FRIENDS</ThemedText>
            <ThemedText style={styles.headerSubtitle}>YOUR TRAINING CIRCLE</ThemedText>
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.iconContainer} onPress={navigateToFindFriends}>
            <FontAwesome6 name="user-plus" size={14} color={Colors.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* REQUESTS */}
          <View style={styles.requestsSection}>
            <ThemedText style={styles.sectionTitle}>FRIEND REQUESTS</ThemedText>

            <IncomingRequestsButton
              onPress={() => handleOpenRequestsSheet("incoming")}
              count={incomingRequests?.length ?? 0}
            />

            <SentRequestsButton
              onPress={() => handleOpenRequestsSheet("sent")}
              count={sentRequests?.length ?? 0}
            />
          </View>

          <View style={styles.circleSection}>
            {isLoadingFriends ? (
              <View style={styles.centerState}>
                <ActivityIndicator color={Colors.icon} />
              </View>
            ) : friendsError ? (
              <View style={styles.centerState}>
                <ThemedText style={styles.searchEmptyStateText}>Error loading friends.</ThemedText>
              </View>
            ) : (
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={friends?.friends ?? []}
                keyExtractor={(item) => item.uid}
                renderItem={({ item }) => (
                  <FriendsListCard
                    uid={item.uid}
                    avatarUrl={item.avatarUrl}
                    displayName={item.displayName}
                    username={item.usernameLower}
                    removeFriend={() => removeFriendFunc(item.uid)}
                    isPending={isPendingRemoveFriend}
                  />
                )}
                ListHeaderComponent={listHeaderComponent}
                ListEmptyComponent={
                  isSearching ? <SearchEmptyState /> : <FriendsEmptyState onFindFriends={navigateToFindFriends} />
                }
                contentContainerStyle={styles.friendsListContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>

        <FriendRequestsSheet
          visible={requestsSheetVisible}
          initialTab={requestsSheetTab}
          incomingRequests={incomingRequests ?? []}
          sentRequests={sentRequests ?? []}
          isLoading={isLoadingIncomingRequests || isLoadingSentRequests}
          isPendingAction={isPendingResponse || isPendingCancel}
          onClose={() => setRequestsSheetVisible(false)}
          onAccept={(requestId) => {
            respondToFriendRequestFunc({
              requestId,
              action: "accepted",
            });
          }}
          onDecline={(requestId) => {
            respondToFriendRequestFunc({
              requestId,
              action: "declined",
            });
          }}
          onCancel={(requestId) => {
            cancelFriendRequestFunc(requestId);
          }}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default friendsList;

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

  headerTitleContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },

  headerText: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.4,
    fontFamily: Typography.family.primary.semibold,
  },

  headerSubtitle: {
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    color: Colors.icon,
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

  content: {
    paddingVertical: 16,
    gap: 24,
    flexGrow: 1,
  },

  requestsSection: {
    paddingHorizontal: 24,
  },

  circleSection: {
    flex: 1,
  },

  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  sectionTitle: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 14,
    letterSpacing: 0.35,
    marginBottom: 16,
    color: Colors.icon,
  },

  circleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  friendCount: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 12,
    letterSpacing: 0.35,
    marginBottom: 16,
    color: Colors.accent.primary,
  },

  usernameSearchInputAndButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  searchInput: {
    borderColor: Colors.inputBorder,
    flex: 1,
  },

  usernameSearchButton: {
    backgroundColor: Colors.accent.primary,
    width: 48,
    height: 48,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },

  friendsListContent: {
    paddingTop: 16,
    paddingHorizontal: 24,
    gap: 16,
    paddingBottom: 32,
  },

  emptyCircleCard: {
    marginTop: 24,
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },

  emptyCircleIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  emptyCircleDashedRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255, 255, 255, 0.18)",
    backgroundColor: "rgba(255, 255, 255, 0.012)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCircleTitle: {
    color: "#FFFFFF",
    fontFamily: Typography.family.primary.bold,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 12,
  },

  emptyCircleBody: {
    color: Colors.gray,
    fontFamily: Typography.family.primary.medium,
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 290,
    marginBottom: 26,
  },

  emptyFindFriendsButton: {
    height: 48,
    width: "100%",
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.008)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  emptyFindFriendsText: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 13,
    letterSpacing: 1.7,
    color: Colors.accent.primary,
  },

  searchEmptyStateContainer: {
    marginTop: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  searchEmptyStateTitle: {
    color: "#FFFFFF",
    fontFamily: Typography.family.primary.semibold,
    fontSize: 14,
  },

  searchEmptyStateText: {
    fontSize: 12,
    color: Colors.icon,
    textAlign: "center",
  },
});
