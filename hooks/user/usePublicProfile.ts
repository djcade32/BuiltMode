import { PublicProfile } from "@/packages/shared/src";
import { getPublicProfile } from "@/services/user-service";
import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const PUBLIC_PROFILE_STALE_TIME_MS = 15 * 60 * 1000;

const PUBLIC_PROFILE_GC_TIME_MS = 24 * 60 * 60 * 1000;

export const publicProfileKeys = {
  all: ["public-profiles"] as const,

  detail: (uid: string) => [...publicProfileKeys.all, uid] as const,
};

export const publicProfileQueryOptions = (uid: string) =>
  queryOptions({
    queryKey: publicProfileKeys.detail(uid),
    queryFn: () => getPublicProfile(uid),
    enabled: Boolean(uid),

    /*
     * Avatars and public identity fields change infrequently.
     * During this period, every component uses the same cached
     * profile without another query-function execution.
     */
    staleTime: PUBLIC_PROFILE_STALE_TIME_MS,

    /*
     * Keep profiles cached after the last subscribing component
     * unmounts so another screen can reuse them.
     */
    gcTime: PUBLIC_PROFILE_GC_TIME_MS,

    retry: 1,
  });

export type PublicProfileFallback = PublicProfile;

export const usePublicProfile = (uid: string, fallback?: PublicProfileFallback) => {
  const query = useQuery({
    ...publicProfileQueryOptions(uid),

    /*
     * Render the denormalized snapshot while the canonical
     * profile is loading. TanStack does not persist placeholder
     * data as the successful query result.
     */
    placeholderData: fallback,
    enabled: !!uid,
  });

  return {
    ...query,

    /*
     * Continue using the snapshot if the canonical document
     * has not been migrated or the request fails.
     */
    profile: query.data ?? fallback ?? null,
  };
};

export const usePublicProfiles = (uids: string[]) => {
  const uniqueUids = useMemo(() => Array.from(new Set(uids.filter(Boolean))), [uids]);

  return useQueries({
    queries: uniqueUids.map((uid) => publicProfileQueryOptions(uid)),
  });
};
