import type { ApiResponse } from "~/types/api";

export const notificationService = {
  getNotification: async () => {
    return useAPI<ApiResponse>(`/api/notification`, {
      method: "GET",
    });
  },
  markAsRead: async (notificationIds: string[]) => {
    return useAPI<ApiResponse>("/api/user/notification/read", {
      method: "PUT",
      body: {
        notificationIds,
      },
    });
  },
};
