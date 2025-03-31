import type { ApiResponse } from "~/types/api";
import type { Group } from "~/types/model";

export const groupService = {
  leave: async (groupId: string) => {
    return await useAPI<ApiResponse>(`/api/group/${groupId}/leave`, {
      method: "POST",
    });
  },
  joined: async (page: number = 1, limit: number = 10) => {
    return useAPI<
      ApiResponse<{
        list: Group[];
        pagination: {
          hasMore: boolean;
        };
      }>
    >(`/api/group/joined`, {
      method: "GET",
      params: {
        page,
        limit,
      },
    });
  },
  kickMember: async (groupId: string, userId: string) => {
    return useAPI<ApiResponse>(`/api/group/${groupId}/members/${userId}`, {
      method: "DELETE",
    });
  },
};
