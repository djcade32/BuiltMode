import { useEffect, useMemo } from "react";
import { useBlockedUsers } from "./useBlockedUsers";
import { useInfiniteQuery } from "@/hooks/useInfiniteQuery";
import { getUserFeed } from "@/services/social-service";

export const useUserFeedInfinite = (uid: string, limit = 15) => {
  const blocks = useBlockedUsers(uid);
  const feed = useInfiniteQuery({
    queryKey: ["user-feed", uid],
    queryFn: getUserFeed,
    params: { uid },
    limit,
    enabled: !!uid && !blocks.isLoading && !blocks.error,
  });
  const data = useMemo(() => !feed.data || blocks.isLoading || blocks.error ? undefined : ({
    ...feed.data,
    pages: feed.data.pages.map((page) => ({
      ...page, items: page.items.filter((item) => !blocks.blockedUids.has(item.actorUid)),
    })),
  }), [feed.data, blocks.isLoading, blocks.error, blocks.blockedUids]);
  const visibleCount = data?.pages.reduce((count, page) => count + page.items.length, 0) ?? 0;
  const { error, hasNextPage, isFetching, fetchNextPage } = feed;
  // A page containing only blocked authors must not strand pagination.
  useEffect(() => {
    if (!blocks.isLoading && !blocks.error && !error && data && visibleCount === 0 && hasNextPage && !isFetching) {
      void fetchNextPage();
    }
  }, [blocks.isLoading, blocks.error, error, data, visibleCount, hasNextPage, isFetching, fetchNextPage]);
  return { ...feed, data, isLoading: feed.isLoading || blocks.isLoading, error: blocks.error ?? feed.error };
};
