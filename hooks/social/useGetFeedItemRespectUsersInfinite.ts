import { useInfiniteQuery } from "@/hooks/useInfiniteQuery";
import { getFeedItemRespectUsers } from "@/services/social-service";

export const useGetFeedItemRespectUsersInfinite = (feedItemId: string, limit = 25) => {
  return useInfiniteQuery({
    queryKey: ["feed-item-respect-users", feedItemId],
    queryFn: getFeedItemRespectUsers,
    params: { feedItemId },
    limit,
    enabled: !!feedItemId,
  });
};
