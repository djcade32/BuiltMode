import { isAccountDeleting } from "../services/accountDeletionGuard.js";
import { UserStats } from "@builtmode/shared/types/user";
import { FieldValue, Timestamp, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../lib/firebaseAdmin.js";
import { UserDoc } from "../types/user.js";
import { handleGetWeekWindow } from "../utils/weekId.js";

type DeloadTransition = "start" | "end";
type DeloadResult = {
  status: "started" | "ended" | "expired" | "skipped";
  reason?: string;
};

const PAGE_SIZE = 100;
const TRANSITION_DELAY_MS = 60_000;

export const processDeloadWeeks = onSchedule(
  {
    schedule: "* * * * *",
    timeZone: "UTC",
    region: "us-central1",
    retryCount: 3,
    memory: "256MiB",
  },
  async () => {
    const now = Timestamp.now();
    const dueAt = Timestamp.fromMillis(now.toMillis() - TRANSITION_DELAY_MS);
    const counts = { started: 0, ended: 0, expired: 0, skipped: 0 };
    logger.info("processDeloadWeeks started", { now: now.toDate().toISOString() });

    // End existing deloads before consuming newly scheduled starts.
    for (const transition of ["end", "start"] as const) {
      const field = transition === "start" ? "pendingDeloadWeekStartsAt" : "deloadWeekEndsAt";
      let lastDoc: QueryDocumentSnapshot | undefined;

      while (true) {
        let query = db.collection("users")
          .where(field, "<=", dueAt)
          .orderBy(field, "asc")
          .limit(PAGE_SIZE);
        if (lastDoc) query = query.startAfter(lastDoc);
        const snapshot = await query.get();
        if (snapshot.empty) break;

        for (const userDoc of snapshot.docs) {
          const result = await processUserDeloadWeek(userDoc.ref.path, transition, now);
          counts[result.status] += 1;
          if (result.reason) {
            logger.warn("Deload transition not applied", {
              userPath: userDoc.ref.path, transition, ...result,
            });
          }
        }

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        if (snapshot.size < PAGE_SIZE) break;
      }
    }

    logger.info("processDeloadWeeks finished", counts);
  },
);

export async function processUserDeloadWeek(
  userPath: string,
  transition: DeloadTransition,
  now: Timestamp,
): Promise<DeloadResult> {
  const userRef = db.doc(userPath);

  return db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) return { status: "skipped", reason: "user_not_found" };
    if (await isAccountDeleting(userSnap.id, tx)) return { status: "skipped", reason: "account_deleting" };

    const user = userSnap.data() as UserDoc;
    const uid = userSnap.id;
    if (user.officialWeekStatus !== "official" || !user.homeTimezone) {
      return { status: "skipped", reason: "missing_timezone_or_not_official" };
    }

    const transitionAt = transition === "start"
      ? user.pendingDeloadWeekStartsAt : user.deloadWeekEndsAt;
    if (!transitionAt || transitionAt.toMillis() > now.toMillis() - TRANSITION_DELAY_MS) {
      return { status: "skipped" };
    }

    const week = handleGetWeekWindow(now.toDate(), user.homeTimezone);
    const scheduledWeek = transition === "start"
      ? handleGetWeekWindow(transitionAt.toDate(), user.homeTimezone) : null;

    // An outage spanning a whole week must not move that deload into a later week.
    if (scheduledWeek && scheduledWeek.weekId !== week.weekId) {
      tx.update(userRef, {
        pendingDeloadWeekStartsAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { status: "expired", reason: "scheduled_week_has_passed" };
    }

    const aggregateRef = db.doc(`userWeekAggregates/${uid}_${week.weekId}`);
    const aggregateSnap = await tx.get(aggregateRef);
    const isDeloadWeek = transition === "start";

    if (!aggregateSnap.exists) {
      const statsSnap = await tx.get(db.doc(`userStats/${uid}`));
      if (!statsSnap.exists) return { status: "skipped", reason: "user_stats_not_found" };
      const stats = statsSnap.data() as UserStats;

      // Use the same initial values as ensureCurrentWeekAggregates. Creating it
      // inside this transaction avoids relying on the order of scheduled jobs.
      tx.create(aggregateRef, {
        uid,
        weekId: week.weekId,
        isOfficialWeek: true,
        weeklyTargetDays: user.weeklyTargetDays,
        modeScore: stats.modeScore ?? 0,
        activeDaysThisWeek: 0,
        totalWorkouts: 0,
        workoutCountByDate: {},
        metTargetThisWeek: false,
        targetMetAt: null,
        streakWeeks: stats.currentWeekStreak ?? 0,
        streakStatus: "inactive",
        isDeloadWeek,
        createdBy: "processDeloadWeeks",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        streakCreditedAt: null,
        finalizedAt: null,
        weekStartAt: week.weekStartAt,
        weekEndAt: week.weekEndAt,
        scoreVersion: 1,
      });
    } else {
      tx.update(aggregateRef, { isDeloadWeek, updatedAt: FieldValue.serverTimestamp() });
    }

    tx.update(userRef, {
      ...(transition === "start" ? {
        pendingDeloadWeekStartsAt: null,
        lastDeloadWeekStartedAt: transitionAt,
        deloadWeekEndsAt: week.weekEndAt,
      } : { deloadWeekEndsAt: null }),
      currentWeekId: week.weekId,
      lastEnsuredWeekId: week.weekId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { status: transition === "start" ? "started" : "ended" };
  });
}
