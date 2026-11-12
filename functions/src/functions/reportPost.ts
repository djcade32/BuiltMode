import { createHash } from "node:crypto";
import { reportPostRequestSchema } from "@builtmode/shared/schemas/social";
import { ReportPostResponse } from "@builtmode/shared/types/social";
import { Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "../lib/firebaseAdmin.js";
import { assertAccountActive } from "../services/accountDeletionGuard.js";

const REPORT_LIMIT = 10;
const REPORT_WINDOW_MS = 60 * 60 * 1000;

export async function handleReportFeedPost(uid: string | undefined, input: unknown): Promise<ReportPostResponse> {
  if (!uid) throw new HttpsError("unauthenticated", "Sign in to report a post.");
  const parsed = reportPostRequestSchema.safeParse(input);
  if (!parsed.success) throw new HttpsError("invalid-argument", "Choose a reason and provide details for Other (up to 1,000 characters).");
  const { feedItemId, reason, details } = parsed.data;
  const reportId = createHash("sha256").update(JSON.stringify([uid, feedItemId])).digest("hex");

  return db.runTransaction(async (tx) => {
    await assertAccountActive(uid, tx);
    const reporter = await tx.get(db.doc(`users/${uid}`));
    if (!reporter.exists) throw new HttpsError("failed-precondition", "Finish setting up your profile before reporting a post.");
    const post = await tx.get(db.doc(`feedItems/${feedItemId}`));
    if (!post.exists) throw new HttpsError("not-found", "This post is no longer available.");
    const content = post.data()!;
    if (content.type !== "workout_completed" || typeof content.actorUid !== "string" || !content.actorUid || content.actorUid.includes("/")) {
      throw new HttpsError("failed-precondition", "This post cannot be reported.");
    }
    if (content.actorUid === uid) throw new HttpsError("failed-precondition", "You cannot report your own post.");

    // The feed is server-written and owner-readable. Permit reports of posts
    // delivered previously, even if the friendship has since been removed.
    const delivered = await tx.get(db.doc(`userFeeds/${uid}/items/${feedItemId}`));
    if (!delivered.exists || delivered.data()?.actorUid !== content.actorUid) {
      throw new HttpsError("permission-denied", "You can only report posts in your feed.");
    }
    const reportRef = db.doc(`contentReports/${reportId}`);
    const existingReport = await tx.get(reportRef);
    if (existingReport.exists) return { reportId, status: "already_reported" };

    const limitRef = db.doc(`users/${uid}/reportLimits/workoutPosts`);
    const limitSnapshot = await tx.get(limitRef);
    const limit = limitSnapshot.data();
    const now = Timestamp.now();
    const inWindow = limit?.windowStartedAt instanceof Timestamp
      && now.toMillis() - limit.windowStartedAt.toMillis() < REPORT_WINDOW_MS;
    const count = inWindow ? (limit?.count ?? 0) : 0;
    if (count >= REPORT_LIMIT) throw new HttpsError("resource-exhausted", "You have submitted several reports recently. Please try again in an hour.");
    const authorProfile = await tx.get(db.doc(`publicProfiles/${content.actorUid}`));
    const author = authorProfile.data();
    const reporterData = reporter.data()!;

    tx.create(reportRef, {
      reportId, feedItemId,
      reporterUid: uid,
      reporterUsername: reporterData.username ?? null,
      reporterDisplayName: reporterData.displayName ?? null,
      reportedUid: content.actorUid,
      reportedUsername: author?.username ?? content.actorUsername ?? null,
      reportedDisplayName: author?.displayName ?? content.actorDisplayName ?? null,
      reason, details,
      postSnapshot: {
        workoutId: content.workoutId ?? null,
        workoutName: content.workoutName ?? null,
        caption: content.caption ?? null,
        photoUrl: content.photoUrl ?? null,
        createdAt: content.createdAt ?? null,
      },
      status: "pending",
      createdAt: now,
      reviewedAt: null,
      reviewNotes: null,
      resolution: null,
    });
    tx.set(limitRef, {
      count: count + 1,
      windowStartedAt: inWindow ? limit!.windowStartedAt : now,
      updatedAt: now,
    });
    return { reportId, status: "submitted" };
  });
}

export const reportFeedPost = onCall((request) => handleReportFeedPost(request.auth?.uid, request.data));
