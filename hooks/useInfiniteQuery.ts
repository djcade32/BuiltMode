import { QueryKey, useInfiniteQuery as tanstackUseInfiniteQuery } from "@tanstack/react-query";

export type InfinitePage<TItem, TCursor> = {
  items: TItem[];
  nextCursor?: TCursor | null;
  hasMore: boolean;
};

type UseInfiniteQueryOptions<TItem, TCursor, TParams> = {
  queryKey: QueryKey;
  queryFn: (args: {
    pageParam?: TCursor | null;
    params: TParams;
    limit: number;
  }) => Promise<InfinitePage<TItem, TCursor>>;
  params: TParams;
  limit?: number;
  enabled?: boolean;
};

export function useInfiniteQuery<TItem, TCursor = string | null, TParams = void>({
  queryKey,
  queryFn,
  params,
  limit = 30,
  enabled = true,
}: UseInfiniteQueryOptions<TItem, TCursor, TParams>) {
  return tanstackUseInfiniteQuery({
    queryKey: [...queryKey, { params, limit }],
    initialPageParam: null as TCursor | null,
    queryFn: ({ pageParam }) =>
      queryFn({
        pageParam: pageParam as TCursor | null,
        params,
        limit,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? (lastPage.nextCursor ?? null) : undefined),
    enabled,
  });
}
