import { FeedItem, Friend, FriendRequest } from "@builtmode/shared/types/social";
import { FieldValue, Transaction, WriteBatch } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";
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

export const updateFriendRequest = (tx: Transaction, friendRequestDoc: FriendRequest) => {
  const ref = db.collection("friendRequests").doc(friendRequestDoc.requestId);
  tx.update(ref, friendRequestDoc);
};

export const addFriendToUserList = (tx: Transaction, uid: string, friendDoc: Friend) => {
  const ref = db.collection(`users/${uid}/friends`).doc(friendDoc.uid);
  tx.set(ref, friendDoc);
};

export const removeFriend = async (tx: Transaction, uid: string, friendUid: string) => {
  const doc = db.collection(`users/${uid}/friends`).doc(friendUid);
  tx.delete(doc);
};

export const removeFriendRequest = async (tx: Transaction, requestId: string) => {
  const doc = db.collection("friendRequests").doc(requestId);
  tx.delete(doc);
};

export const createFeedItem = (tx: Transaction, feedItem: FeedItem) => {
  const ref = db.doc(`feedItems/${feedItem.feedItemId}`);
  tx.set(ref, feedItem);
};

export const addFeedItemToUserFeed = (batch: WriteBatch, viewerUid: string, feedItem: FeedItem) => {
  const ref = db.doc(`userFeeds/${viewerUid}/items/${feedItem.feedItemId}`);
  batch.set(ref, feedItem);
};

export const getFeedItem = async (tx: Transaction, feedItemId: string) => {
  const docRef = db.collection("feedItems").doc(feedItemId);
  return (await tx.get(docRef)).data();
};

export const userHasRespectedFeedItem = async (tx: Transaction, uid: string, feedItemId: string) => {
  const docRef = db.collection(`feedItems/${feedItemId}/respects`).doc(uid);
  return (await tx.get(docRef)).exists;
};

export const addRespectToFeedItem = async (tx: Transaction, uid: string, feedItemId: string) => {
  const respectRef = db.collection(`feedItems/${feedItemId}/respects`).doc(uid);
  const feedItemRef = db.collection("feedItems").doc(feedItemId);
  const feedItem = (await tx.get(feedItemRef)).data();

  if (!feedItem) throw new HttpsError("not-found", "Feed item does not exist to add respect to.");

  tx.update(feedItemRef, {
    updatedAt: FieldValue.serverTimestamp(),
    respectCount: (feedItem.respectCount ?? 0) + 1,
  });
  return tx.set(respectRef, {
    createdAt: FieldValue.serverTimestamp(),
    actorUid: uid,
  });
};

export const removeRespectToFeedItem = async (tx: Transaction, uid: string, feedItemId: string) => {
  const docRef = db.collection(`feedItems/${feedItemId}/respects`).doc(uid);
  const feedItemRef = db.collection("feedItems").doc(feedItemId);
  const feedItem = (await tx.get(feedItemRef)).data();

  if (!feedItem) throw new HttpsError("not-found", "Feed item does not exist to remove respect from.");

  tx.update(feedItemRef, {
    updatedAt: FieldValue.serverTimestamp(),
    respectCount: feedItem.respectCount ? feedItem.respectCount - 1 : 0,
  });
  return tx.delete(docRef);
};
