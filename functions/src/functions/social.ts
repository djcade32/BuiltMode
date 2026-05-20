import { Friend, FriendRequest } from "@builtmode/shared/types/social";
import { Timestamp } from "firebase-admin/firestore";
import {
  addFriendToUserList,
  createFriendRequest,
  getFriendRequest,
  getUserFriend,
  updateFriendRequest,
} from "../firestore/social.js";
import { getUserByUid } from "../firestore/user.js";
import { db } from "../lib/firebaseAdmin.js";

export async function handleSendFriendRequest(fromUid: string, toUid: string): Promise<boolean> {
  if (fromUid === toUid) {
    console.error("Failed to send request to user. fromUid and toUid cannot be the same: ", toUid);
    return false;
  }

  return await db.runTransaction(async (tx) => {
    const requestId = `${fromUid}_${toUid}`;
    const friendRequest = await getFriendRequest(tx, requestId);

    if (friendRequest) {
      console.error("Failed to send request to user. Request already exist: ", requestId);
      return false;
    }

    const checkIfFriendAlready = await getUserFriend(tx, fromUid, toUid);

    if (checkIfFriendAlready) {
      console.error("Failed to send request to user. Already friend: ", toUid);
      return false;
    }

    const toUserDoc = await getUserByUid(tx, toUid);
    const fromUserDoc = await getUserByUid(tx, fromUid);

    if (toUserDoc.exists) {
      if (!fromUserDoc.exists) {
        console.error("Failed to send request to user. Doesn't exist: ", fromUid);
        return false;
      }
      const toUser = toUserDoc.data();
      const fromUser = fromUserDoc.data();

      const now = Timestamp.now();

      const doc: FriendRequest = {
        requestId,
        fromUid,
        toUid,

        fromUsername: fromUser?.username,
        fromDisplayName: fromUser?.displayName,
        fromAvatarUrl: fromUser?.avatarUrl,

        toUsername: toUser?.username,
        toDisplayName: toUser?.displayName,
        toAvatarUrl: toUser?.avatarUrl,

        status: "pending",

        createdAt: now,
        updatedAt: now,
        respondedAt: null,
      };
      createFriendRequest(tx, doc);
      return true;
    }
    console.error("Failed to send request to user. Doesn't exist:", toUid);
    return false;
  });
}

export async function handleRespondToFriendRequest(
  uid: string,
  requestId: string,
  action: "accepted" | "declined",
): Promise<boolean> {
  return await db.runTransaction(async (tx) => {
    const friendRequest = await getFriendRequest(tx, requestId);

    if (!friendRequest) {
      console.error("Failed to respond to friend request. Request doesn't exist: ", requestId);
      return false;
    }
    if (friendRequest.toUid !== uid) {
      console.error("Failed to respond to friend request. Denied access: ", requestId);
      return false;
    }
    const now = Timestamp.now();

    const friendRequestDoc: FriendRequest = {
      ...(friendRequest as FriendRequest),
      status: action,
      updatedAt: now,
      respondedAt: now,
    };

    const responderFriendDoc: Friend = {
      uid: friendRequest.fromUid,
      createdAt: now,
      updatedAt: now,
    };

    const requesteeFriendDoc: Friend = {
      uid,
      createdAt: now,
      updatedAt: now,
    };

    updateFriendRequest(tx, friendRequestDoc);
    if (action === "accepted") {
      addFriendToUserList(tx, uid, responderFriendDoc);
      addFriendToUserList(tx, friendRequest.fromUid, requesteeFriendDoc);
    }
    return true;
  });
}

export async function handleCancelFriendRequest(uid: string, requestId: string): Promise<boolean> {
  return await db.runTransaction(async (tx) => {
    const friendRequest = await getFriendRequest(tx, requestId);

    if (!friendRequest) {
      console.error("Failed to cancel friend request. Request doesn't exist: ", requestId);
      return false;
    }
    if (friendRequest.fromUid !== uid) {
      console.error("Failed to cancel friend request. Denied access: ", requestId);
      return false;
    }
    if (friendRequest.status !== "pending") {
      console.error(
        "Failed to cancel friend request. Can only cancel pending requests: ",
        requestId,
      );
      return false;
    }

    const now = Timestamp.now();

    const friendRequestDoc: FriendRequest = {
      ...(friendRequest as FriendRequest),
      status: "cancelled",
      updatedAt: now,
    };

    updateFriendRequest(tx, friendRequestDoc);
    return true;
  });
}
