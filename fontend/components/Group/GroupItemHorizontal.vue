<template>
  <div class="bg-white rounded-md overflow-hidden shadow-sm relative">
    <div class="p-3 flex justify-between items-center">
      <NuxtLink :to="`/groups/${group.id}`" class="flex gap-2">
        <img
          :src="
            group.iconUrl ??
            `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
          "
          alt=""
          class="aspect-square w-11 border rounded-full"
        />
        <div>
          <div class="font-semibold text-gray-700">{{ group.name }}</div>
          <div class="flex items-center text-gray-500">
            <Icon
              name="tabler:lock"
              v-if="group.privacy == Visibility.PRIVATE"
              class="text-xs"
            ></Icon>
            <Icon
              name="tabler:world"
              v-else-if="group.privacy == Visibility.PUBLIC"
              class="text-xs"
            ></Icon>

            <Icon name="mdi:dot" v-if="group.privacy"></Icon>

            <div class="text-sm">
              {{ formatNumber(group._count.members) }} thành viên
            </div>
          </div>
        </div>
      </NuxtLink>

      <!-- Action buttons -->
      <div class="">
        <button
          v-if="group.hasJoinRequest"
          @click="cancelJoinRequest(group.id)"
          class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 shadow-md w-fit transition duration-150 ease-in-out"
        >
          Hủy yêu cầu
        </button>
        <button
          v-else-if="!group.isJoined"
          @click="joinGroup(group.id)"
          class="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 shadow-md w-fit transition duration-150 ease-in-out"
        >
          Tham gia
        </button>
        <NuxtLink :to="`/groups/${group.id}`" v-else>
          <div
            class="text-zinc-800 px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100 w-fit transition duration-150 ease-in-out text-center"
          >
            Truy cập
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { Group } from "~/types/model";
import { Visibility } from "~/types/model";
import { formatNumber } from "~/utils/formatNumber";

const props = defineProps<{
  group: Group;
}>();

const emit = defineEmits(["joined", "requested"]);
const toast = useToast();

async function joinGroup(groupId: string) {
  const { data } = await useAPI<ApiResponse<{ group: Group }>>(
    `/api/group/${groupId}/join`,
    {
      method: "POST",
    }
  );

  if (data.value?.code === 200) {
    emit("joined", {
      ...props.group,
      isJoined: true,
      _count: {
        ...props.group._count,
        members: props.group._count.members + 1,
      },
    });
    toast.success(data.value.message);
  } else if (data.value?.code === 201) {
    emit("requested", {
      ...props.group,
      isJoined: false,
      hasJoinRequest: true,
    });
    toast.success(data.value.message);
  } else {
    toast.error(data.value?.message);
  }
}

async function cancelJoinRequest(groupId: string) {
  const { data } = await useAPI<ApiResponse>(`/api/group/${groupId}/join`, {
    method: "DELETE",
  });

  if (data.value?.code === 200) {
    emit("requested", {
      ...props.group,
      hasJoinRequest: false,
    });
    toast.success(data.value.message);
  } else {
    toast.error(data.value?.message);
  }
}
</script>
