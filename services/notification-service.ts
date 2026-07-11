import { getAuth } from "firebase/auth";
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { Platform } from "react-native";

import { db } from "@/lib/firebase";

import { getApp } from "@react-native-firebase/app";
import {
  AuthorizationStatus,
  FirebaseMessagingTypes,
  getInitialNotification,
  getMessaging,
  getToken,
  isDeviceRegisteredForRemoteMessages,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
} from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

type NotificationData = FirebaseMessagingTypes.RemoteMessage["data"];

export async function registerPushToken(): Promise<void> {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  if (!uid) {
    return;
  }

  try {
    const token = await getCurrentFcmToken();

    if (!token) {
      return;
    }

    const tokenId = createTokenId(token);

    const globalTokenRef = doc(db, "pushTokens", tokenId);
    const currentUserTokenRef = doc(db, "users", uid, "pushTokens", tokenId);

    const globalTokenSnap = await getDoc(globalTokenRef);
    const existingTokenOwnerUid = globalTokenSnap.exists() ? globalTokenSnap.data()?.uid : null;

    const batch = writeBatch(db);

    /**
     * Important:
     * A push token belongs to a device/app install, not a BuiltMode user.
     * If User A and User B use the same physical device, they can produce the same token.
     *
     * This cleanup makes the token active for only the latest logged-in user.
     */
    if (
      typeof existingTokenOwnerUid === "string" &&
      existingTokenOwnerUid.length > 0 &&
      existingTokenOwnerUid !== uid
    ) {
      const previousUserTokenRef = doc(db, "users", existingTokenOwnerUid, "pushTokens", tokenId);

      batch.delete(previousUserTokenRef);
    }

    batch.set(
      globalTokenRef,
      {
        uid,
        token,
        tokenId,
        platform: Platform.OS,
        enabled: true,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );

    batch.set(
      currentUserTokenRef,
      {
        uid,
        token,
        tokenId,
        platform: Platform.OS,
        enabled: true,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );

    await batch.commit();
  } catch (error) {
    console.warn("Failed to register push token:", error);
  }
}

/**
 * Call this during logout before signing the user out.
 *
 * This removes the current device token from the current user's active push tokens.
 * It also disables the global token assignment if the global registry still belongs
 * to the current uid.
 */
export async function unregisterPushToken(): Promise<void> {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  if (!uid) {
    return;
  }

  try {
    const app = getApp();
    const messaging = getMessaging(app);
    const token = await getToken(messaging);

    if (!token) {
      return;
    }

    const tokenId = createTokenId(token);

    const globalTokenRef = doc(db, "pushTokens", tokenId);
    const currentUserTokenRef = doc(db, "users", uid, "pushTokens", tokenId);

    const globalTokenSnap = await getDoc(globalTokenRef);
    const globalTokenOwnerUid = globalTokenSnap.exists() ? globalTokenSnap.data()?.uid : null;

    const batch = writeBatch(db);

    batch.delete(currentUserTokenRef);

    if (globalTokenOwnerUid === uid) {
      batch.set(
        globalTokenRef,
        {
          uid: null,
          lastUid: uid,
          token,
          tokenId,
          platform: Platform.OS,
          enabled: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    await batch.commit();
  } catch (error) {
    console.warn("Failed to unregister push token:", error);
  }
}

export function subscribeToPushTokenRefresh(): () => void {
  try {
    const app = getApp();
    const messaging = getMessaging(app);

    return onTokenRefresh(messaging, async () => {
      await registerPushToken();
    });
  } catch (error) {
    console.warn("Unable to subscribe to push token refresh:", error);
    return () => {};
  }
}

export function subscribeToNotificationOpens(): () => void {
  const app = getApp();
  const messaging = getMessaging(app);

  return onNotificationOpenedApp(messaging, (remoteMessage) => {
    if (!isNotificationForCurrentUser(remoteMessage.data)) {
      return;
    }

    handleNotificationNavigation(remoteMessage.data);
  });
}

export async function handleInitialNotification(): Promise<void> {
  const app = getApp();
  const messaging = getMessaging(app);

  const remoteMessage = await getInitialNotification(messaging);

  if (!remoteMessage) return;

  if (!isNotificationForCurrentUser(remoteMessage.data)) {
    return;
  }

  handleNotificationNavigation(remoteMessage.data);
}

export function subscribeToForegroundNotifications(): () => void {
  const app = getApp();
  const messaging = getMessaging(app);

  return onMessage(messaging, async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    if (!isNotificationForCurrentUser(remoteMessage.data)) {
      return;
    }

    const title = remoteMessage.notification?.title ?? "BuiltMode";
    const body = remoteMessage.notification?.body ?? "";

    Toast.show({
      type: "in_app",
      text1: title,
      text2: body,
      visibilityTime: 4000,
      props: {
        action: () => {
          Toast.hide();
          handleNotificationNavigation(remoteMessage.data);
        },
        actionText: "View",
      },
    });
  });
}

export async function scheduleDurationTimerExpiredNotification(input: { secondsUntilExpiration: number }) {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Round complete",
      body: "Great work!",
      sound: Platform.OS === "ios" ? "double_bell.mp3" : "double_bell.mp3",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, input.secondsUntilExpiration),
      channelId: "workout-timers",
    },
  });

  return notificationId;
}

export async function cancelDurationTimerNotification(notificationId?: string | null) {
  if (!notificationId) return;

  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
// HELPERS

async function getCurrentFcmToken(): Promise<string | null> {
  const app = getApp();
  const messaging = getMessaging(app);
  const authStatus = await requestPermission(messaging);

  const enabled = authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log("Push notification permission not granted.");
    return null;
  }

  if (Platform.OS === "ios") {
    const isRegisteredBefore = isDeviceRegisteredForRemoteMessages(messaging);

    if (!isRegisteredBefore) {
      await registerDeviceForRemoteMessages(messaging);
    }

    const isRegisteredAfter = isDeviceRegisteredForRemoteMessages(messaging);

    if (!isRegisteredAfter) {
      console.warn("Device is still not registered for remote messages after registration attempt.");
      return null;
    }
  }

  const token = await getToken(messaging);

  if (!token) {
    console.log("No FCM token returned.");
    return null;
  }

  return token;
}

function isNotificationForCurrentUser(data?: NotificationData): boolean {
  const auth = getAuth();
  const currentUid = auth.currentUser?.uid;

  if (!currentUid) {
    return false;
  }

  /**
   * Your Cloud Functions should include one of these fields in notification data.
   *
   * Recommended:
   * data: {
   *   targetUid: recipientUid,
   *   type: "friend_request",
   *   screen: "friendsList"
   * }
   */
  const targetUid = data?.targetUid ?? data?.recipientUid ?? data?.uid;

  /**
   * If no target uid exists, allow for backward compatibility.
   * Once all push payloads include targetUid, you can change this to false.
   */
  if (!targetUid) {
    return true;
  }

  return targetUid === currentUid;
}

function handleNotificationNavigation(data?: NotificationData): void {
  const type = data?.type;
  const screen = data?.screen;

  if (
    type === "friend_request" ||
    type === "friend_request_received" ||
    screen === "friend_request" ||
    screen === "friendsList"
  ) {
    router.push("/(protected)/(tabs)/(feed)/friendsList");
    return;
  }

  if (type === "official_week_started" || screen === "home") {
    router.push("/(protected)/(tabs)");
    return;
  }
}

function createTokenId(token: string): string {
  return token.replace(/[.#$/[\]]/g, "_");
}
