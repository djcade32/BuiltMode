import { useInfiniteQuery } from "@/hooks/useInfiniteQuery";
import { getUserFeed } from "@/services/social-service";

export const useUserFeedInfinite = (uid: string, limit = 15) => {
  return useInfiniteQuery({
    queryKey: ["user-feed", uid],
    queryFn: getUserFeed,
    params: { uid },
    limit,
    enabled: !!uid,
  });
};
