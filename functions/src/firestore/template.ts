import { Transaction } from "firebase-admin/firestore";
import { db } from "../lib/firebaseAdmin.js";
import { Template } from "../types/template.js";

export const createTemplate = (tx: Transaction, template: Template) => {
  const ref = db.collection("templates").doc(template.id);
  tx.set(ref, template);
};

export const deleteTemplate = async (templateId: string) => {
  const templateDocRef = db.collection("templates").doc(templateId);
  await templateDocRef.delete();
};
