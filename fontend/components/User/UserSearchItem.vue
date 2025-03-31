<template>
  <div
    class="bg-white flex items-center justify-between p-3 rounded-lg transition-all duration-200"
  >
    <NuxtLink :to="'/user/' + user.id" class="flex items-center flex-1 gap-3">
      <div class="w-12 h-12 flex-shrink-0">
        <img
          class="w-full h-full rounded-full object-cover"
          :src="
            user.profile.avatarUrl ||
            'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
          "
          alt="Avatar"
        />
      </div>

      <div class="flex-1 min-w-0">
        <div class="text-gray-900 font-medium truncate hover:underline">
          {{ user.profile.name }}
        </div>
        <div class="text-sm text-gray-500 truncate">
          {{ user._count?.followers || 0 }} người theo dõi
        </div>
      </div>
    </NuxtLink>
    <div v-if="user.hasFriendRequest" class="flex-shrink-0 ml-4">
      <Button
        @click="cancelFriendRequest(user.id)"
        :disabled="isLoading"
        severity="danger"
        class="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors duration-200"
      >
        <Icon name="tabler:user-x" class="text-lg" />
        <span class="text-sm whitespace-nowrap">Hủy yêu cầu</span>
      </Button>
    </div>
    <div v-else-if="!user?.isFriend" class="flex-shrink-0 ml-4">
      <Button
        @click="addFriend"
        :disabled="isLoading"
        class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors duration-200"
      >
        <Icon name="tabler:user-plus" class="text-lg" />
        <span class="text-sm whitespace-nowrap">Thêm bạn bè</span>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from "~/types/model";
import type { ApiResponse } from "~/types/api";
import { friendService } from "~/services/friend";

const toast = useToast();

const isLoading = ref(false);

const props = defineProps<{
  user: User;
}>();

const emit = defineEmits(["update"]);

const addFriend = async () => {
  try {
    isLoading.value = true;
    const { data } = await useAPI<ApiResponse>(
      `/api/friend/add/${props.user.id}`,
      {
        method: "POST",
      }
    );

    if (data.value?.code === 200) {
      toast.success(data.value.message);
      emit("update", {
        ...props.user,
        hasFriendRequest: true,
      });
    } else {
      toast.error(data.value?.message || "Gửi lời mời kết bạn thất bại");
    }
  } catch (error) {
    toast.error("Có lỗi xảy ra, vui lòng thử lại sau");
  } finally {
    isLoading.value = false;
  }
};

const cancelFriendRequest = async (userId: string) => {
  try {
    isLoading.value = true;
    const { data } = await friendService.cancelFriendRequest(userId);

    if (data.value?.code == 200) {
      emit("update", {
        ...props.user,
        hasFriendRequest: false,
      });
    } else {
      toast.error(data.value?.message || "Hủy yêu cầu thất bại");
    }
  } catch (error) {
    toast.error("Có lỗi xảy ra, vui lòng thử lại sau");
  } finally {
    isLoading.value = false;
  }
};
</script>
