export type TimezoneOption = {
  id: string;
  label: string;
  subtitle: string;
};

export const TIMEZONE_IDS: string[] = [
  // 🌎 Americas
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",

  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo",

  // 🌍 Europe
  "Europe/London",
  "Europe/Dublin",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Brussels",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Zurich",
  "Europe/Vienna",
  "Europe/Prague",
  "Europe/Warsaw",
  "Europe/Budapest",
  "Europe/Athens",
  "Europe/Istanbul",
  "Europe/Helsinki",
  "Europe/Stockholm",
  "Europe/Oslo",
  "Europe/Copenhagen",
  "Europe/Moscow",

  // 🌍 Africa
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Casablanca",
  "Africa/Algiers",

  // 🌏 Middle East
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Kuwait",
  "Asia/Qatar",
  "Asia/Baghdad",
  "Asia/Jerusalem",
  "Asia/Tehran",

  // 🌏 Asia
  "Asia/Kolkata",
  "Asia/Karachi",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Taipei",
  "Asia/Seoul",
  "Asia/Tokyo",

  // 🌏 Oceania
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
  "Pacific/Auckland",
  "Pacific/Fiji",

  // 🌐 Additional coverage (important but less common)
  "Atlantic/Azores",
  "Atlantic/Cape_Verde",
  "Pacific/Guam",
  "Pacific/Port_Moresby",
  "Pacific/Tahiti",
];

export function formatTimezoneLabel(id: string): string {
  if (!id) return "";

  const parts = id.split("/");

  // Take the most specific part (usually the city)
  const cityPart = parts[parts.length - 1];

  return cityPart.replace(/_/g, " ");
}

export function formatTimezoneSubtitle(id: string): string {
  try {
    const now = new Date();

    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: id,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = dtf.formatToParts(now);

    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value;

    const year = Number(getPart("year"));
    const month = Number(getPart("month"));
    const day = Number(getPart("day"));
    const hour = Number(getPart("hour"));
    const minute = Number(getPart("minute"));
    const second = Number(getPart("second"));

    if ([year, month, day, hour, minute, second].some((value) => Number.isNaN(value))) {
      return id;
    }

    const asIfUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    const actualUtc = now.getTime();

    const offsetMinutes = Math.round((asIfUtc - actualUtc) / 60000);

    const sign = offsetMinutes >= 0 ? "+" : "-";
    const absMinutes = Math.abs(offsetMinutes);
    const offsetHours = Math.floor(absMinutes / 60);
    const remainderMinutes = absMinutes % 60;

    const formattedOffset = `UTC${sign}${String(offsetHours).padStart(2, "0")}:${String(
      remainderMinutes,
    ).padStart(2, "0")}`;

    const region = id.split("/")[0].replace(/_/g, " ");

    return `${formattedOffset} • ${id.replace(/_/g, " ")}`;
  } catch {
    return id;
  }
}

export function getTimezoneOptions(): TimezoneOption[] {
  return TIMEZONE_IDS.map((id) => ({
    id,
    label: formatTimezoneLabel(id),
    subtitle: formatTimezoneSubtitle(id),
  }));
}
