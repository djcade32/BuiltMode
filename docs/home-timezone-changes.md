# Pending home timezone changes

Settings reuses the onboarding timezone picker. Users confirm a selection, see the saved effective date in their current home timezone, and can replace or cancel a pending request. A user-document subscription keeps the active and pending timezone visible across devices and when the scheduler applies it.

## Transition rules

- The callable `updateHomeTimezone` stores `pendingHomeTimezone`, `pendingHomeTimezoneWeekId`, and `pendingHomeTimezoneStartsAt`. It does not change the active timezone.
- The effective timestamp is the later of the old and new timezone's Monday 4 AM boundaries for the same next week. This avoids moving backward into a previous week. DST offsets are resolved separately for each boundary.
- Pending or active deloads finish in the original timezone first. Starting a deload after requesting a timezone change moves the timezone request to the week after the deload. Canceling that deload leaves the displayed timezone date unchanged.
- `changeUsersHomeTimezone` runs every minute in UTC and transactionally rechecks each due request. It waits for practice-week activation, due weekly-target changes, and deload processing; scheduled jobs do not need to run in a specific order. The displayed date is the earliest transition time, not a guaranteed execution time.
- The old timezone remains active until the transaction succeeds. Existing completed workouts, day/month buckets, previous weeks, deload cooldown history, and official-start history are untouched.
- If a new-week aggregate already exists, its progress and start boundary are retained and its end boundary adopts the new timezone. A missing aggregate is left to the existing creation paths. Future pending weekly targets retain their intended week under the new timezone.
- A missed effective week or finalized destination week defers the request to another safe week. Workout completion cannot reopen a finalized aggregate. Jobs that began before a timezone update skip that user and retry on their next run with a fresh clock.

A transition week can be shorter or longer than seven days because the timezone offset changes. History retains the timezone recorded when each workout was completed; future workouts use the newly active timezone.

## Deployment

Build shared types and functions before releasing the client. Deploy both new functions (`updateHomeTimezone`, `changeUsersHomeTimezone`) and all changed existing functions (`startDeloadWeek`, `completeWorkout`, `processDeloadWeeks`, `changeUsersWeeklyTargetDays`, `ensureCurrentWeekAggregates`, `finalizeExpiredWeeks`). The pending-time query uses a standard single-field Firestore index. No backfill is required; missing pending fields mean no change is scheduled.

Deploying only the new functions would omit the concurrent-job and newly requested deload protections. No deployment is performed as part of this implementation.
