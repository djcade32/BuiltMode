import { Timestamp, Transaction } from "firebase-admin/firestore";
import { db } from "../lib/firebaseAdmin.js";
import { UserDoc, UsernameIndexDoc } from "../types/user.js";

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
