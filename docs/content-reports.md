# Workout post reports

## User flow

On another user's workout post, tap the three-dot menu, select **Report Post**, select a reason, and submit. Details are optional except for **Other**, and are limited to 1,000 characters. The reporter receives confirmation only after the server saves the report. Failures leave the form open for retry.

Submitting a report does not notify the post's author, remove the post, or block the author. There is no email or push delivery in this version. Check the review queue regularly and respond promptly to concerns.

## Review in Firebase Console

1. Open the BuiltMode Firebase project, then **Firestore Database → Data**.
2. Open `contentReports`. This collection appears after the first successful report.
3. Filter for `status == "pending"`. Use `createdAt` to prioritize older reports.
4. Open a report and inspect:
   - `reason` and `details`.
   - `reporterUid`, `reporterUsername`, and `reporterDisplayName`.
   - `reportedUid`, `reportedUsername`, and `reportedDisplayName`.
   - `feedItemId` and `postSnapshot` (workout ID/name, caption, photo reference, and original post timestamp).
5. After investigating and taking any necessary action, set `status` to `reviewed`, set `reviewedAt` to a Firestore timestamp, and record `resolution` and `reviewNotes` as text. Record what actually happened, such as `no_violation` or `content_removed` only after that action has been completed.

Changing the report status records a review; it does not remove a post or suspend a user. Content removal must account for the canonical `feedItems` document and its copied `userFeeds/{uid}/items` entries. Do not assume deleting only the canonical document removes all copies. Blocking removes the posts from the two affected users’ feeds. Broader moderation-action tooling remains separate.

`postSnapshot` preserves text and a photo URL, not a separate copy of the image. The image may become unavailable if its source is deleted. Report records are not automatically deleted when an account is deleted or a report is marked reviewed; retain only what is necessary for moderation and apply an appropriate retention policy through authorized administration. Avoid copying report information into public collections or exposing it to reported users.

## Security and duplicate handling

- The authenticated callable `reportFeedPost` derives the reporter UID from Firebase Auth, and author identity/content from server-owned documents. Client-supplied identity fields are rejected.
- The caller must have an active, completed profile and the post must exist in their server-created feed. A previously delivered post remains reportable if the friendship has since been removed.
- Only other users' `workout_completed` posts can be reported.
- One report is saved per reporter/post pair. Retries return `already_reported` and leave the original evidence and review outcome intact. Different reporters may report the same post independently.
- A transaction enforces a maximum of ten new reports in an hour-long window beginning with the first report. Duplicate retries do not consume this allowance. The private counter lives at `users/{uid}/reportLimits/workoutPosts`.
- Reports are private to authorized Firebase administrators and server code. Existing Firestore rules deny all client access to `contentReports` and the rate-limit records, including access by the reporter.
- Console access uses your Google Cloud/Firebase project permissions. Do not grant project access to ordinary app users.

## Release and verification

Build shared code and functions with `npm run build`. Deploy the `reportFeedPost` callable and the approved Firestore security rules before releasing the updated client. No new dependencies, indexes, or email-provider setup are required for this feature. Deployment is a separate step.

Tests:

- Backend: `./node_modules/.bin/jest --config functions/jest.config.ts functions/src/tests/unit/reportPost.test.ts --runInBand --watchman=false`
- UI: `./node_modules/.bin/jest --config jest.client.config.js tests/unit/screens/reportPost.test.tsx --runInBand --watchman=false`

Before App Review, verify on a physical device using two accounts: report a friend's post, confirm the form closes and the receipt appears, and verify the private report in Console. Also verify cancellation, duplicate reporting, and an offline retry. The signup agreement and active developer-notification requirements from the rejection still need separate verification.

## Blocking users

Open another user's profile and tap **⋯ → Block User**, then confirm. The app immediately filters their posts from the feed and home screen’s recent activity, reverting the provisional filter if the request fails. Block lists sync from Firestore across devices; the feed waits for a server-confirmed list before displaying cached posts on a fresh mount. If that check fails, content stays hidden and an error is shown. A fresh feed cannot load offline before this check.

The authenticated `blockUser` callable saves `users/{blockerUid}/blockedUsers/{blockedUid}`, removes both friendship records and both pending friend-request documents, and saves a private `contentReports/block_{generation}` record. The block record is readable only by its owner and writable only through server code. Search, friend requests, request acceptance, post respects, and future feed delivery reject blocked pairs in either direction. Progress/post rules also deny access despite a stale friendship record.

A retry-enabled `cleanUpBlockedUserFeed` trigger deletes existing feed copies in both directions in bounded transactions. Each transaction verifies the block generation so delayed cleanup cannot affect a later friendship. It does not delete canonical posts or the author's workouts. Feed lists remain owner-readable during cleanup; the current client filters immediately while server cleanup removes the stored copies.

**Settings → Blocked Users → Unblock** calls `unblockUser`. It finishes feed cleanup before lifting the block. Unblocking does not restore the friendship or old posts. After a new friend request is accepted, new posts can be delivered again, unless the other person still has a block in place. Deleting an account removes its outgoing block records and other accounts’ block records targeting it; private moderation history remains subject to your retention policy.

Block moderation records identify both users and have `type: "user_block"`, `reason: "user_blocked"`, and `status: "pending"`. They do not allege a specific violation, include a reason supplied by the user, or identify an offending post: the action starts from a profile. Review them alongside post reports in Firebase Console. Blocking does not notify the blocked user. **There is no email/push notification to the developer in this implementation**; a manual Console queue is not active notification. The App Review rejection explicitly requested developer notification for blocks, so arrange that separately before claiming the entire rejection is resolved.

### Release

Deploy the updated functions and rules before releasing the client:

- New: `blockUser`, `unblockUser`, `cleanUpBlockedUserFeed`.
- Updated: `sendFriendRequest`, `respondToFriendRequest`, `searchUserByUsername`, `respectFeedPost`, `publishCompletedWorkoutToFeed` (feed delivery), `deleteBuiltModeAccount`, and `retryAccountDeletions`.
- Updated Firestore rules for owner-only block lists and blocked progress/post access.
- Account deletion's incoming-block lookup needs a collection-group single-field ascending index for `blockedUsers.uid`, alongside the existing deletion indexes. Configure it in Firebase Console if it is not already enabled.

Test on two physical-device accounts: block from the profile menu, confirm posts disappear immediately from feed/recent activity, publish another workout, restart the app, and verify the author stays absent. Verify the Console moderation record, rejected friend requests, unblocking from Settings, and new-post delivery after reconnecting. Also check offline failures and a block made on another device.

Automated blocking checks:

- Backend: `./node_modules/.bin/jest --config functions/jest.config.ts functions/src/tests/unit/blocking.test.ts functions/src/tests/unit/deleteAccount.test.ts --runInBand --watchman=false`
- UI: `./node_modules/.bin/jest --config jest.client.config.js tests/unit/screens/blocking.test.tsx --runInBand --watchman=false`
- Rules: `npm run test:rules` inside the local Firestore emulator.
