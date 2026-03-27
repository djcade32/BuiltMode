import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

/** 
  Returns the deterministic BuiltMode week identifier based on the
  user’s home timezone and the Monday 4:00 AM weekly reset rule.
  @param {Date | string} date 
  @param {string} homeTimezone IANA valid timezone
*/
export function handleGetWeekId(date: Date | string, homeTimezone: string) {
  // const startOfWeek = dayjs(date).tz(homeTimezone).startOf("week").add(1, "day");
  // const boundary = startOfWeek.set("day", 1).set("hour", 4); // Change to current weeks Monday at 4:00 am
  // const isBeforeReset = dayjs(date).isBefore(boundary);
  // const weekId = isBeforeReset
  //   ? boundary.add(-1, "week")
  //   : dayjs(date).tz(homeTimezone).set("day", 1);
  const zoned = dayjs(date).tz(homeTimezone);
  const boundary = zoned.startOf("isoWeek").hour(4).minute(0).second(0).millisecond(0);
  const weekId = zoned.isBefore(boundary) ? boundary.subtract(1, "week") : boundary;
  return weekId.format("YYYY-MM-DD");
}
