import { Query, Timestamp, DocumentReference, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";
import { CallableRequest, HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { auth, db } from "../lib/firebaseAdmin.js";

const PAGE_SIZE = 100;
const LEASE_MS = 10 * 60_000;
const TOKEN_EXPIRY_GRACE_MS = 70 * 60_000;

export function validateDeletionRequest(request: Pick<CallableRequest, "auth" | "data">): string {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in before deleting your account.");
  if (request.data?.confirmation !== "DELETE") {
    throw new HttpsError("invalid-argument", "Confirm account deletion by typing DELETE.");
  }
  const age = Date.now() / 1000 - Number(request.auth.token.auth_time);
  if (!Number.isFinite(age) || age < -60 || age > 5 * 60) {
    throw new HttpsError("failed-precondition", "Sign in again before deleting your account.");
  }
  // Never accept a caller-supplied UID or database/storage path.
  return request.auth.uid;
}

export const deleteBuiltModeAccount = onCall(
  { timeoutSeconds: 540, memory: "512MiB", region: "us-central1" },
  async (request) => {
    const uid = validateDeletionRequest(request);
    const jobRef = db.doc(`accountDeletions/${uid}`);
    await db.runTransaction(async (tx) => {
      const job = await tx.get(jobRef);
      if (!job.exists) {
        tx.create(jobRef, { requestedAt: Timestamp.now(), nextAttemptAt: Timestamp.now(), status: "pending" });
      }
    });
    const completed = await processAccountDeletion(uid);
    return { success: true, status: completed ? "completed" : "pending" };
  },
);

// A durable job lets cleanup resume even if the client disconnects or the
// callable times out. Completed jobs get one final sweep after old ID tokens expire.
export const retryAccountDeletions = onSchedule(
  { schedule: "every 15 minutes", timeZone: "UTC", timeoutSeconds: 540, memory: "512MiB", region: "us-central1", retryCount: 3 },
  async () => {
    const jobs = await db.collection("accountDeletions")
      .where("nextAttemptAt", "<=", Timestamp.now()).orderBy("nextAttemptAt").limit(20).get();
    for (const job of jobs.docs) await processAccountDeletion(job.id);
  },
);

export async function processAccountDeletion(uid: string): Promise<boolean> {
  const jobRef = db.doc(`accountDeletions/${uid}`);
  const job = await db.runTransaction(async (tx) => {
    const snap = await tx.get(jobRef);
    if (!snap.exists) return null;
    const data = snap.data()!;
    if (data.leaseUntil?.toMillis() > Date.now()) return null;
    if (data.status === "completed" && data.nextAttemptAt.toMillis() > Date.now()) return null;
    tx.update(jobRef, { leaseUntil: Timestamp.fromMillis(Date.now() + LEASE_MS) });
    return data;
  });
  if (!job) return (await jobRef.get()).get("status") === "completed";

  try {
    try {
      await auth.updateUser(uid, { disabled: true });
      await auth.revokeRefreshTokens(uid);
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
    }
    await deleteAccountData(uid);
    try {
      await auth.deleteUser(uid);
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
    }
    if (job.status === "completed") {
      await db.recursiveDelete(jobRef);
    } else {
      await jobRef.update({
        status: "completed", completedAt: Timestamp.now(), leaseUntil: null,
        nextAttemptAt: Timestamp.fromMillis(Date.now() + TOKEN_EXPIRY_GRACE_MS),
      });
    }
    logger.info("Account deletion completed", { uid });
    return true;
  } catch (error) {
    logger.error("Account deletion will retry", { uid, error });
    await jobRef.update({ leaseUntil: null, nextAttemptAt: Timestamp.fromMillis(Date.now() + 60_000) });
    return false;
  }
}

async function deleteMatching(query: Query, remove = (ref: DocumentReference) => db.recursiveDelete(ref)) {
  let lastDoc: QueryDocumentSnapshot | undefined;
  while (true) {
    const page = await (lastDoc ? query.startAfter(lastDoc) : query).limit(PAGE_SIZE).get();
    if (page.empty) return;
    for (const doc of page.docs) await remove(doc.ref);
    lastDoc = page.docs[page.docs.length - 1];
  }
}

export async function deleteAccountData(uid: string): Promise<void> {
  // Remove respects transactionally so retries cannot decrement a count twice.
  await deleteMatching(db.collectionGroup("respects").where("actorUid", "==", uid), async (ref) => {
    await db.runTransaction(async (tx) => {
      const respect = await tx.get(ref);
      const postRef = ref.parent.parent!;
      const post = await tx.get(postRef);
      if (!respect.exists) return;
      if (post.exists) tx.update(postRef, { respectCount: Math.max(0, (post.get("respectCount") ?? 0) - 1) });
      tx.delete(ref);
    });
  });

  await deleteMatching(db.collectionGroup("friends").where("uid", "==", uid));
  for (const field of ["fromUid", "toUid"]) {
    await deleteMatching(db.collection("friendRequests").where(field, "==", uid));
  }
  await deleteMatching(db.collectionGroup("items").where("actorUid", "==", uid));
  await deleteMatching(db.collection("feedItems").where("actorUid", "==", uid));
  for (const field of ["data.fromUid", "data.targetUid", "data.actorUid"]) {
    await deleteMatching(db.collectionGroup("notifications").where(field, "==", uid));
  }

  // days are queried directly: their userWeekDays parent may not exist.
  await deleteMatching(db.collectionGroup("days").where("uid", "==", uid));
  const bucket = getStorage().bucket();
  // Delete the exact photo before its owning workout. Retries retain the mapping
  // if Storage fails, and similar UID prefixes cannot delete another user's photo.
  await deleteMatching(db.collection("workouts").where("uid", "==", uid), async (ref) => {
    // Retain exact object IDs through the final sweep in case an upload that
    // started before deletion finishes after the first Storage cleanup.
    await db.doc(`accountDeletions/${uid}/storageFiles/${ref.id}`).set({ queued: true });
    await bucket.file(`workouts/${uid}_${ref.id}`).delete({ ignoreNotFound: true });
    await db.recursiveDelete(ref);
  });
  await deleteMatching(db.collection(`accountDeletions/${uid}/storageFiles`), async (ref) => {
    await bucket.file(`workouts/${uid}_${ref.id}`).delete({ ignoreNotFound: true });
  });
  for (const name of ["templates", "userMonthAggregates", "userWeekAggregates"]) {
    await deleteMatching(db.collection(name).where("uid", "==", uid));
  }
  // Device tokens can be transferred to another account during cleanup.
  for (const name of ["usernames", "pushTokens"]) {
    await deleteMatching(db.collection(name).where("uid", "==", uid), async (ref) => {
      await db.runTransaction(async (tx) => {
        const current = await tx.get(ref);
        if (current.get("uid") === uid) tx.delete(ref);
      });
    });
  }
  // Also remove any materialized userWeekDays parents, using the exact UID delimiter.
  await deleteMatching(db.collection("userWeekDays").orderBy("__name__")
    .startAt(`${uid}_`).endBefore(`${uid}_\uf8ff`), async (ref) => {
      if (ref.id.slice(0, -11) === uid && /^_\d{4}-\d{2}-\d{2}$/.test(ref.id.slice(-11))) {
        await db.recursiveDelete(ref);
      }
    });

  await bucket.file(`user-avatars/${uid}`).delete({ ignoreNotFound: true });

  for (const path of [`userFeeds/${uid}`, `userStats/${uid}`, `publicProfiles/${uid}`, `leaderboardEntries/${uid}`, `users/${uid}`]) {
    await db.recursiveDelete(db.doc(path));
  }
}
