import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import { handleGetWeekId } from "./utils.js";

dayjs.extend(utc);
dayjs.extend(timezone);

describe("handleGetWeekId", () => {
  test("returns previous Monday Feb 23, 2026 when date is Monday March 2, 2026 3:59 am", () => {
    const date = new Date();
    date.setFullYear(2026, 2, 2);
    date.setHours(3, 59, 0, 0);

    const dateStr = date.toISOString();

    const resWithDate = handleGetWeekId(date);
    expect(resWithDate).toEqual("2026-02-23");

    const resWithDateStr = handleGetWeekId(dateStr);
    expect(resWithDateStr).toEqual("2026-02-23");
  });

  test("returns March 2, 2026 when date is Monday March 2, 2026 4:00 am", () => {
    const date = new Date();
    date.setFullYear(2026, 2, 2);
    date.setHours(4, 0, 0, 0);

    const res = handleGetWeekId(date);
    expect(res).toEqual("2026-03-02");
  });

  // Test timezone handling
  test("returns previous Monday Feb 23, 2026 when date is Monday March 2, 2026 5:59 pm in Tokyo ", () => {
    const date = new Date();
    date.setFullYear(2026, 2, 1);
    date.setUTCHours(8, 59, 0, 0);

    const tokyoTimeStr = dayjs(date).tz("Asia/Tokyo").toISOString();

    const res = handleGetWeekId(tokyoTimeStr);
    expect(res).toEqual("2026-02-23");
  });

  // Test timezone handling
  test("returns Monday March 02, 2026 when date is Monday March 2, 2026 6:00 pm in Tokyo ", () => {
    const date = new Date();
    date.setFullYear(2026, 2, 1);
    date.setUTCHours(9, 0, 0, 0);

    const tokyoTimeStr = dayjs(date).tz("Asia/Tokyo").toISOString();

    const res = handleGetWeekId(tokyoTimeStr);
    expect(res).toEqual("2026-03-02");
  });

  // Test timezone handling
  test("returns Monday March 02, 2026 in Tokyo when date is Monday March 2, 2026 3:59 am in New York ", () => {
    const date = new Date();
    date.setFullYear(2026, 2, 2);
    date.setHours(3, 59, 0, 0);

    const nyTimeStr = dayjs(date).tz("America/New_York").toISOString();

    const res = handleGetWeekId(nyTimeStr, "Asia/Tokyo");
    expect(res).toEqual("2026-03-02");
  });

  // Test timezone handling
  test("returns Monday Feb 23, 2026 in Tokyo Timezone when date is Monday March 1, 2026 1:59 pm in New York ", () => {
    const date = new Date();
    date.setFullYear(2026, 2, 1);
    date.setHours(13, 59, 0, 0);

    const nyTimeStr = dayjs(date).tz("America/New_York").toISOString();

    const res = handleGetWeekId(nyTimeStr, "Asia/Tokyo");
    expect(res).toEqual("2026-02-23");
  });
});
