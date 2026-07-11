import { useInfiniteQuery } from "@/hooks/useInfiniteQuery";
import { getUserTemplates } from "@/services/template-service";

export const useUserTemplatesInfinite = (uid: string, limit = 5) => {
  return useInfiniteQuery({
    queryKey: ["templates", uid],
    queryFn: getUserTemplates,
    params: { uid },
    limit,
    enabled: !!uid,
  });
};
