import { FriendRequest } from "@builtmode/shared/types/social";
import { Timestamp } from "firebase-admin/firestore";
import { createFriendRequest, getFriendRequest, getUserFriend } from "../firestore/social.js";
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
