import { useQuery } from "@/hooks/useQuery";
import { fetchUserWeekAggregate } from "@/services/user-service";
import { useUserStore } from "@/stores/user-store";
import { getWeekId } from "@builtmode/shared";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { AppState } from "react-native";

export const useCurrentWeekAggregate = () => {
  const { user } = useUserStore();
  const uid = user?.uid ?? "";
  const timezone = user?.homeTimezone;
  const [now, setNow] = useState(Date.now);
  const weekId = timezone ? getWeekId(new Date(now), timezone) : "";
  const query = useQuery({
    queryKey: ["user-week-aggregate", weekId, uid],
    queryFn: fetchUserWeekAggregate,
    params: { uid, weekId },
    enabled: !!uid && !!timezone,
  });
  const { refetch } = query;

  useFocusEffect(useCallback(() => {
    if (!uid || !timezone) return;
    const refresh = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      // A new week changes the query key and fetches automatically.
      if (getWeekId(new Date(currentTime), timezone) === weekId) void refetch();
    };
    refresh();
    const interval = setInterval(() => {
      if (AppState.currentState === "active") refresh();
    }, 60_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [uid, timezone, weekId, refetch]));

  return query;
};
