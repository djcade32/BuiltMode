import { QueryKey, useQuery as tanstackUseQuery } from "@tanstack/react-query";

type UseQueryOptions<TItem, TParams> = {
  queryKey: QueryKey;
  queryFn: (args: { params: TParams }) => Promise<TItem>;
  params: TParams;
  enabled?: boolean;
};

export function useQuery<TItem, TParams = void>({
  queryKey,
  queryFn,
  params,
  enabled = true,
}: UseQueryOptions<TItem, TParams>) {
  return tanstackUseQuery({
    queryKey: [...queryKey, { params }],
    queryFn: () => queryFn({ params }),
    enabled,
  });
}
