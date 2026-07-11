import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import { handleGetNextOfficialStartWeekId, handleGetWeekId } from "../../utils/weekId.js";

dayjs.extend(utc);
dayjs.extend(timezone);

describe("handleGetWeekId", () => {
  test("returns previous Monday Feb 23, 2026 when date is Monday March 2, 2026 3:59 am", () => {
    const homeTimezone = "America/New_York";
    const date = new Date();
    date.setUTCFullYear(2026, 2, 2);
    date.setUTCHours(8, 59, 0, 0);

    const dateStr = date.toISOString();

    const resWithDate = handleGetWeekId(date, homeTimezone);
    expect(resWithDate).toEqual("2026-02-23");

    const resWithDateStr = handleGetWeekId(dateStr, homeTimezone);
    expect(resWithDateStr).toEqual("2026-02-23");
  });

  test("returns March 2, 2026 when date is Monday March 2, 2026 4:00 am", () => {
    const date = new Date();
    date.setUTCFullYear(2026, 2, 2);
    date.setUTCHours(9, 0, 0, 0);

    const res = handleGetWeekId(date, "America/New_York");
    expect(res).toEqual("2026-03-02");
  });

  // Test timezone handling
  test("returns previous Monday Feb 23, 2026 when date is Monday March 2, 2026 5:59 pm in Tokyo ", () => {
    const date = new Date();
    date.setUTCFullYear(2026, 2, 2);
    date.setUTCHours(8, 59, 0, 0);

    const tokyoTimeStr = dayjs(date).tz("Asia/Tokyo").toISOString();

    const res = handleGetWeekId(tokyoTimeStr, "America/New_York");
    expect(res).toEqual("2026-02-23");
  });

  // Test timezone handling
  test("returns Monday March 02, 2026 when date is Monday March 2, 2026 6:00 pm in Tokyo ", () => {
    const date = new Date();
    date.setUTCFullYear(2026, 2, 2);
    date.setUTCHours(9, 0, 0, 0);

    const tokyoTimeStr = dayjs(date).tz("Asia/Tokyo").toISOString();

    const res = handleGetWeekId(tokyoTimeStr, "America/New_York");
    expect(res).toEqual("2026-03-02");
  });

  // Test timezone handling
  test("returns Monday March 02, 2026 in Tokyo when date is Monday March 2, 2026 3:59 am in New York ", () => {
    const date = new Date();
    date.setUTCFullYear(2026, 2, 2);
    date.setUTCHours(8, 59, 0, 0);

    const nyTimeStr = dayjs(date).tz("America/New_York").toISOString();

    const res = handleGetWeekId(nyTimeStr, "Asia/Tokyo");
    expect(res).toEqual("2026-03-02");
  });

  // Test timezone handling
  test("returns Monday March 2, 2026 in Tokyo Timezone when date is Sunday March 1, 2026 2:00 pm in New York ", () => {
    const date = new Date();
    date.setUTCFullYear(2026, 2, 1);
    date.setUTCHours(19, 0, 0, 0);

    const nyTimeStr = dayjs(date).tz("America/New_York").toISOString();

    const res = handleGetWeekId(nyTimeStr, "Asia/Tokyo");
    expect(res).toEqual("2026-03-02");
  });
});

describe("handleGetNextOfficialStartWeekId", () => {
  test("returns Monday March 2, 2026 when date is Monday March 2, 2026 3:59 am", () => {
    const date = new Date();
    date.setUTCFullYear(2026, 2, 2);
    date.setUTCHours(8, 59, 0, 0);

    const res = handleGetNextOfficialStartWeekId(date, "America/New_York");
    expect(res).toEqual("2026-03-02");
  });

  test("returns next Monday March 9, 2026 when date is Monday March 2, 2026 4:00 am", () => {
    const date = new Date();
    date.setUTCFullYear(2026, 2, 2);
    date.setUTCHours(9, 0, 0, 0);

    const res = handleGetNextOfficialStartWeekId(date, "America/New_York");
    expect(res).toEqual("2026-03-09");
  });

  test("returns next Monday March 9, 2026 when date is Wednesday March 4, 2026", () => {
    const date = new Date();
    date.setUTCFullYear(2026, 2, 4);

    const res = handleGetNextOfficialStartWeekId(date, "America/New_York");
    expect(res).toEqual("2026-03-09");
  });

  // Test timezone handling
  test("returns Monday March 2, 2026 when date is Monday March 2, 2026 5:59 pm in Tokyo", () => {
    const date = new Date();
    // Take into account Daylight Savings
    date.setUTCFullYear(2026, 2, 2);
    date.setUTCHours(8, 59, 0, 0);

    const tokyoTimeStr = dayjs(date).tz("Asia/Tokyo").toISOString();

    const res = handleGetNextOfficialStartWeekId(tokyoTimeStr, "America/New_York");
    expect(res).toEqual("2026-03-02");
  });

  // Test timezone handling
  test("returns next Monday March 9, 2026 when date is Monday March 2, 2026 6:00 pm in Tokyo", () => {
    const date = new Date();
    // Take into account Daylight Savings
    date.setUTCFullYear(2026, 2, 2);
    date.setUTCHours(9, 0, 0, 0);

    const tokyoTimeStr = dayjs(date).tz("Asia/Tokyo").toISOString();

    const res = handleGetNextOfficialStartWeekId(tokyoTimeStr, "America/New_York");
    expect(res).toEqual("2026-03-09");
  });
});
