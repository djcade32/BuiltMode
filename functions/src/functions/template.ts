import { SaveAsTemplateRequest, SaveAsTemplateResponse } from "@builtmode/shared/types/template";
import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";
import { createTemplate, deleteTemplate, getTemplate } from "../firestore/template.js";
import { getUserByUid } from "../firestore/user.js";
import { db } from "../lib/firebaseAdmin.js";
import { Template } from "../types/template.js";

export async function handleSaveAsTemplate(
  uid: string,
  workout: SaveAsTemplateRequest,
): Promise<SaveAsTemplateResponse> {
  const { id, workoutType, notes, exercises, name } = workout;

  return await db.runTransaction(async (tx) => {
    const user = await getUserByUid(tx, uid);
    if (!user.exists) {
      throw new HttpsError("not-found", "User not found.");
    }

    const now = Timestamp.now();

    const templateDoc: Template = {
      id,
      uid,
      exercises,
      workoutType: workoutType ?? "other",
      notes: notes ?? "",
      completedAt: now,
      createdAt: now,
      updatedAt: now,
      name,
    };

    createTemplate(tx, templateDoc);

    return {
      id,
      exercises,
      name,
      notes: templateDoc.notes,
      workoutType: templateDoc.workoutType,
    } as SaveAsTemplateResponse;
  });
}

export async function handleDeleteTemplate(uid: string, id: string): Promise<boolean> {
  try {
    return await db.runTransaction(async (tx) => {
      const template = await getTemplate(tx, id);
      if (template) {
        if (template.uid === uid) {
          await deleteTemplate(tx, id);
          return true;
        }
        console.error("Failed to delete template. Denied Access: ", id);
        return false;
      }
      console.error("Failed to delete template. Doesn't exist:", id);
      return false;
    });
  } catch (error) {
    console.error("Failed to delete template:", id, error);
    throw new HttpsError("internal", "Failed to delete template.");
  }
}
