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

export const saveAsTemplate = async (
  template: SaveAsTemplateRequest,
): Promise<SaveAsTemplateResponse> => {
  const saveAsTemplateFunction = httpsCallable<SaveAsTemplateRequest, SaveAsTemplateResponse>(
    functions,
    "saveAsTemplate",
  );
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
  const templatesRef = collection(db, "templates");

  const templatesQuery = pageParam
    ? query(
        templatesRef,
        where("uid", "==", params.uid),
        orderBy("completedAt", "desc"),
        startAfter(pageParam),
        limit(pageSize),
      )
    : query(
        templatesRef,
        where("uid", "==", params.uid),
        orderBy("completedAt", "desc"),
        limit(pageSize),
      );

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
};
