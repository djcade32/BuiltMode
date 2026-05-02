import { Exercise, WorkoutType } from "@builtmode/shared/types/workout";
import { Timestamp } from "firebase-admin/firestore";

export type Template = {
  id: string;
  uid: string;

  // Authoritative time
  completedAt: Timestamp;

  // User content
  name: string;
  workoutType?: WorkoutType;
  notes?: string;
  exercises: Exercise[];

  // Meta
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
