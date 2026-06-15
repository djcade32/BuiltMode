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
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
    mutationFn: async ({
      requestId,
      action,
    }: {
      requestId: string;
      action: "accepted" | "declined";
    }) => {
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

  const { mutate: removeFriendFunc } = useMutation({
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
    // Needed to prevent total from recalculating
    submittedSearch === "" && setTotalFriends(friends?.total ?? 0);
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.primary }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconContainer} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={14} color={Colors.gray} />
          </TouchableOpacity>

          <View style={{ justifyContent: "center", alignItems: "center", gap: 2 }}>
            <ThemedText style={styles.headerText}>FRIENDS</ThemedText>
            <ThemedText style={styles.headerSubtitle}>YOUR TRAINING CIRCLE</ThemedText>
          </View>

          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => {
              clearSearch();
              router.push("/(protected)/(tabs)/(feed)/findFriends");
            }}
          >
            <FontAwesome6 name="user-plus" size={14} color={Colors.gray} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingVertical: 16, gap: 24, flexGrow: 1 }}>
          {/* REQUESTS */}
          <View style={{ paddingHorizontal: 24 }}>
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

          <View style={{ flex: 1 }}>
            {isLoadingFriends ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator />
              </View>
            ) : friendsError ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
                    isPending={removeFriendUid === item.uid}
                  />
                )}
                ListEmptyComponent={
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ThemedText style={styles.searchEmptyStateText}>
                      {isSearching ? "No friend found with that username." : "No friends yet."}
                    </ThemedText>
                  </View>
                }
                contentContainerStyle={{
                  paddingTop: 16,
                  paddingHorizontal: 24,
                  gap: 16,
                }}
                ListHeaderComponent={() => (
                  <View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
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
                        containerStyle={{
                          borderColor: Colors.inputBorder,
                          flex: 1,
                        }}
                        preIcon={{
                          familyIcon: MaterialIcons,
                          name: "alternate-email",
                        }}
                      />
                      <TouchableOpacity
                        style={[
                          styles.usernameSearchButton,
                          { opacity: !isValidUsername(searchQuery) ? 0.5 : 1 },
                        ]}
                        onPress={handleSearchForUserButtonPress}
                        disabled={!isValidUsername(searchQuery)}
                      >
                        <MaterialIcons name="search" size={24} color={Colors.background.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
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

  sectionTitle: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 14,
    letterSpacing: 0.35,
    marginBottom: 16,
    color: Colors.icon,
  },

  friendCount: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 12,
    letterSpacing: 0.35,
    marginBottom: 16,
    color: Colors.accent.primary,
  },

  usernameSearchButton: {
    backgroundColor: Colors.accent.primary,
    width: 48,
    height: 48,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },

  usernameSearchInputAndButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  searchEmptyStateText: {
    fontSize: 12,
    color: Colors.icon,
  },
});
