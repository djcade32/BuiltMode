import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import { Timestamp } from "firebase-admin/firestore";
import { UserDoc } from "../types/user.js";
import { subtractWeeks } from "./time.js";
import { handleGetWeekWindow } from "./weekId.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export function getWeekStartsAt(weekId: string, homeTimezone: string): Timestamp {
  return Timestamp.fromDate(dayjs.tz(`${weekId}T04:00:00`, homeTimezone).toDate());
}

/** Wait until both timezones agree on the new week, and any deload has finished. */
export function getHomeTimezoneChangeSchedule(user: UserDoc, nextTimezone: string, now: Date) {
  let weekId = subtractWeeks(handleGetWeekWindow(now, user.homeTimezone).weekId, -1);
  const deloadEnd = user.pendingDeloadWeekStartsAt
    ? handleGetWeekWindow(user.pendingDeloadWeekStartsAt.toDate(), user.homeTimezone).weekEndAt
    : user.deloadWeekEndsAt;

  if (deloadEnd) {
    const afterDeloadWeekId = handleGetWeekWindow(deloadEnd.toDate(), user.homeTimezone).weekId;
    if (afterDeloadWeekId > weekId) weekId = afterDeloadWeekId;
  }

  return {
    pendingHomeTimezone: nextTimezone,
    pendingHomeTimezoneWeekId: weekId,
    pendingHomeTimezoneStartsAt: Timestamp.fromMillis(Math.max(
      getWeekStartsAt(weekId, user.homeTimezone).toMillis(),
      getWeekStartsAt(weekId, nextTimezone).toMillis(),
    )),
  };
}
