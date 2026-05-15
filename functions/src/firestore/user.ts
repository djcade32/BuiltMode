import { UserMonthAggregate, UserStats } from "@builtmode/shared/types/user";
import { Timestamp, Transaction } from "firebase-admin/firestore";
import { db } from "../lib/firebaseAdmin.js";
import { UserDoc, UsernameIndexDoc } from "../types/user.js";
import { UserWeekAggregate } from "../types/workout.js";

export const getUserByUid = (tx: Transaction, uid: string) => {
  return tx.get(db.collection("users").doc(uid));
};

export const getUsernameIndex = (tx: Transaction, usernameLower: string) => {
  return tx.get(db.collection("usernames").doc(usernameLower));
};

export const createUser = (tx: Transaction, user: UserDoc) => {
  const ref = db.collection("users").doc(user.uid);
  tx.set(ref, user);
};

export const createUsernameIndex = (
  tx: Transaction,
  usernameLower: string,
  uid: string,
  createdAt: Timestamp,
) => {
  const ref = db.collection("usernames").doc(usernameLower);

  const doc: UsernameIndexDoc = {
    uid,
    createdAt,
  };

  tx.set(ref, doc);
};

export const createUserStats = (tx: Transaction, uid: string, userStatsDoc: UserStats) => {
  const ref = db.collection("userStats").doc(uid);

  tx.set(ref, userStatsDoc);
};

export const getUserStats = (tx: Transaction, uid: string) => {
  return tx.get(db.collection("userStats").doc(uid));
};

export const createUserWeekAggregate = (
  tx: Transaction,
  uid: string,
  weekId: string,
  weekAggregate: UserWeekAggregate,
) => {
  const ref = db.collection("userWeekAggregates").doc(`${uid}_${weekId}`);
  tx.set(ref, weekAggregate);
};

export const getUserWeekAggregate = (tx: Transaction, uid: string, weekId: string) => {
  return tx.get(db.collection("userWeekAggregates").doc(`${uid}_${weekId}`));
};

export const createUserMonthAggregates = (
  tx: Transaction,
  uid: string,
  currentMonthId: string,
  userMonthAggregateDoc: UserMonthAggregate,
) => {
  const ref = db.collection("userMonthAggregates").doc(`${uid}_${currentMonthId}`);

  tx.set(ref, userMonthAggregateDoc);
};

export const getUserMonthAggregate = (tx: Transaction, uid: string, monthId: string) => {
  return tx.get(db.collection("userMonthAggregates").doc(`${uid}_${monthId}`));
};
