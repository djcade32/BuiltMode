/**
 * The function `fromFeetToInches` converts a length measurement from feet to inches.
 * @param {number} feet - The `feet` parameter in the `fromFeetToInches` function represents the number
 * of feet that you want to convert to inches.
 * @param {number} [inches] - The `fromFeetToInches` function takes two parameters: `feet` and
 * `inches`. The `feet` parameter is required and represents the number of feet to convert to inches.
 * The `inches` parameter is optional and represents any additional inches to add to the conversion
 * @returns The function `fromFeetToInches` returns the total number of inches converted from the given
 * feet and optional inches input.
 */
export const fromFeetToInches = (feet: number, inches?: number) => {
  return 12 * feet + (inches ?? 0);
};

type TimeBreakdown = {
  hours: number;
  minutes: number;
  seconds: number;
};

/**
 * The function `breakdownSeconds` takes a total number of seconds and returns the breakdown of hours,
 * minutes, and seconds.
 * @param {number} totalSeconds - The `totalSeconds` parameter represents the total number of seconds
 * that you want to break down into hours, minutes, and seconds. The `breakdownSeconds` function takes
 * this total number of seconds as input and calculates the equivalent hours, minutes, and remaining
 * seconds.
 * @returns The function `breakdownSeconds` returns an object with properties `hours`, `minutes`, and
 * `seconds`, which represent the breakdown of the total number of seconds provided as input.
 */
export function breakdownSeconds(totalSeconds: number): TimeBreakdown {
  const normalized = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  const seconds = normalized % 60;

  return { hours, minutes, seconds };
}

/**
 * The function `timeStringToSeconds` converts a time string in the format "HH:MM:SS" to the total
 * number of seconds.
 * @param {string} time - The `timeStringToSeconds` function takes a time string in the format
 * "HH:MM:SS" or "MM:SS" and converts it to the total number of seconds.
 * @returns The function `timeStringToSeconds` returns the total number of seconds represented by the
 * input time string.
 */
export const timeStringToSeconds = (time: string): number => {
  if (!time) return 0;

  const parts = time
    .trim()
    .split(":")
    .map((p) => Number(p));

  if (parts.length < 2 || parts.length > 3 || parts.some((n) => isNaN(n))) {
    return 0;
  }

  const [h = 0, m = 0, s = 0] = parts.length === 3 ? parts : [0, parts[0], parts[1]];

  return h * 3600 + m * 60 + s;
};
