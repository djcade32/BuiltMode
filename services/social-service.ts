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
