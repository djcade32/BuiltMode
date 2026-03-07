export function assertValidTimezone(homeTimezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: homeTimezone });
  } catch {
    throw new Error("Invalid IANA timezone");
  }
}
