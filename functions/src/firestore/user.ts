import { db } from "../lib/firebaseAdmin.js";
import { LeaderboardDoc, UserDoc } from "../types.js";

/**
  Write User to `user/{uid}` in Firestore
  @param {UserDoc} user User object to save in Firestore
*/
export const createUserDoc = (batch: FirebaseFirestore.WriteBatch, user: UserDoc) => {
  const { uid } = user;
  console.log("Attempting to create user: ", uid);
  try {
    const userRef = db.collection("users").doc(uid);
    batch.set(userRef, { ...user });

    console.log(`User ${uid} created `);
  } catch (error) {
    console.error("Error creating user: ", error);
  }
};

/**
  Write User to `leaderboardEntries/{uid}` in Firestore
  @param {LeaderboardDoc} user LeaderboardDoc object to save in Firestore
*/
export const AddUserToLeaderboard = (batch: FirebaseFirestore.WriteBatch, user: LeaderboardDoc) => {
  const { uid } = user;
  console.log("Attempting to write user to leaderboard: ", uid);
  try {
    const userRef = db.collection("leaderboardEntries").doc(uid);
    batch.set(userRef, { ...user });

    console.log(`User ${uid} added to leaderboard.`);
  } catch (error) {
    console.error("Error writing user to leaderboard: ", error);
  }
};
