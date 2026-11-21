import { acceptTermsRequestSchema, CURRENT_TERMS_VERSION } from "@builtmode/shared/schemas/legal";
import { Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "../lib/firebaseAdmin.js";
import { assertAccountActive } from "../services/accountDeletionGuard.js";

export async function handleAcceptTerms(uid: string | undefined, input: unknown) {
  if (!uid) throw new HttpsError("unauthenticated", "Sign in to accept the terms.");
  const parsed = acceptTermsRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Review and accept the current Terms of Service. Update BuiltMode if necessary.");
  }
  await db.runTransaction(async (tx) => {
    await assertAccountActive(uid, tx);
    // Signup happens before onboarding creates the user's profile. Keeping
    // acceptance in a subcollection avoids creating a partial profile document.
    const ref = db.doc(`users/${uid}/legalAcceptance/terms`);
    const existing = await tx.get(ref);
    if (existing.get("termsVersion") === CURRENT_TERMS_VERSION && existing.get("acceptedAt") instanceof Timestamp) return;
    tx.set(ref, { termsVersion: CURRENT_TERMS_VERSION, acceptedAt: Timestamp.now() });
  });
  return { termsVersion: CURRENT_TERMS_VERSION };
}

export const acceptTerms = onCall((request) => handleAcceptTerms(request.auth?.uid, request.data));
