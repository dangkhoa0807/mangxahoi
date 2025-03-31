<template>
  <div
    class="col-span-12 md:col-span-12 lg:col-span-6 2xl:col-span-4 p-3 border rounded-md"
  >
    <div class="flex justify-between items-center">
      <div class="flex gap-4">
        <div class="h-[75px] w-[75px] rounded-md">
          <img
            :src="request.sender.profile.avatarUrl || DEFAULT_AVATAR_URL"
            alt=""
            class="rounded-md w-full h-full object-cover"
          />
        </div>
        <div>
          <NuxtLink
            :to="`/user/${request.sender.id}`"
            class="text-lg hover:underline cursor-pointer block"
          >
            {{ request.sender.profile.name }}
          </NuxtLink>
          <div class="text-sm text-gray-500 mt-1">
            {{ request.sender._count?.followers || 0 }} người theo dõi
          </div>
          <div class="flex gap-2 mt-2">
            <button
              @click="acceptFriend(request.sender.id)"
              class="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
            >
              Xác nhận
            </button>
            <button
              @click="rejectFriend(request.sender.id)"
              class="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-300"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ApiResponse } from "~/types/api";
import { DEFAULT_AVATAR_URL } from "~/types/model";

const props = defineProps({
  request: { type: Object, required: true },
});

const emit = defineEmits(["onUpdate"]);
const toast = useToast();

const acceptFriend = async (userId: string) => {
  const { data: response } = await useAPI<ApiResponse>(
    `/api/friend/accept/${userId}`,
    {
      method: "POST",
    }
  );

  if (response.value?.code == 200) {
    toast.success(response.value.message);
    emit("onUpdate");
  } else {
    toast.error(response.value?.message || "Kết bạn thất bại");
  }
};

const rejectFriend = async (userId: string) => {
  const { data: response } = await useAPI<ApiResponse>(
    `/api/friend/reject/${userId}`,
    {
      method: "POST",
    }
  );

  if (response.value?.code == 200) {
    toast.success(response.value.message);
    emit("onUpdate");
  } else {
    toast.error(response.value?.message || "Từ chối kết bạn thất bại");
  }
};
</script>
