import { getAuth } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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
import { router } from "expo-router";
import Toast from "react-native-toast-message";

export async function registerPushToken(): Promise<void> {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  if (!uid) {
    return;
  }

  try {
    const app = getApp();
    const messaging = getMessaging(app);
    const authStatus = await requestPermission(messaging);

    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log("Push notification permission not granted.");
      return;
    }

    if (Platform.OS === "ios") {
      const isRegisteredBefore = isDeviceRegisteredForRemoteMessages(messaging);

      if (!isRegisteredBefore) {
        await registerDeviceForRemoteMessages(messaging);
      }

      const isRegisteredAfter = isDeviceRegisteredForRemoteMessages(messaging);

      if (!isRegisteredAfter) {
        console.warn(
          "Device is still not registered for remote messages after registration attempt.",
        );
        return;
      }
    }

    const token = await getToken(messaging);

    if (!token) {
      console.log("No FCM token returned.");
      return;
    }

    const tokenId = createTokenId(token);

    await setDoc(
      doc(db, "users", uid, "pushTokens", tokenId),
      {
        uid,
        token,
        platform: Platform.OS,
        enabled: true,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.warn("Failed to register push token:", error);
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
    const screen = remoteMessage.data?.screen;

    if (screen === "friendsList") {
      router.push("/(protected)/(tabs)/(feed)/friendsList");
    }

    if (screen === "home") {
      router.push("/(protected)/(tabs)");
    }
  });
}

export async function handleInitialNotification(): Promise<void> {
  const app = getApp();
  const messaging = getMessaging(app);

  const remoteMessage = await getInitialNotification(messaging);

  if (!remoteMessage) return;

  const screen = remoteMessage.data?.screen;

  if (screen === "friendsList") {
    router.push("/(protected)/(tabs)/(feed)/friendsList");
  }

  if (screen === "home") {
    router.push("/(protected)/(tabs)");
  }
}

export function subscribeToForegroundNotifications(): () => void {
  const app = getApp();
  const messaging = getMessaging(app);

  return onMessage(messaging, async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    const title = remoteMessage.notification?.title ?? "BuiltMode";
    const body = remoteMessage.notification?.body ?? "";
    const type = remoteMessage.data?.type;
    const screen = remoteMessage.data?.screen;

    Toast.show({
      type: "in_app",
      text1: title,
      text2: body,
      visibilityTime: 4000,
      props: {
        action: () => {
          Toast.hide();

          if (type === "friend_request" || screen === "friend_request") {
            router.push("/(protected)/(tabs)/(feed)/friendsList");
            return;
          }

          if (type === "official_week_started" || screen === "home") {
            router.push("/(protected)/(tabs)");
            return;
          }
        },
        actionText: "View",
      },
    });
  });
}

function createTokenId(token: string): string {
  return token.replace(/[.#$/[\]]/g, "_");
}
