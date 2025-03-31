<template>
  <div class="mx-auto w-full xl:w-9/12">
    <div class="font-semibold text-xl mt-1">Đề xuất cho bạn</div>

    <div class="mt-4 grid grid-cols-12 gap-4">
      <div v-if="!groupList || !groupList.length" class="col-span-12">
        Hiện chưa có nhóm nào.
      </div>
      <div
        class="col-span-12 md:col-span-6 lg:col-span-4"
        v-for="group in groupList"
        :key="group.id"
      >
        <div class="bg-white rounded-md overflow-hidden shadow-sm relative">
          <div
            class="w-8 h-8 absolute top-3 right-3 bg-transparent/30 hover:bg-transparent/90 text-white flex justify-center items-center rounded-full"
            @click="hideGroup(group.id)"
          >
            <Icon name="tabler:x" class="text-white"></Icon>
          </div>
          <img
            :src="
              group.bannerUrl ??
              `https://gcs.tripi.vn/public-tripi/tripi-feed/img/474091cHU/simple-blue-banner_060833462.png`
            "
            alt=""
            class="w-full aspect-video"
          />
          <div class="p-3">
            <div class="flex gap-2">
              <img
                :src="
                  group.iconUrl ??
                  `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
                "
                alt=""
                srcset=""
                class="aspect-square w-11 border rounded-full"
              />
              <div>
                <NuxtLink
                  :to="`/groups/${group.id}`"
                  class="font-semibold text-gray-700"
                  >{{ group.name }}</NuxtLink
                >
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
            </div>
            <div
              v-if="group.hasJoinRequest"
              class="bg-zinc-400 text-white px-4 py-2 rounded-md hover:bg-zinc-500 shadow-md w-full transition duration-150 ease-in-out mt-3 cursor-pointer flex items-center gap-2"
              @click="cancelJoinRequest(group.id)"
            >
              <Icon name="tabler:x" class="text-white"></Icon>
              Huỷ yêu cầu tham gia
            </div>
            <button
              v-else-if="!group.isJoined"
              @click="joinGroup(group.id)"
              class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 shadow-md w-full transition duration-150 ease-in-out mt-3 cursor-pointer flex items-center gap-2"
            >
              <Icon name="tabler:plus" class="text-white"></Icon>
              {{
                group.privacy == "PUBLIC" ? "Tham gia nhóm" : "Yêu cầu tham gia"
              }}
            </button>
            <div
              v-else
              class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 shadow-md w-full transition duration-150 ease-in-out mt-3 flex items-center gap-2"
            >
              <Icon name="tabler:check" class="text-white"></Icon>
              Đã tham gia
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-center mt-4 gap-1 cursor-pointer" v-if="hasMore">
      <div class="bg-blue-500 p-2 px-3 flex items-center text-white rounded-md">
        <span>Xem thêm</span>
        <Icon name="icon-park-solid:down-one" class="text-xl"></Icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { Group } from "~/types/model";
import { formatNumber } from "~/utils/formatNumber";
import { Visibility } from "~/types/model";

definePageMeta({
  layout: "groups",
});

const toast = useToast();
const groupList = ref<Group[]>([]);
const hasMore = ref(false);

async function cancelJoinRequest(groupId: string) {
  const { data } = await useAPI<ApiResponse>(`/api/group/${groupId}/join`, {
    method: "DELETE",
  });

  if (data.value?.code === 200) {
    const group = groupList.value.find((group) => group.id === groupId);
    if (group) {
      group.hasJoinRequest = false;
    }
    toast.success(data.value.message);
  } else {
    toast.error(data.value?.message);
  }
}

async function fetchGroup() {
  const { data } = await useAPI<
    ApiResponse<{
      groups: Group[];
      pagination: {
        hasMore: boolean;
      };
    }>
  >("/api/group/discover", {
    method: "GET",
  });

  if (data.value?.code == 200) {
    groupList.value = data.value.data.groups;
    hasMore.value = data.value.data.pagination.hasMore;
  }
}

await fetchGroup();

async function hideGroup(groupId: string) {
  groupList.value = groupList.value.filter((group) => group.id !== groupId);
}

async function joinGroup(groupId: string) {
  const { data } = await useAPI<ApiResponse>(`/api/group/${groupId}/join`, {
    method: "POST",
  });

  if (data.value?.code === 200) {
    const group = groupList.value.find((group) => group.id === groupId);
    if (group) {
      group.isJoined = true;
      group._count.members += 1;
    }
    toast.success(data.value.message);
  } else if (data.value?.code === 201) {
    const group = groupList.value.find((group) => group.id === groupId);
    if (group) {
      group.hasJoinRequest = true;
    }
    toast.success(data.value.message);
  } else {
    toast.error(data.value?.message);
  }
}
</script>

<style scoped></style>
