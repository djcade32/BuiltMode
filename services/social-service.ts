import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

type SocialResult = {
  success: boolean;
  message?: string;
};

export const sendFriendRequest = async (toUid: string): Promise<SocialResult> => {
  const sendFriendRequestFunction = httpsCallable<{ id: string }, boolean>(
    functions,
    "sendFriendRequest",
  );

  if (!toUid.trim()) {
    return { success: false, message: "toUid is required." };
  }
  try {
    const response = await sendFriendRequestFunction({ id: toUid });
    return response.data
      ? { success: true }
      : { success: false, message: `Error sending friend request to ${toUid}.` };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof globalThis.Error ? err.message : `Error sending friend request to ${toUid}.`,
    };
  }
};

export const respondToFriendRequest = async (
  requestId: string,
  action: "accepted" | "declined",
): Promise<SocialResult> => {
  const respondToFriendRequestFunction = httpsCallable<
    { requestId: string; action: "accepted" | "declined" },
    boolean
  >(functions, "respondToFriendRequest");

  if (!requestId.trim()) {
    return { success: false, message: "requestId is required." };
  }

  try {
    const response = await respondToFriendRequestFunction({ requestId, action });
    return response.data
      ? { success: true }
      : { success: false, message: `Error responding to friend request: ${requestId}.` };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof globalThis.Error
          ? err.message
          : `Error responding to friend request: ${requestId}.`,
    };
  }
};
