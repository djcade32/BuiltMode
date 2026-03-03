import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// Returns the deterministic BuiltMode week identifier based on the
// user’s home timezone and the Monday 4:00 AM weekly reset rule.
/** 
  Returns the deterministic BuiltMode week identifier based on the
  user’s home timezone and the Monday 4:00 AM weekly reset rule.
  @param {string} date Date as isoString in UTC
  @param {string} [homeTimezone] IANA valid timezone
*/
export function handleGetWeekId(date: Date | string, homeTimezone: string = "America/New_York") {
  dayjs.tz.setDefault(homeTimezone);
  const startOfWeek = dayjs(date).startOf("week").add(1, "day").tz(homeTimezone);
  const boundary = startOfWeek.set("day", 1).set("hour", 4); // Change to current weeks Monday at 4:00 am
  const isBeforeReset = dayjs(date).isBefore(boundary);
  let weekId = isBeforeReset ? boundary.add(-1, "week") : dayjs(date).set("day", 1);
  return weekId.format("YYYY-MM-DD");
}
