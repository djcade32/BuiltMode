import { Template } from "@/functions/src/types/template";
import { InfinitePage } from "@/hooks/useInfiniteQuery";
import { db, functions } from "@/lib/firebase";
import { SaveAsTemplateRequest, SaveAsTemplateResponse } from "@/packages/shared/src";
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

type DeleteTemplateResult = {
  success: boolean;
  message?: string;
};

export const saveAsTemplate = async (template: SaveAsTemplateRequest): Promise<SaveAsTemplateResponse> => {
  const saveAsTemplateFunction = httpsCallable<SaveAsTemplateRequest, SaveAsTemplateResponse>(functions, "saveAsTemplate");
  const response = await saveAsTemplateFunction(template);
  return response.data;
};

type TemplateCursor = QueryDocumentSnapshot<DocumentData>;

export const getUserTemplates = async ({
  pageParam,
  params,
  limit: pageSize,
}: {
  pageParam?: TemplateCursor | null;
  params: { uid: string };
  limit: number;
}): Promise<InfinitePage<Template, TemplateCursor>> => {
  try {
    const templatesRef = collection(db, "templates");

    const templatesQuery = pageParam
      ? query(
          templatesRef,
          where("uid", "==", params.uid),
          orderBy("completedAt", "desc"),
          startAfter(pageParam),
          limit(pageSize),
        )
      : query(templatesRef, where("uid", "==", params.uid), orderBy("completedAt", "desc"), limit(pageSize));

    const snapshot = await getDocs(templatesQuery);

    const items: Template[] = snapshot.docs.map((doc) => ({
      ...(doc.data() as Template),
    }));

    const hasMore = snapshot.docs.length === pageSize;
    const nextCursor = hasMore ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  } catch (error) {
    console.error("Error fetching user templates: ", error);
    return {
      items: [],
      nextCursor: null,
      hasMore: false,
    };
  }
};

export const deleteTemplate = async (id: string): Promise<DeleteTemplateResult> => {
  const deleteTemplateFunction = httpsCallable<{ id: string }, boolean>(functions, "deleteTemplate");
  if (!id.trim()) {
    return { success: false, message: "Template id is required." };
  }

  try {
    const response = await deleteTemplateFunction({ id });
    return response.data ? { success: true } : { success: false, message: `Error deleting template ${id}.` };
  } catch (err) {
    return {
      success: false,
      message: err instanceof globalThis.Error ? err.message : `Error deleting template ${id}.`,
    };
  }
};
