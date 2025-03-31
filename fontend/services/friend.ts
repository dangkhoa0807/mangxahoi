import type { ApiResponse } from "~/types/api";

export const friendService = {
  addFriend: async (userId: string) => {
    return useAPI<ApiResponse>(`/api/friend/add/${userId}`, {
      method: "POST",
    });
  },
  cancelFriendRequest: async (userId: string) => {
    return useAPI<ApiResponse>(`/api/friend/cancel/${userId}`, {
      method: "POST",
    });
  },
};
