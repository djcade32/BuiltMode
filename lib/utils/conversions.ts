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
