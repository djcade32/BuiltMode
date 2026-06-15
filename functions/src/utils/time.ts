export class InvalidTimezoneError extends Error {
  constructor() {
    super("Invalid IANA timezone");
    this.name = "InvalidTimezoneError";
  }
}

export const assertValidTimezone = (homeTimezone: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: homeTimezone });
  } catch {
    throw new InvalidTimezoneError();
  }
};

export const formatDateKeyUtc = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

export const subtractWeeks = (weekId: string, weeks: number): string => {
  const [year, month, day] = weekId.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCDate(date.getUTCDate() - weeks * 7);

  return date.toISOString().slice(0, 10);
};
