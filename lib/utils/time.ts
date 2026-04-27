import { breakdownSeconds } from "./conversions";

export const durationTimeString = (duration: number) => {
  const { hours, minutes, seconds } = breakdownSeconds(duration);

  if (hours > 0) {
    return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  return `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};
