<template>
  <div class="border rounded-lg overflow-hidden shadow-sm">
    <img
      v-if="request"
      :src="request.sender.profile.avatarUrl || DEFAULT_AVATAR_URL"
      alt=""
      class="w-full aspect-square rounded-md"
    />
    <div class="p-3">
      <NuxtLink
        v-if="request.sender.id"
        :to="`/user/${request.sender.id}`"
        class="overflow-hidden truncate whitespace-nowrap hover:underline"
      >
        {{ request.sender.profile.name }}
      </NuxtLink>
      <div class="flex flex-col gap-2 mt-2">
        <button
          @click="acceptFriend(request.sender.id)"
          class="bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600 shadow-sm transition duration-150 ease-in-out"
        >
          Xác nhận
        </button>
        <button
          class="bg-gray-200 text-gray-700 px-4 py-2 rounded-sm hover:bg-gray-300 shadow-sm transition duration-150 ease-in-out"
        >
          Xoá
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ApiResponse } from "~/types/api";
import { DEFAULT_AVATAR_URL } from "~/types/model";
const toast = useToast();

const props = defineProps({
  request: { type: Object, required: true },
});

const emit = defineEmits(["onUpdate"]);

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
</script>

<style></style>
