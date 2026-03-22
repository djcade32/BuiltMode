export type GoalType =
  | "BUILD MUSCLE"
  | "CUT BODY FAT"
  | "INCREASE STRENGTH"
  | "IMPROVE CONDITIONING"
  | "GENERAL DISCIPLINE";

export type Metrics = {
  height: number; // in inches
  weight: number;
  bodyFatPercentage: number;
};
