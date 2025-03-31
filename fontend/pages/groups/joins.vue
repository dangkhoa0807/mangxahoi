<template>
  <div>
    <div class="mx-auto w-full xl:w-9/12 flex flex-col gap-4">
      <div>
        <div class="font-semibold text-xl mt-1">Do bạn quản lý</div>

        <div class="mt-4 grid grid-cols-12 gap-4">
          <div
            class="col-span-12"
            v-if="!managedGroups || !managedGroups.length"
          >
            Hiện bạn chưa quản lý nhóm nào.
          </div>

          <div
            class="col-span-12 md:col-span-6 lg:col-span-4"
            v-for="myGroup in managedGroups"
            :key="myGroup.id"
          >
            <div class="bg-white rounded-md relative shadow-sm">
              <img
                :src="
                  myGroup.bannerUrl ??
                  `https://gcs.tripi.vn/public-tripi/tripi-feed/img/474091cHU/simple-blue-banner_060833462.png`
                "
                alt=""
                class="w-full aspect-video rounded-t-md"
              />
              <div class="p-3">
                <div class="flex gap-2">
                  <img
                    :src="
                      myGroup.iconUrl ??
                      `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
                    "
                    alt=""
                    class="aspect-square w-11 border rounded-full"
                  />
                  <div>
                    <div class="font-semibold text-gray-700">
                      {{ myGroup.name }}
                    </div>
                    <div class="flex items-center text-gray-500">
                      <Icon
                        name="tabler:lock"
                        v-if="myGroup.privacy == Visibility.PRIVATE"
                        class="text-xs"
                      ></Icon>
                      <Icon
                        name="tabler:world"
                        v-else-if="myGroup.privacy == Visibility.PUBLIC"
                        class="text-xs"
                      ></Icon>

                      <Icon name="mdi:dot" v-if="myGroup.privacy"></Icon>

                      <div class="text-sm">
                        {{ formatNumber(myGroup._count.members) }} thành viên
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-3 mt-3">
                  <nuxt-link :to="`/groups/${myGroup.id}`" class="w-full">
                    <div
                      class="bg-blue-500 text-white px-4 py-2 rounded-md text-center cursor-pointer hover:bg-blue-600 shadow-md transition duration-150 ease-in-out"
                    >
                      Xem nhóm
                    </div>
                  </nuxt-link>

                  <HeadlessPopover class="relative inline-block text-left">
                    <HeadlessPopoverButton
                      class="bg-gray-200 h-[40px] text-gray-700 px-3 py-1 outline-none rounded-md hover:bg-gray-300 shadow-sm transition duration-150 ease-in-out flex items-center"
                    >
                      <Icon name="ph:dots-three-bold" class="text-xl"></Icon>
                    </HeadlessPopoverButton>

                    <transition
                      enter-active-class="transition duration-100 ease-out"
                      enter-from-class="transform scale-95 opacity-0"
                      enter-to-class="transform scale-100 opacity-100"
                      leave-active-class="transition duration-75 ease-in"
                      leave-from-class="transform scale-100 opacity-100"
                      leave-to-class="transform scale-95 opacity-0"
                    >
                      <HeadlessPopoverPanel
                        class="absolute z-10 right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
                      >
                        <div class="p-2">
                          <NuxtLink
                            :to="`/groups/admin/${myGroup.id}/settings/info`"
                            class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
                          >
                            <Icon
                              name="tabler:settings"
                              class="text-2xl text-gray-600"
                            ></Icon>
                            Cài đặt nhóm
                          </NuxtLink>
                          <div
                            class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
                          >
                            <Icon
                              name="tabler:trash"
                              class="text-2xl text-gray-600"
                            ></Icon>
                            Xoá nhóm
                          </div>
                        </div>
                      </HeadlessPopoverPanel>
                    </transition>
                  </HeadlessPopover>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div class="font-semibold text-xl mt-1">Nhóm bạn đã tham gia</div>

        <div class="mt-4 grid grid-cols-12 gap-4">
          <div class="col-span-12" v-if="!joinedGroups || !joinedGroups.length">
            Hiện bạn chưa tham gia nhóm nào.
          </div>

          <div
            class="col-span-12 md:col-span-6 lg:col-span-4"
            v-for="group in joinedGroups"
            :key="group.id"
          >
            <div class="bg-white rounded-md relative">
              <img
                :src="
                  group.bannerUrl ??
                  `https://gcs.tripi.vn/public-tripi/tripi-feed/img/474091cHU/simple-blue-banner_060833462.png`
                "
                alt=""
                class="w-full aspect-video rounded-t-md"
              />
              <div class="p-3">
                <div class="flex gap-2">
                  <img
                    :src="
                      group.iconUrl ??
                      `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
                    "
                    alt=""
                    class="aspect-square w-11 border rounded-full"
                  />
                  <div>
                    <div class="font-semibold text-gray-700">
                      {{ group.name }}
                    </div>
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
                <div class="flex items-center gap-3 mt-3">
                  <nuxt-link :to="`/groups/${group.id}`" class="w-full">
                    <div
                      class="bg-blue-500 text-white px-4 py-2 rounded-md text-center cursor-pointer hover:bg-blue-600 shadow-md transition duration-150 ease-in-out"
                    >
                      Xem nhóm
                    </div>
                  </nuxt-link>

                  <HeadlessPopover class="relative inline-block text-left">
                    <HeadlessPopoverButton
                      class="bg-gray-200 h-[40px] text-gray-700 px-3 py-1 outline-none rounded-md hover:bg-gray-300 shadow-sm transition duration-150 ease-in-out flex items-center"
                    >
                      <Icon name="ph:dots-three-bold" class="text-xl"></Icon>
                    </HeadlessPopoverButton>

                    <transition
                      enter-active-class="transition duration-100 ease-out"
                      enter-from-class="transform scale-95 opacity-0"
                      enter-to-class="transform scale-100 opacity-100"
                      leave-active-class="transition duration-75 ease-in"
                      leave-from-class="transform scale-100 opacity-100"
                      leave-to-class="transform scale-95 opacity-0"
                    >
                      <HeadlessPopoverPanel
                        class="absolute z-10 right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
                      >
                        <div class="p-2">
                          <div
                            class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
                            @click="handleLeaveGroup(group.id)"
                          >
                            <Icon
                              name="tabler:logout"
                              class="text-2xl text-gray-600"
                            ></Icon>
                            Rời nhóm
                          </div>
                        </div>
                      </HeadlessPopoverPanel>
                    </transition>
                  </HeadlessPopover>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { groupService } from "~/services/group";
import type { ApiResponse } from "~/types/api";
import type { Group } from "~/types/model";
import { formatNumber } from "~/utils/formatNumber";
import { Visibility } from "~/types/model";

definePageMeta({
  layout: "groups",
});

const managedGroups = ref<Group[]>([]);

async function fetchManagedGroup() {
  const { data } = await useAPI<
    ApiResponse<{
      list: Group[];
      pagination: {
        hasMore: boolean;
      };
    }>
  >("/api/group/managed", {
    method: "GET",
  });

  if (data.value?.code == 200) {
    managedGroups.value = data.value.data.list;
  }
}

const joinedGroups = ref<Group[]>([]);

async function fetchJoinedGroup() {
  const { data } = await groupService.joined(1, 10);

  if (data.value?.code == 200) {
    joinedGroups.value = data.value.data.list;
  }
}

async function handleLeaveGroup(groupId: string) {
  const { data } = await groupService.leave(groupId);
  if (data.value?.code == 200) {
    const index = joinedGroups.value.findIndex((group) => group.id === groupId);
    if (index !== -1) {
      joinedGroups.value.splice(index, 1);
    }
  }
}

await Promise.all([fetchManagedGroup(), fetchJoinedGroup()]);
</script>

<style scoped></style>
