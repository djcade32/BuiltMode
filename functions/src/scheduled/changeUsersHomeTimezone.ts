import { FieldValue, QueryDocumentSnapshot, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../lib/firebaseAdmin.js";
import { isAccountDeleting } from "../services/accountDeletionGuard.js";
import { UserDoc } from "../types/user.js";
import { getHomeTimezoneChangeSchedule, getWeekStartsAt } from "../utils/homeTimezoneChange.js";
import { handleGetWeekWindow } from "../utils/weekId.js";

const PAGE_SIZE = 100;

export const changeUsersHomeTimezone = onSchedule(
  { schedule: "* * * * *", timeZone: "UTC", region: "us-central1", retryCount: 3, memory: "256MiB" },
  async () => {
    const now = Timestamp.now();
    const counts = { updated: 0, deferred: 0, skipped: 0 };
    let lastDoc: QueryDocumentSnapshot | undefined;

    while (true) {
      let query = db.collection("users").where("pendingHomeTimezoneStartsAt", "<=", now)
        .orderBy("pendingHomeTimezoneStartsAt", "asc").limit(PAGE_SIZE);
      if (lastDoc) query = query.startAfter(lastDoc);
      const snapshot = await query.get();
      if (snapshot.empty) break;
      for (const userDoc of snapshot.docs) {
        const status = await processUserHomeTimezone(userDoc.ref.path, now);
        counts[status] += 1;
      }
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      if (snapshot.size < PAGE_SIZE) break;
    }
    logger.info("changeUsersHomeTimezone finished", counts);
  },
);

export async function processUserHomeTimezone(userPath: string, now: Timestamp): Promise<"updated" | "deferred" | "skipped"> {
  return db.runTransaction(async (tx) => {
    const userRef = db.doc(userPath);
    const snapshot = await tx.get(userRef);
    if (!snapshot.exists || await isAccountDeleting(snapshot.id, tx)) return "skipped";
    const user = snapshot.data() as UserDoc;
    const nextTimezone = user.pendingHomeTimezone;
    if (!nextTimezone || !user.pendingHomeTimezoneStartsAt || !user.pendingHomeTimezoneWeekId
      || user.pendingHomeTimezoneStartsAt.toMillis() > now.toMillis()) return "skipped";

    // Let the existing jobs finish under the original timezone, regardless of job order.
    if (user.officialWeekStatus !== "official") return "skipped";
    if (user.pendingDeloadWeekStartsAt || user.deloadWeekEndsAt) return "skipped";
    if (user.pendingWeeklyTargetStartsAt && user.pendingWeeklyTargetStartsAt.toMillis() <= now.toMillis()) return "skipped";

    const oldWeek = handleGetWeekWindow(now.toDate(), user.homeTimezone);
    const newWeek = handleGetWeekWindow(now.toDate(), nextTimezone);
    const aggregateRef = db.doc(`userWeekAggregates/${snapshot.id}_${newWeek.weekId}`);
    const aggregate = await tx.get(aggregateRef);
    if (oldWeek.weekId !== newWeek.weekId || newWeek.weekId !== user.pendingHomeTimezoneWeekId
      || aggregate.data()?.finalizedAt) {
      // A long outage must not move someone into a previous or already finalized week.
      tx.update(userRef, {
        ...getHomeTimezoneChangeSchedule(user, nextTimezone, now.toDate()),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return "deferred";
    }

    // Only this new, unfinished week's boundaries change. Keep all progress and history.
    if (aggregate.exists) {
      tx.update(aggregateRef, { weekEndAt: newWeek.weekEndAt, updatedAt: FieldValue.serverTimestamp() });
    }
    const futureTarget = user.pendingWeeklyTargetStartsAt
      ? getWeekStartsAt(handleGetWeekWindow(user.pendingWeeklyTargetStartsAt.toDate(), user.homeTimezone).weekId, nextTimezone)
      : null;
    tx.update(userRef, {
      homeTimezone: nextTimezone,
      homeTimezoneUpdatedAt: FieldValue.serverTimestamp(),
      pendingHomeTimezone: null, pendingHomeTimezoneWeekId: null, pendingHomeTimezoneStartsAt: null,
      currentWeekId: newWeek.weekId,
      lastEnsuredWeekId: aggregate.exists ? newWeek.weekId : null,
      ...(futureTarget ? { pendingWeeklyTargetStartsAt: futureTarget } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return "updated";
  });
}
