import { publicProfileKeys } from "@/hooks/user/usePublicProfile";
import { changeUserAvatarUrl } from "@/services/user-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateProfileAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeUserAvatarUrl,

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(publicProfileKeys.detail(updatedProfile.uid), updatedProfile);
    },
  });
};
