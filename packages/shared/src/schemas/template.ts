import { z } from "zod";
import { exerciseSchema, workoutTypeSchema } from "./workout.js";

export const saveAsTemplateRequestSchema = z.object({
  id: z.string().min(1),
  workoutType: workoutTypeSchema.optional(),
  notes: z.string().trim().max(1000).optional(),
  exercises: z.array(exerciseSchema),
  name: z.string().trim().max(100),
});

export const saveAsTemplateResponseSchema = z.object({
  id: z.string().min(1),
  workoutType: workoutTypeSchema.optional(),
  notes: z.string().trim().max(1000).optional(),
  exercises: z.array(exerciseSchema),
  name: z.string().trim().max(100),
});

export type SaveAsTemplateRequest = z.infer<typeof saveAsTemplateRequestSchema>;
export type SaveAsTemplateResponse = z.infer<typeof saveAsTemplateResponseSchema>;
