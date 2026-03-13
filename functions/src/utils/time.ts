export const assertValidTimezone = (homeTimezone: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: homeTimezone });
  } catch {
    throw new Error("Invalid IANA timezone");
  }
};

export const toDateOnlyUtc = (dateKey: string): Date => {
  return new Date(`${dateKey}T00:00:00.000Z`);
};

export const formatDateKeyUtc = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};
