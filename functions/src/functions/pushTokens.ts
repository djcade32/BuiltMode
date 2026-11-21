import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "../lib/firebaseAdmin.js";
import { assertAccountActive } from "../services/accountDeletionGuard.js";

function requireUid(uid: string | undefined): string {
  if (!uid) throw new HttpsError("unauthenticated", "User must be signed in.");
  return uid;
}

function parseToken(data: unknown): { token: string; tokenId: string; platform?: string } {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpsError("invalid-argument", "A push token is required.");
  }
  const { token, platform } = data as Record<string, unknown>;
  // FCM tokens are opaque device credentials. Reject paths, whitespace, and oversized IDs.
  // These characters also preserve the token IDs used by existing app versions.
  if (typeof token !== "string" || !/^[A-Za-z0-9:_-]{20,1400}$/.test(token)) {
    throw new HttpsError("invalid-argument", "Invalid push token.");
  }
  if (platform !== undefined && platform !== "ios" && platform !== "android") {
    throw new HttpsError("invalid-argument", "Invalid notification platform.");
  }
  if (Object.keys(data).some((key) => key !== "token" && key !== "platform")) {
    throw new HttpsError("invalid-argument", "Unexpected push-token fields.");
  }
  return { token, tokenId: token, platform: platform as string | undefined };
}

export async function handleRegisterPushToken(authUid: string | undefined, data: unknown) {
  const uid = requireUid(authUid);
  const { token, tokenId, platform } = parseToken(data);
  if (!platform) throw new HttpsError("invalid-argument", "Notification platform is required.");

  await db.runTransaction(async (tx) => {
    await assertAccountActive(uid, tx);
    const globalRef = db.doc(`pushTokens/${tokenId}`);
    const userRef = db.doc(`users/${uid}/pushTokens/${tokenId}`);
    const globalSnapshot = await tx.get(globalRef);
    const userSnapshot = await tx.get(userRef);
    const previousUid = globalSnapshot.data()?.uid;
    const now = FieldValue.serverTimestamp();

    // Token ownership follows the signed-in account on this installation.
    // The caller provides the token, never the previous account UID or a document path.
    if (typeof previousUid === "string" && previousUid !== uid && previousUid.length > 0 && !previousUid.includes("/")) {
      tx.delete(db.doc(`users/${previousUid}/pushTokens/${tokenId}`));
    }
    const tokenFields = { uid, token, tokenId, platform, enabled: true, updatedAt: now };
    tx.set(globalRef, { ...tokenFields, createdAt: globalSnapshot.data()?.createdAt ?? now });
    tx.set(userRef, { ...tokenFields, createdAt: userSnapshot.data()?.createdAt ?? now });
  });
  return { success: true };
}

export async function handleUnregisterPushToken(authUid: string | undefined, data: unknown) {
  const uid = requireUid(authUid);
  const { tokenId } = parseToken(data);

  await db.runTransaction(async (tx) => {
    await assertAccountActive(uid, tx);
    const globalRef = db.doc(`pushTokens/${tokenId}`);
    const globalSnapshot = await tx.get(globalRef);

    tx.delete(db.doc(`users/${uid}/pushTokens/${tokenId}`));
    // A delayed logout from A must not disable a token already registered by B.
    if (globalSnapshot.data()?.uid === uid) {
      tx.update(globalRef, {
        uid: null, lastUid: uid, enabled: false, updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });
  return { success: true };
}

export const registerPushToken = onCall((request) => handleRegisterPushToken(request.auth?.uid, request.data));
export const unregisterPushToken = onCall((request) => handleUnregisterPushToken(request.auth?.uid, request.data));
