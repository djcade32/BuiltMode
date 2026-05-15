import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import { assertValidTimezone } from "./time.js";

dayjs.extend(utc);
dayjs.extend(timezone);

/** 
  Returns the deterministic BuiltMode week identifier based on the
  user’s home timezone and the Monday 4:00 AM weekly reset rule.
  @param {Date | string} date 
  @param {string} homeTimezone IANA valid timezone
*/
export function getWeekId(date: Date | string, homeTimezone: string) {
  assertValidTimezone(homeTimezone);

  const zonedDate = dayjs(date).tz(homeTimezone);

  const startOfWeek = zonedDate.startOf("week").add(1, "day");

  const boundary = startOfWeek.set("day", 1).set("hour", 4);

  const isBeforeReset = zonedDate.isBefore(boundary);

  const weekId = isBeforeReset ? boundary.subtract(1, "week") : zonedDate.set("day", 1);

  return weekId.format("YYYY-MM-DD");
}

export function getMonthId(date: Date | string, homeTimezone: string) {
  assertValidTimezone(homeTimezone);
  const zonedDate = dayjs(date).tz(homeTimezone);
  return zonedDate.format("YYYY-MM");
}
