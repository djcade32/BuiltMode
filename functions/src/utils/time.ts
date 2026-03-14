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
