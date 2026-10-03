import { UpdateHomeTimezoneResponse } from "@builtmode/shared/types/user";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../lib/firebaseAdmin.js";
import { assertAccountActive } from "../services/accountDeletionGuard.js";
import { UserDoc } from "../types/user.js";
import { getHomeTimezoneChangeSchedule } from "../utils/homeTimezoneChange.js";
import { assertValidTimezone } from "../utils/time.js";

export async function handleUpdateHomeTimezone(uid: string, homeTimezone: string): Promise<UpdateHomeTimezoneResponse> {
  try {
    assertValidTimezone(homeTimezone);
  } catch {
    throw new HttpsError("invalid-argument", "Choose a valid home timezone.");
  }

  return db.runTransaction(async (tx) => {
    await assertAccountActive(uid, tx);
    const userRef = db.doc(`users/${uid}`);
    const snapshot = await tx.get(userRef);
    if (!snapshot.exists) throw new HttpsError("not-found", "User profile not found.");
    const user = snapshot.data() as UserDoc;

    // Selecting the current timezone cancels a pending change.
    if (homeTimezone === user.homeTimezone) {
      tx.update(userRef, {
        pendingHomeTimezone: null, pendingHomeTimezoneWeekId: null, pendingHomeTimezoneStartsAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { homeTimezone, effectiveWeekId: null, effectiveAt: null };
    }

    // Retrying an identical request must not move its effective date.
    if (homeTimezone === user.pendingHomeTimezone && user.pendingHomeTimezoneStartsAt && user.pendingHomeTimezoneWeekId) {
      return {
        homeTimezone, effectiveWeekId: user.pendingHomeTimezoneWeekId,
        effectiveAt: user.pendingHomeTimezoneStartsAt.toMillis(),
      };
    }

    const pending = getHomeTimezoneChangeSchedule(user, homeTimezone, Timestamp.now().toDate());
    tx.update(userRef, { ...pending, updatedAt: FieldValue.serverTimestamp() });
    return {
      homeTimezone, effectiveWeekId: pending.pendingHomeTimezoneWeekId,
      effectiveAt: pending.pendingHomeTimezoneStartsAt.toMillis(),
    };
  });
}
