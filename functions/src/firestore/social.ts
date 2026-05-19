import { FriendRequest } from "@builtmode/shared/types/social";
import { Transaction } from "firebase-admin/firestore";
import { db } from "../lib/firebaseAdmin.js";

export const createFriendRequest = (tx: Transaction, friendRequestDoc: FriendRequest) => {
  const ref = db.collection("friendRequests").doc(friendRequestDoc.requestId);
  tx.set(ref, friendRequestDoc);
};

export const getFriendRequest = async (tx: Transaction, requestId: string) => {
  const docRef = db.collection("friendRequests").doc(requestId);
  return (await tx.get(docRef)).data();
};

export const getUserFriend = async (tx: Transaction, userUid: string, friendUid: string) => {
  const docRef = db.collection(`users/${userUid}/friends`).doc(friendUid);
  return (await tx.get(docRef)).data();
};
