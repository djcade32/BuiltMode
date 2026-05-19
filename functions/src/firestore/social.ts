import { Friend, FriendRequest } from "@builtmode/shared/types/social";
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

export const respondToFriendRequest = (tx: Transaction, friendRequestDoc: FriendRequest) => {
  const ref = db.collection("friendRequests").doc(friendRequestDoc.requestId);
  tx.update(ref, friendRequestDoc);
};

export const addFriendToUserList = (tx: Transaction, uid: string, friendDoc: Friend) => {
  const ref = db.collection(`users/${uid}/friends`).doc(friendDoc.uid);
  tx.set(ref, friendDoc);
};
