import FriendCard from "@/components/feed/findFriends/FriendCard";
import FriendRequestsSheet from "@/components/feed/findFriends/FriendRequestsSheet";
import IncomingRequestsButton from "@/components/feed/findFriends/IncomingRequestsButton";
import SentRequestsButton from "@/components/feed/findFriends/SentRequestsButton";
import { ThemedText } from "@/components/themed-text";
import Input from "@/components/ui/Input";
import { Border, Colors, Typography } from "@/constants/theme";
import { useQuery } from "@/hooks/useQuery";
import {
  cancelFriendRequest,
  getIncomingFriendRequests,
  getSentFriendRequests,
  removeFriend,
  respondToFriendRequest,
  searchUserByUsername,
  sendFriendRequest,
} from "@/services/social-service";
import { useUserStore } from "@/stores/user-store";
import { FontAwesome5, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RequestTab = "incoming" | "sent";

const findFriends = () => {
  const router = useRouter();
  const { user } = useUserStore();

  const uid = user?.uid ?? "";

  const [searchQuery, setSearchQuery] = useState("");
  const [requestsSheetVisible, setRequestsSheetVisible] = useState(false);
  const [requestsSheetTab, setRequestsSheetTab] = useState<RequestTab>("incoming");

  const handleOpenRequestsSheet = (tab: RequestTab) => {
    setRequestsSheetTab(tab);
    setRequestsSheetVisible(true);
  };

  const {
    mutate: searchUserByUsernameFunc,
    isError,
    isPending,
    data,
  } = useMutation({
    mutationFn: async (username: string) => {
      const result = await searchUserByUsername(username);
      return result;
    },
    mutationKey: ["search-user-by-username"],
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
      searchQuery && searchUserByUsernameFunc(searchQuery);
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
      searchQuery && searchUserByUsernameFunc(searchQuery);
      refetchIncomingRequests();
    },
  });

  const { mutate: removeFriedFunc, isPending: isPendingRemove } = useMutation({
    mutationFn: async (friendUid: string) => {
      const result = await removeFriend(friendUid);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to remove friend.");
      }
      return result;
    },
    onSuccess: () => {
      searchQuery && searchUserByUsernameFunc(searchQuery);
    },
  });

  const {
    mutate: sendFriendRequestFunc,
    isSuccess,
    isPending: isPendingSent,
  } = useMutation({
    mutationFn: async (id: string) => {
      const result = await sendFriendRequest(id);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to send friend request.");
      }
    },
    onSuccess: () => {
      searchQuery && searchUserByUsernameFunc(searchQuery);
      refetchSentRequests();
    },
  });

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

  const handleSearchForUserButtonPress = () => {
    searchUserByUsernameFunc(searchQuery);
  };

  const isValidUsername = (username: string) => {
    const regex = new RegExp("^[a-zA-Z0-9_.]{3,20}$");
    return regex.test(username);
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
            <ThemedText style={styles.headerText}>FIND FRIENDS</ThemedText>
            <ThemedText style={styles.headerSubtitle}>BUILD YOUR TRAINING CIRCLE</ThemedText>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingVertical: 16, gap: 24 }}>
          {/* SEARCH BAR */}
          <View style={styles.cardContainer}>
            <ThemedText style={styles.usernameSearchTitle}>USERNAME SEARCH</ThemedText>
            <View style={styles.usernameSearchInputAndButton}>
              <Input
                selectTextOnFocus
                placeholder="Enter exact username"
                placeholderTextColor={Colors.icon}
                value={searchQuery}
                onChangeText={setSearchQuery}
                containerStyle={{
                  backgroundColor: Colors.input,
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingTop: 12 }}>
              <FontAwesome5 name="info-circle" size={12} color={Colors.accent.secondary} />
              <ThemedText style={styles.usernameSearchInfoText}>
                Search requires exact username match.{" "}
              </ThemedText>
            </View>
          </View>

          {/* SEARCH RESULTS */}
          <View style={styles.searchResults}>
            {isPending ? (
              <ActivityIndicator />
            ) : (
              <>
                {data === undefined ? (
                  <ThemedText style={styles.searchEmptyStateText}>
                    Find people you train with.
                  </ThemedText>
                ) : data === null && searchQuery ? (
                  <ThemedText style={styles.searchEmptyStateText}>User not found.</ThemedText>
                ) : (
                  data !== null && (
                    <FriendCard
                      data={data}
                      isPending={
                        isPendingCancel || isPendingSent || isPendingResponse || isPendingRemove
                      }
                      onAccept={(requestId) =>
                        respondToFriendRequestFunc({
                          requestId,
                          action: "accepted",
                        })
                      }
                      onDecline={(requestId) =>
                        respondToFriendRequestFunc({
                          requestId,
                          action: "declined",
                        })
                      }
                      onCancel={(requestId) => cancelFriendRequestFunc(requestId)}
                      onRemove={(uid) => removeFriedFunc(uid)}
                      onSend={(uid) => sendFriendRequestFunc(uid)}
                    />
                  )
                )}
              </>
            )}
          </View>

          {/* FRIEND REQUESTS */}
          <View>
            <ThemedText style={styles.friendRequestsTitle}>FRIEND REQUESTS</ThemedText>
            <IncomingRequestsButton
              onPress={() => handleOpenRequestsSheet("incoming")}
              count={incomingRequests?.length ?? 0}
            />
            <SentRequestsButton
              onPress={() => handleOpenRequestsSheet("sent")}
              count={sentRequests?.length ?? 0}
            />
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

export default findFriends;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    flex: 1,
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#15181c49",
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
    position: "absolute",
    left: 24,
    backgroundColor: Colors.background.secondary,
    width: 40,
    height: 40,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },

  cardContainer: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 6,
    elevation: 6,
  },
  usernameSearchTitle: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: Colors.gray,
  },
  usernameSearchInputAndButton: {
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.input,
  },
  usernameSearchButton: {
    backgroundColor: Colors.accent.primary,
    width: 48,
    height: 48,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  usernameSearchInfoText: {
    fontSize: 12,
    color: Colors.icon,
  },

  searchResults: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  searchEmptyStateText: {
    fontSize: 12,
    color: Colors.icon,
  },

  friendRequestsTitle: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 14,
    letterSpacing: 0.35,
    marginBottom: 16,
    color: Colors.icon,
  },

  friendRequestsIcon: {
    borderRadius: Border.radius.md,
    height: 40,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  friendRequestsCardTitle: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 14,
  },
  friendRequestsCardSubtitle: {
    fontSize: 12,
    color: Colors.icon,
    marginTop: 5,
  },
  friendRequestsCardNotification: {
    height: 24,
    width: 24,
    backgroundColor: Colors.accent.primary,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  friendRequestsCardNotificationText: {
    color: Colors.background.secondary,
    fontSize: 12,
    fontFamily: Typography.family.primary.bold,
  },
});
