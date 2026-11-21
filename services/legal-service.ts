import { auth, db, functions } from "@/lib/firebase";
import { AcceptTermsRequest, CURRENT_TERMS_VERSION, acceptTermsRequestSchema } from "@builtmode/shared/schemas/legal";
import { doc, getDocFromServer } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

async function requireCurrentUser(uid: string) {
  await auth.authStateReady();
  if (!uid || auth.currentUser?.uid !== uid) throw new Error("Sign in again to review the terms.");
}

export async function hasAcceptedCurrentTerms(uid: string): Promise<boolean> {
  await requireCurrentUser(uid);
  const record = await getDocFromServer(doc(db, `users/${uid}/legalAcceptance/terms`));
  const data = record.data();
  return data?.termsVersion === CURRENT_TERMS_VERSION && typeof data?.acceptedAt?.toMillis === "function";
}

export async function acceptCurrentTerms(uid: string, input: AcceptTermsRequest): Promise<void> {
  const payload = acceptTermsRequestSchema.parse(input);
  await requireCurrentUser(uid);
  const accept = httpsCallable<AcceptTermsRequest, { termsVersion: string }>(functions, "acceptTerms");
  const result = await accept(payload);
  if (result.data.termsVersion !== CURRENT_TERMS_VERSION) throw new Error("Please review the latest terms and try again.");
}
