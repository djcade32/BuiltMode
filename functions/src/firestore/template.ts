import { Transaction } from "firebase-admin/firestore";
import { db } from "../lib/firebaseAdmin.js";
import { Template } from "../types/template.js";

export const createTemplate = (tx: Transaction, template: Template) => {
  const ref = db.collection("templates").doc(template.id);
  tx.set(ref, template);
};

export const getTemplate = async (tx: Transaction, templateId: string) => {
  const templateDocRef = db.collection("templates").doc(templateId);
  return (await tx.get(templateDocRef)).data();
};

export const deleteTemplate = async (tx: Transaction, templateId: string) => {
  const templateDocRef = db.collection("templates").doc(templateId);
  tx.delete(templateDocRef);
};
