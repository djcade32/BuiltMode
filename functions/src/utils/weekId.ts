import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import { Timestamp } from "firebase-admin/firestore";
import { assertValidTimezone, subtractWeeks } from "./time.js";

dayjs.extend(utc);
dayjs.extend(timezone);

/** 
  Returns the deterministic BuiltMode week identifier based on the
  user’s home timezone and the Monday 4:00 AM weekly reset rule.
  @param {Date | string} date 
  @param {string} homeTimezone IANA valid timezone
*/
export function handleGetWeekId(date: Date | string, homeTimezone: string) {
  assertValidTimezone(homeTimezone);
  const startOfWeek = dayjs(date).tz(homeTimezone).startOf("week").add(1, "day");
  const boundary = startOfWeek.set("day", 1).set("hour", 4); // Change to current weeks Monday at 4:00 am
  const isBeforeReset = dayjs(date).isBefore(boundary);
  const weekId = isBeforeReset
    ? boundary.add(-1, "week")
    : dayjs(date).tz(homeTimezone).set("day", 1);
  return weekId.format("YYYY-MM-DD");
}

/** 
  Returns the BuiltMode week identifier for a user's first official week
  @param {Date | string} date 
  @param {string} homeTimezone IANA valid timezone
*/
export function handleGetNextOfficialStartWeekId(date: Date | string, homeTimezone: string) {
  assertValidTimezone(homeTimezone);
  const currentMondayDateStr = handleGetWeekId(date, homeTimezone);
  const currentMondayDate = dayjs.tz(`${currentMondayDateStr}T04:00:00`, homeTimezone);
  const nextWeekId = currentMondayDate.add(1, "week");
  return nextWeekId.format("YYYY-MM-DD");
}

/** 
  Returns a local date key in the format of "YYYY-MM-DD" in homeTimezone
  @param {Date | string} date 
  @param {string} homeTimezone IANA valid timezone
*/
export function handleGetLocalDateKey(date: Date | string, homeTimezone: string) {
  assertValidTimezone(homeTimezone);
  const localDateKey = dayjs(date).tz(homeTimezone);
  return localDateKey.format("YYYY-MM-DD");
}

export function getLastFiveWeekIds(weekId: string): string[] {
  return Array.from({ length: 5 }, (_, index) => subtractWeeks(weekId, index));
}

dayjs.extend(utc);
dayjs.extend(timezone);

type BuiltModeWeekWindow = {
  weekId: string;
  weekStartAt: Timestamp;
  weekEndAt: Timestamp;
};

export function handleGetWeekWindow(date: Date, homeTimezone: string): BuiltModeWeekWindow {
  const localNow = dayjs(date).tz(homeTimezone);

  /**
   * BuiltMode week starts Monday at 4:00 AM local time.
   *
   * dayjs().day()
   * Sunday = 0
   * Monday = 1
   * Tuesday = 2
   */
  const currentDay = localNow.day();

  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

  let weekStartLocal = localNow
    .subtract(daysSinceMonday, "day")
    .hour(4)
    .minute(0)
    .second(0)
    .millisecond(0);

  /**
   * If it is Monday before 4:00 AM local time,
   * the user is still in the previous BuiltMode week.
   */
  if (localNow.isBefore(weekStartLocal)) {
    weekStartLocal = weekStartLocal.subtract(7, "day");
  }

  const weekEndLocal = weekStartLocal.add(7, "day");

  const weekId = weekStartLocal.format("YYYY-MM-DD");

  return {
    weekId,
    weekStartAt: Timestamp.fromDate(weekStartLocal.toDate()),
    weekEndAt: Timestamp.fromDate(weekEndLocal.toDate()),
  };
}
