import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import type { FriendRequest } from "@builtmode/shared/types/social";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type RequestTab = "incoming" | "sent";

type Props = {
  visible: boolean;
  initialTab: RequestTab;
  incomingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  isLoading?: boolean;
  onClose: () => void;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onCancel: (requestId: string) => void;
};

const FriendRequestsSheet = ({
  visible,
  initialTab,
  incomingRequests,
  sentRequests,
  isLoading = false,
  onClose,
  onAccept,
  onDecline,
  onCancel,
}: Props) => {
  const [activeTab, setActiveTab] = useState<RequestTab>(initialTab);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  const activeRequests = useMemo(() => {
    return activeTab === "incoming" ? incomingRequests : sentRequests;
  }, [activeTab, incomingRequests, sentRequests]);

  const title = activeTab === "incoming" ? "Incoming Requests" : "Sent Requests";

  const subtitle =
    activeTab === "incoming"
      ? "Accept or decline people who want to join your circle."
      : "Track requests you have already sent.";

  const emptyText =
    activeTab === "incoming"
      ? "No incoming friend requests right now."
      : "No sent friend requests right now.";

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <ThemedText style={styles.title}>{title}</ThemedText>
              <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
            </View>

            <TouchableOpacity onPress={handleClose} style={styles.closeButton} hitSlop={10}>
              <ThemedText style={styles.closeText}>CLOSE</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "incoming" && styles.tabButtonActive]}
              onPress={() => setActiveTab("incoming")}
              activeOpacity={0.8}
            >
              <ThemedText
                style={[styles.tabText, activeTab === "incoming" && styles.tabTextActive]}
              >
                INCOMING
              </ThemedText>

              {incomingRequests.length > 0 ? (
                <View
                  style={[styles.countPill, activeTab === "incoming" && styles.countPillActive]}
                >
                  <ThemedText
                    style={[
                      styles.countPillText,
                      activeTab === "incoming" && styles.countPillTextActive,
                    ]}
                  >
                    {incomingRequests.length}
                  </ThemedText>
                </View>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === "sent" && styles.tabButtonActive]}
              onPress={() => setActiveTab("sent")}
              activeOpacity={0.8}
            >
              <ThemedText style={[styles.tabText, activeTab === "sent" && styles.tabTextActive]}>
                SENT
              </ThemedText>

              {sentRequests.length > 0 ? (
                <View style={[styles.countPill, activeTab === "sent" && styles.countPillActive]}>
                  <ThemedText
                    style={[
                      styles.countPillText,
                      activeTab === "sent" && styles.countPillTextActive,
                    ]}
                  >
                    {sentRequests.length}
                  </ThemedText>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator />
                <ThemedText style={styles.loadingText}>Loading requests...</ThemedText>
              </View>
            ) : activeRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyTitle}>No Requests</ThemedText>
                <ThemedText style={styles.emptyText}>{emptyText}</ThemedText>
              </View>
            ) : (
              activeRequests.map((request) => (
                <FriendRequestRow
                  key={request.requestId}
                  request={request}
                  type={activeTab}
                  onAccept={onAccept}
                  onDecline={onDecline}
                  onCancel={onCancel}
                />
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default FriendRequestsSheet;

type FriendRequestRowProps = {
  request: FriendRequest;
  type: RequestTab;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onCancel: (requestId: string) => void;
};

const FriendRequestRow = ({
  request,
  type,
  onAccept,
  onDecline,
  onCancel,
}: FriendRequestRowProps) => {
  const isIncoming = type === "incoming";

  const displayName = isIncoming ? request.fromDisplayName : request.toDisplayName;
  const username = isIncoming ? request.fromUsername : request.toUsername;
  const avatarUrl = isIncoming ? request.fromAvatarUrl : request.toAvatarUrl;
  const avatarInitial = displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <View style={styles.requestCard}>
      <View style={styles.avatar}>
        {avatarUrl ? (
          <Image src={avatarUrl} height={46} width={46} />
        ) : (
          <ThemedText style={styles.avatarText}>{avatarInitial}</ThemedText>
        )}
      </View>

      <View style={styles.requestInfo}>
        <ThemedText style={styles.requestName}>{displayName}</ThemedText>
        <ThemedText style={styles.requestUsername}>@{username}</ThemedText>
      </View>

      {isIncoming ? (
        <View style={styles.incomingActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => onAccept(request.requestId)}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.acceptButtonText}>ACCEPT</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => onDecline(request.requestId)}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.declineButtonText}>DECLINE</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => onCancel(request.requestId)}
          activeOpacity={0.85}
        >
          <ThemedText style={styles.cancelButtonText}>CANCEL</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    minHeight: "72%",
    maxHeight: "86%",
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 28,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
    gap: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: Typography.family.primary.bold,
    color: Colors.text.primary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.icon,
    fontFamily: Typography.family.primary.regular,
  },
  closeButton: {
    width: 54,
    alignItems: "flex-end",
  },
  closeText: {
    color: Colors.accent.primary,
    fontSize: Typography.size.xs,
    textAlign: "right",
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 1,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    padding: 5,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Border.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.accent.primary,
  },
  tabText: {
    color: Colors.icon,
    fontSize: 12,
    fontFamily: Typography.family.primary.bold,
    letterSpacing: 1.2,
  },
  tabTextActive: {
    color: Colors.background.primary,
  },
  countPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: Colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countPillActive: {
    backgroundColor: Colors.background.primary,
  },
  countPillText: {
    color: Colors.icon,
    fontSize: 11,
    fontFamily: Typography.family.primary.bold,
  },
  countPillTextActive: {
    color: Colors.accent.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  loadingContainer: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: Colors.icon,
    fontSize: 14,
    fontFamily: Typography.family.primary.regular,
  },
  emptyState: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  emptyTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontFamily: Typography.family.primary.bold,
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.icon,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: Typography.family.primary.regular,
  },
  requestCard: {
    minHeight: 86,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "rgba(211, 174, 75, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarText: {
    color: Colors.accent.primary,
    fontSize: 18,
    fontFamily: Typography.family.primary.bold,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    color: Colors.text.primary,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: Typography.family.primary.bold,
  },
  requestUsername: {
    color: Colors.icon,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Typography.family.secondary.regular,
  },
  incomingActions: {
    gap: 8,
  },
  acceptButton: {
    minWidth: 84,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  acceptButtonText: {
    color: Colors.background.primary,
    fontSize: 11,
    fontFamily: Typography.family.primary.bold,
    letterSpacing: 0.8,
  },
  declineButton: {
    minWidth: 84,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  declineButtonText: {
    color: Colors.icon,
    fontSize: 11,
    fontFamily: Typography.family.primary.bold,
    letterSpacing: 0.8,
  },
  cancelButton: {
    minWidth: 84,
    height: 38,
    borderRadius: 9,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: Colors.icon,
    fontSize: 11,
    fontFamily: Typography.family.primary.bold,
    letterSpacing: 0.8,
  },
});
