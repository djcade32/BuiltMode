import { useEffect, useMemo, useRef, useState } from "react";
import { InfiniteData, skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { InfinitePage } from "@/hooks/useInfiniteQuery";
import { BlockedUser, FeedItem } from "@builtmode/shared";
import { blockUser, subscribeToBlockedUsers, unblockUser } from "@/services/social-service";

type BlockState = { users: BlockedUser[]; error: Error | null };

export function useBlockedUsers(uid: string) {
  const client = useQueryClient();
  const key = ["blocked-users", uid];
  const pendingKey = ["pending-blocks", uid];
  const { data } = useQuery<BlockState>({ queryKey: key, queryFn: skipToken });
  const { data: pending = [] } = useQuery<string[]>({ queryKey: pendingKey, queryFn: skipToken });
  const [readyUid, setReadyUid] = useState("");
  const [isPending, setIsPending] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    if (!uid) return;
    return subscribeToBlockedUsers(uid, (users) => {
      client.setQueryData<BlockState>(["blocked-users", uid], { users, error: null });
      // Keep the provisional hide until the listener observes the saved block,
      // even if the callable response arrives before the Firestore update.
      const confirmed = new Set(users.map((user) => user.uid));
      client.setQueryData<string[]>(["pending-blocks", uid], (current = []) => current.filter((id) => !confirmed.has(id)));
      setReadyUid(uid);
    }, (error) => {
      client.setQueryData<BlockState>(["blocked-users", uid], { users: [], error });
      setReadyUid(uid);
    });
  }, [uid, client]);

  const blockedUids = useMemo(() => new Set([
    ...(data?.users.map((user) => user.uid) ?? []), ...pending,
  ]), [data, pending]);

  async function setBlocked(target: BlockedUser, blocked: boolean) {
    if (!uid || busy.current) return;
    busy.current = true;
    setIsPending(true);
    if (blocked) client.setQueryData<string[]>(pendingKey, (current = []) => [...new Set([...current, target.uid])]);
    let succeeded = false;
    try {
      if (blocked) await blockUser(target.uid);
      else await unblockUser(target.uid);
      succeeded = true;
      client.setQueryData<BlockState>(key, (current) => ({
        users: blocked
          ? [...(current?.users ?? []).filter((user) => user.uid !== target.uid), target]
          : (current?.users ?? []).filter((user) => user.uid !== target.uid),
        error: null,
      }));
      // Remove every cached copy, including the home widget's different page size.
      // An in-flight fetch cannot reintroduce them while the block filter is active.
      await client.cancelQueries({ queryKey: ["user-feed", uid] });
      client.setQueriesData<InfiniteData<InfinitePage<FeedItem, unknown>>>({ queryKey: ["user-feed", uid] }, (current) => current ? {
        ...current, pages: current.pages.map((page) => ({
          ...page, items: page.items.filter((item) => item.actorUid !== target.uid),
        })),
      } : current);
      for (const queryKey of [["user-friends", uid], ["incoming-friend-requests", uid], ["sent-friend-requests", uid], ["user-feed", uid]]) {
        void client.invalidateQueries({ queryKey });
      }
    } finally {
      if (!succeeded || !blocked) client.setQueryData<string[]>(pendingKey, (current = []) => current.filter((id) => id !== target.uid));
      busy.current = false;
      setIsPending(false);
    }
  }

  return {
    users: data?.users ?? [], blockedUids, error: data?.error,
    isLoading: !!uid && (readyUid !== uid || !data), isPending, setBlocked,
  };
}
