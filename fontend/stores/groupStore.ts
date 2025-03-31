// stores/groupStore.ts
import { ref } from "vue";
import { defineStore } from "pinia";
import type { ApiResponse } from "~/types/api";
import type { Group } from "~/types/model";

export const useGroupStore = defineStore("group", () => {
  const currentGroup = ref<Group | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const message = ref<string | null>(null);

  async function fetchGroup(slug: string) {
    loading.value = true;
    try {
      const { data } = await useAPI<ApiResponse<Group>>(`/api/group/${slug}`);
      if (data.value?.code === 200) {
        currentGroup.value = data.value.data;
      } else {
        currentGroup.value = null;
        message.value = data.value?.message || null;
      }
    } catch (err) {
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  }

  async function joinGroup(groupId: string) {
    const toast = useToast();

    const { data } = await useAPI<ApiResponse>(`/api/group/${groupId}/join`, {
      method: "POST",
    });

    if (data.value?.code === 200) {
      if (currentGroup.value) {
        currentGroup.value.isJoined = true;
      }
      toast.success(data.value.message);
    } else if (data.value?.code === 201) {
      if (currentGroup.value) {
        currentGroup.value.hasJoinRequest = true;
      }
    } else {
      toast.error(data.value?.message);
    }
  }

  async function leaveGroup(groupId: string) {
    const toast = useToast();

    const { data } = await useAPI<ApiResponse>(`/api/group/${groupId}/leave`, {
      method: "POST",
    });

    if (data.value?.code === 200) {
      if (currentGroup.value) {
        currentGroup.value.isJoined = false;
      }
      toast.success(data.value.message);
    } else {
      toast.error(data.value?.message);
    }
  }

  async function cancelJoinRequest(groupId: string) {
    const toast = useToast();

    const { data } = await useAPI<ApiResponse>(`/api/group/${groupId}/join`, {
      method: "DELETE",
    });

    if (data.value?.code === 200) {
      if (currentGroup.value) {
        currentGroup.value.hasJoinRequest = false;
      }
    } else {
      toast.error(data.value?.message);
    }
  }

  return {
    currentGroup,
    message,
    loading,
    error,
    fetchGroup,
    joinGroup,
    leaveGroup,
    cancelJoinRequest,
  };
});
