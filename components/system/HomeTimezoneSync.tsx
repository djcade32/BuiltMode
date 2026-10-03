import { subscribeToHomeTimezone } from "@/services/user-service";
import { useUserStore } from "@/stores/user-store";
import { useEffect } from "react";

/** Keep persisted timezone state current when the scheduled job runs or another device changes it. */
export default function HomeTimezoneSync() {
  const uid = useUserStore((state) => state.user?.uid);
  useEffect(() => {
    if (!uid) return;
    return subscribeToHomeTimezone(uid, (timezoneFields) => {
      const user = useUserStore.getState().user;
      if (user?.uid === uid) useUserStore.getState().setUser({ ...user, ...timezoneFields });
    });
  }, [uid]);
  return null;
}
