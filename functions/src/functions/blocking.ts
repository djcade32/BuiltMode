import { randomUUID } from "node:crypto";
import { blockUserRequestSchema } from "@builtmode/shared/schemas/social";
import { BlockUserResponse } from "@builtmode/shared/types/social";
import { Transaction, Timestamp } from "firebase-admin/firestore";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "../lib/firebaseAdmin.js";
import { assertAccountActive } from "../services/accountDeletionGuard.js";

export async function isBlockedBetween(tx: Transaction, uid: string, otherUid: string): Promise<boolean> {
  const own = await tx.get(db.doc(`users/${uid}/blockedUsers/${otherUid}`));
  const other = await tx.get(db.doc(`users/${otherUid}/blockedUsers/${uid}`));
  return own.exists || other.exists;
}

function validate(uid: string | undefined, input: unknown) {
  if (!uid) throw new HttpsError("unauthenticated", "Sign in to manage blocked users.");
  const parsed = blockUserRequestSchema.safeParse(input);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Choose a valid user.");
  if (uid === parsed.data.targetUid) throw new HttpsError("invalid-argument", "You cannot block yourself.");
  return { uid, targetUid: parsed.data.targetUid };
}

export async function handleBlockUser(callerUid: string | undefined, input: unknown): Promise<BlockUserResponse> {
  const { uid, targetUid } = validate(callerUid, input);
  await db.runTransaction(async (tx) => {
    await assertAccountActive(uid, tx);
    await assertAccountActive(targetUid, tx);
    const caller = await tx.get(db.doc(`users/${uid}`));
    const target = await tx.get(db.doc(`users/${targetUid}`));
    const blockRef = db.doc(`users/${uid}/blockedUsers/${targetUid}`);
    const existing = await tx.get(blockRef);
    if (!caller.exists || !target.exists) throw new HttpsError("not-found", "This account is unavailable.");
    if (existing.exists) return;
    const now = Timestamp.now();
    const generation = randomUUID();
    tx.create(blockRef, {
      uid: targetUid, username: target.get("username") ?? null,
      displayName: target.get("displayName") ?? null, createdAt: now, generation,
    });
    // This private queue uses the same manual review process as post reports.
    tx.create(db.doc(`contentReports/block_${generation}`), {
      type: "user_block", reporterUid: uid, reportedUid: targetUid,
      reporterUsername: caller.get("username") ?? null,
      reporterDisplayName: caller.get("displayName") ?? null,
      reportedUsername: target.get("username") ?? null,
      reportedDisplayName: target.get("displayName") ?? null,
      reason: "user_blocked", status: "pending", createdAt: now,
      reviewedAt: null, reviewNotes: null, resolution: null,
    });
    tx.delete(db.doc(`users/${uid}/friends/${targetUid}`));
    tx.delete(db.doc(`users/${targetUid}/friends/${uid}`));
    tx.delete(db.doc(`friendRequests/${uid}_${targetUid}`));
    tx.delete(db.doc(`friendRequests/${targetUid}_${uid}`));
  });
  return { status: "blocked" };
}

// Bound each transaction and recheck the block generation. A delayed trigger
// from an earlier block must never delete posts after an unblock/reconnect.
export async function removeBlockedFeedItems(uid: string, targetUid: string, generation: string) {
  const blockRef = db.doc(`users/${uid}/blockedUsers/${targetUid}`);
  for (const [viewer, author] of [[uid, targetUid], [targetUid, uid]]) {
    let more = true;
    while (more) {
      more = await db.runTransaction(async (tx) => {
        const block = await tx.get(blockRef);
        if (!block.exists || block.get("generation") !== generation) return false;
        const posts = await tx.get(db.collection(`userFeeds/${viewer}/items`).where("actorUid", "==", author).limit(200));
        posts.docs.forEach((post) => tx.delete(post.ref));
        return posts.size === 200;
      });
    }
  }
}

export async function handleUnblockUser(callerUid: string | undefined, input: unknown): Promise<BlockUserResponse> {
  const { uid, targetUid } = validate(callerUid, input);
  await assertAccountActive(uid);
  const ref = db.doc(`users/${uid}/blockedUsers/${targetUid}`);
  const block = await ref.get();
  if (!block.exists) return { status: "unblocked" };
  const generation = block.get("generation");
  // Finish removal before lifting the block, even if its trigger has not run.
  await removeBlockedFeedItems(uid, targetUid, generation);
  await db.runTransaction(async (tx) => {
    await assertAccountActive(uid, tx);
    const current = await tx.get(ref);
    if (current.exists && current.get("generation") !== generation) {
      throw new HttpsError("aborted", "The block changed. Please try again.");
    }
    if (current.exists) tx.delete(ref);
  });
  return { status: "unblocked" };
}

export const blockUser = onCall((request) => handleBlockUser(request.auth?.uid, request.data));
export const unblockUser = onCall((request) => handleUnblockUser(request.auth?.uid, request.data));
export const cleanUpBlockedUserFeed = onDocumentCreated({
  document: "users/{uid}/blockedUsers/{targetUid}", retry: true,
}, async (event) => {
  if (!event.data) return;
  await removeBlockedFeedItems(event.params.uid, event.params.targetUid, event.data.get("generation"));
});
