import type { ApiResponse } from "~/types/api";

export const userBlockService = {
  block: async (userId: string) => {
    return useAPI<ApiResponse>(`/api/block/${userId}`, {
      method: "POST",
    });
  },
  unblock: async (userId: string) => {
    return useAPI<ApiResponse>(`/api/block/${userId}`, {
      method: "DELETE",
    });
  },
};
