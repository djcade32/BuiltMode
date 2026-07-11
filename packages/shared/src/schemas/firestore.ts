import { z } from "zod";

export const firestoreTimestampSchema = z.custom<{
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
  toMillis: () => number;
}>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    typeof (value as any).seconds === "number" &&
    typeof (value as any).nanoseconds === "number" &&
    typeof (value as any).toDate === "function" &&
    typeof (value as any).toMillis === "function",
  {
    message: "Expected Firestore Timestamp",
  },
);

export const firestoreTimestampV2Schema = z.custom<{
  _seconds: number;
  _nanoseconds: number;
}>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    typeof (value as any)._seconds === "number" &&
    typeof (value as any)._nanoseconds === "number", 
  {
    message: "Expected Firestore Timestamp V2",
  },
);
