import { Exercise, WorkoutType } from "./workout.js";

export type SaveAsTemplateRequest = {
  id: string;
  workoutType?: WorkoutType;
  notes?: string;
  exercises: Exercise[];
  name: string;
};

export type SaveAsTemplateResponse = {
  id: string;
  workoutType?: WorkoutType;
  notes?: string;
  exercises: Exercise[];
  name: string;
};
