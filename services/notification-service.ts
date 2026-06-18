import { getAuth } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Platform } from "react-native";

import { db } from "@/lib/firebase";

import { getApp } from "@react-native-firebase/app";
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  isDeviceRegisteredForRemoteMessages,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
} from "@react-native-firebase/messaging";

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

    console.log("Push token registered.");
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

function createTokenId(token: string): string {
  return token.replace(/[.#$/[\]]/g, "_");
}
