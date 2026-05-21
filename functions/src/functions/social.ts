import { Friend, FriendRequest, SearchUserResult } from "@builtmode/shared/types/social";
import { Timestamp } from "firebase-admin/firestore";
import {
  addFriendToUserList,
  createFriendRequest,
  getFriendRequest,
  getUserFriend,
  removeFriend,
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
    const forwardRequestId = `${fromUid}_${toUid}`;
    const reverseRequestId = `${toUid}_${fromUid}`;

    const forwardRequest = await getFriendRequest(tx, forwardRequestId);
    const reverseRequest = await getFriendRequest(tx, reverseRequestId);

    if (forwardRequest || reverseRequest) {
      console.error("Failed to send request to user. Request already exists.");
      return false;
    }

    if (forwardRequest) {
      console.error("Failed to send request to user. Request already exist: ", forwardRequestId);
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
        requestId: forwardRequestId,
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
    if (friendRequest.status !== "pending") {
      console.error(
        "Failed to respond to friend request. Can only respond to pending requests: ",
        requestId,
      );
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

export async function handleSearchUserByUsername(
  requesterUid: string,
  username: string,
): Promise<SearchUserResult | null> {
  const usernameLower = username.trim().toLowerCase();

  if (!usernameLower) {
    return null;
  }
  return await db.runTransaction(async (tx) => {
    const usernameSnap = await tx.get(db.doc(`usernames/${usernameLower}`));

    if (!usernameSnap.exists) {
      return null;
    }

    const usernameData = usernameSnap.data();
    if (!usernameData?.uid) {
      return null;
    }

    const foundUid = usernameData.uid;

    const userSnap = await getUserByUid(tx, foundUid);

    if (!userSnap.exists) {
      return null;
    }

    const foundUser = userSnap.data();

    let relationshipStatus: SearchUserResult["relationshipStatus"] = "none";
    let requestId: string | undefined;

    if (foundUid === requesterUid) {
      relationshipStatus = "self";
    } else {
      const friendDoc = await getUserFriend(tx, requesterUid, foundUid);

      if (friendDoc) {
        relationshipStatus = "friends";
      } else {
        const sentRequestId = `${requesterUid}_${foundUid}`;
        const receivedRequestId = `${foundUid}_${requesterUid}`;

        const [sentRequest, receivedRequest] = await Promise.all([
          getFriendRequest(tx, sentRequestId),
          getFriendRequest(tx, receivedRequestId),
        ]);

        if (sentRequest?.status === "pending") {
          relationshipStatus = "request_sent";
          requestId = sentRequestId;
        } else if (receivedRequest?.status === "pending") {
          relationshipStatus = "request_received";
          requestId = receivedRequestId;
        }
      }
    }

    return {
      uid: foundUid,
      username: foundUser?.username,
      usernameLower: foundUser?.usernameLower,
      displayName: foundUser?.displayName,
      avatarUrl: foundUser?.avatarUrl,
      relationshipStatus,
      ...(requestId ? { requestId } : {}),
    };
  });
}

export async function handleRemoveFriend(uid: string, friendUid: string): Promise<boolean> {
  return await db.runTransaction(async (tx) => {
    removeFriend(tx, uid, friendUid);
    removeFriend(tx, friendUid, uid);
    return true;
  });
}
