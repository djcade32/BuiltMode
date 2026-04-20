import { useInfiniteQuery } from "@/hooks/useInfiniteQuery";
import { getUserWorkouts } from "@/services/workout-service";

export const useUserWorkoutsInfinite = (uid: string, limit = 20) => {
  return useInfiniteQuery({
    queryKey: ["workout-history", uid],
    queryFn: getUserWorkouts,
    params: { uid },
    limit,
    enabled: !!uid,
  });
};
