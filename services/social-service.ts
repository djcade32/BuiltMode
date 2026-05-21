import { functions } from "@/lib/firebase";
import { SearchUserResult } from "@builtmode/shared";
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

export const cancelFriendRequest = async (requestId: string): Promise<SocialResult> => {
  const cancelFriendRequestFunction = httpsCallable<{ requestId: string }, boolean>(
    functions,
    "cancelFriendRequest",
  );

  if (!requestId.trim()) {
    return { success: false, message: "requestId is required." };
  }

  try {
    const response = await cancelFriendRequestFunction({ requestId });
    return response.data
      ? { success: true }
      : { success: false, message: `Error canceling friend request: ${requestId}.` };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof globalThis.Error
          ? err.message
          : `Error canceling friend request: ${requestId}.`,
    };
  }
};

export const searchUserByUsername = async (username: string): Promise<SearchUserResult | null> => {
  const SearchUserByUsernameFunction = httpsCallable<{ username: string }, SearchUserResult | null>(
    functions,
    "searchUserByUsername",
  );

  if (!username.trim()) {
    console.error("username is required");
    return null;
  }

  try {
    const response = await SearchUserByUsernameFunction({ username });
    return response.data;
  } catch (err) {
    throw err instanceof globalThis.Error
      ? err
      : new Error(`Error searching for user by username: ${username}.`);
  }
};

export const removeFriend = async (friendUid: string): Promise<SocialResult> => {
  const removeFriendFunction = httpsCallable<{ friendUid: string }, boolean>(
    functions,
    "removeFriend",
  );

  if (!friendUid.trim()) {
    return { success: false, message: "friendUid is required." };
  }

  try {
    const response = await removeFriendFunction({ friendUid });
    return response.data
      ? { success: true }
      : { success: false, message: `Error removing friend: ${friendUid}.` };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof globalThis.Error ? err.message : `Error removing friend: ${friendUid}.`,
    };
  }
};
