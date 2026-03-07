import { db } from "../lib/firebaseAdmin.js";
import { LeaderboardDoc, UserDoc } from "../types.js";

/**
  Write User to `user/{uid}` in Firestore
  @param {UserDoc} user User object to save in Firestore
*/
export const createUserDoc = (batch: FirebaseFirestore.WriteBatch, user: UserDoc) => {
  const { uid } = user;
  const userRef = db.collection("users").doc(uid);
  batch.create(userRef, { ...user });
};

/**
  Write User to `leaderboardEntries/{uid}` in Firestore
  @param {LeaderboardDoc} user LeaderboardDoc object to save in Firestore
*/
export const AddUserToLeaderboard = (batch: FirebaseFirestore.WriteBatch, user: LeaderboardDoc) => {
  const { uid } = user;
  const userRef = db.collection("leaderboardEntries").doc(uid);
  batch.create(userRef, { ...user });
};
