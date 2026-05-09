import { breakdownSeconds } from "./conversions";

export const durationTimeString = (duration: number) => {
  const { hours, minutes, seconds } = breakdownSeconds(duration);

  if (hours > 0) {
    return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  return `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

export const formatTimeInput = (value: number | string): string => {
  if (value === null || value === undefined) return "00:00";

  // Convert to string and remove non-digits
  const digits = value.toString().replace(/\D/g, "");

  if (!digits) return "00:00";

  // Pad to at least 3 digits (so we always have mm:ss minimum)
  const padded = digits.padStart(3, "0");

  const seconds = padded.slice(-2);
  const minutes = padded.slice(-4, -2);
  const hours = padded.slice(0, -4);

  if (hours) {
    return `${parseInt(hours, 10)}:${minutes}:${seconds}`;
  }

  return `${parseInt(minutes, 10)}:${seconds}`;
};
