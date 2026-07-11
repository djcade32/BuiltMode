export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const roundToNearestInt = (value: number): number => {
  return Math.round(value);
};
