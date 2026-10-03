import { Transaction } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/firebaseAdmin.js";

export async function isAccountDeleting(uid: string, tx?: Transaction): Promise<boolean> {
  const ref = db.doc(`accountDeletions/${uid}`);
  const deletion = tx ? await tx.get(ref) : await ref.get();
  return deletion.exists;
}

export async function assertAccountActive(uid: string, tx?: Transaction): Promise<void> {
  if (await isAccountDeleting(uid, tx)) {
    throw new HttpsError("failed-precondition", "This account is being deleted.");
  }
}
