# Account deletion

Settings → Delete Account uses the existing password reauthentication and DELETE
confirmation. The callable accepts no target UID: it uses the authenticated UID
and requires sign-in within five minutes. It disables Auth access, removes data,
and deletes the Auth record last. The client then clears its user, onboarding,
workout and React Query state and signs out.

## Cleanup

- The user document and nested friends, push tokens and notifications.
- Friend-list entries in other accounts and incoming/outgoing friend requests.
- Templates, workouts, userMonthAggregates, userWeekAggregates and userWeekDays,
  including day documents whose parent document does not exist.
- UserStats, publicProfiles, leaderboardEntries and username reservations.
- FeedItems and their subcollections, copies in userFeeds, and the user's feed.
- Respects on other posts, decrementing their authoritative respectCount once.
- Notifications in other accounts with matching fromUid, targetUid or actorUid.
- Global push-token registrations still owned by the user.
- The exact avatar object and each workout's exact photo object. Storage objects
  are deleted before their owning workout, so interrupted cleanup retains the
  mapping needed to retry. Prefix matching is not used for photos because it can
  match another account's UID.

Legacy accepted-friend notifications that stored only a display name in their
message cannot be reliably attributed to a deleted user. New notifications now
include fromUid. Unreferenced legacy Storage objects outside the current naming
and workout records require a separate ownership audit; cleanup does not guess
ownership from arbitrary download URLs.

## Retry behavior

`accountDeletions/{uid}` records progress and prevents normal account activity.
The callable attempts cleanup immediately. `retryAccountDeletions` resumes due
work every 15 minutes. A ten-minute lease prevents simultaneous workers; functions
have a nine-minute timeout. Deletion operations tolerate already-removed data.

After completion, the minimal job record and exact workout photo IDs remain for
70 minutes to block old ID tokens and clean up uploads already in flight. A final
sweep removes late data and the job itself. No email, password,
display name or profile contents are stored in this job. Failures are logged and
rescheduled; the account stays disabled once deletion has begun.

## Deployment

Nothing is deployed automatically by this change. Deploy in this order:

1. Deploy `firestore:rules`, `firestore:indexes`, and `storage` rules. Wait for the
   collection-group indexes to finish building.
2. Deploy the functions, including the new deletion functions and the existing
   callables/scheduled jobs that now check deletion status. Deploying only the new
   callable is insufficient.
3. Release the updated client.

The previously deployed Firestore rules allowed public reads and writes until
August 30, 2027. That policy cannot safely coexist with a backend deletion queue.
The new rules deny client access to deletion jobs and client writes to account
data; the Admin SDK remains responsible for those writes. Authenticated clients
retain reads used by the app and the push-token registration/transfer writes.
Storage writes are blocked for accounts undergoing deletion. Existing composite
indexes were exported and preserved before adding collection-group indexes.

## Validation

Unit tests cover ownership isolation, pagination, repeated cleanup, partial
failure, worker overlap, recent authentication and confirmation. Firebase emulator
tests cover real nested deletion, Storage cleanup, Auth deletion and Firestore
rules. Screen tests cover local-state/cache cleanup after completed and pending
deletion responses. Emulator tests refuse to run outside `demo-builtmode` with
all three required emulators configured.
