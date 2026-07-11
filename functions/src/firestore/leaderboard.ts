import { Transaction } from "firebase-admin/firestore";
import { db } from "../lib/firebaseAdmin.js";
import { LeaderboardEntry } from "../types/leaderboard.js";

export const createInitialEntry = (tx: Transaction, entry: LeaderboardEntry) => {
  const ref = db.collection("leaderboardEntries").doc(entry.uid);
  tx.set(ref, entry);
};

export const updateLeaderboardEntry = (tx: Transaction, entry: Partial<LeaderboardEntry>) => {
  if (!entry.uid) return;

  const ref = db.collection("leaderboardEntries").doc(entry.uid);
  tx.set(ref, entry, { merge: true });
};
