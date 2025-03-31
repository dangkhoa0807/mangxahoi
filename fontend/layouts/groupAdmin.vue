<template>
  <div>
    <NuxtLayout name="default">
      <div class="mx-auto w-full 2xl:w-10/12 px-4">
        <div class="mt-4">
          <div class="text-3xl font-semibold mb-2">Quản lý nhóm</div>
          <hr />

          <div class="grid grid-cols-12 gap-4 mt-4 text-base">
            <div class="col-span-12 lg:col-span-4 xl:col-span-3">
              <div
                class="bg-white rounded-md p-4 shadow-sm flex items-center gap-2 mb-4"
                v-if="groupStore.currentGroup"
              >
                <div
                  class="h-11 w-11 bg-gray-200 rounded-md border border-gray-300"
                >
                  <img
                    :src="groupStore.currentGroup.iconUrl ?? DEFAULT_AVATAR_URL"
                    alt="avatar"
                    class="w-full h-full object-cover rounded-md"
                  />
                </div>
                <div>
                  <NuxtLink
                    :to="`/groups/${route.params.slug}`"
                    class="text-md truncate hover:text-blue-600"
                  >
                    {{ groupStore.currentGroup.name }}
                  </NuxtLink>
                  <div class="text-sm text-gray-500">
                    {{ formatNumber(groupStore.currentGroup._count.members) }}
                    thành viên
                  </div>
                </div>
              </div>

              <div
                class="bg-white rounded-md p-4 shadow-sm flex flex-col gap-1"
              >
                <NuxtLink
                  :to="`/groups/admin/${route.params.slug}/settings/info`"
                  exactActiveClass="text-blue-600 bg-blue-600/20"
                  class="flex gap-3 items-center text-md cursor-pointer hover:bg-blue-500/20 p-2 px-3 hover:text-blue-600 rounded-md"
                >
                  <Icon name="tabler:info-hexagon"></Icon>
                  <div>Thông tin nhóm</div>
                </NuxtLink>

                <NuxtLink
                  v-if="groupStore.currentGroup?.privacy === 'PRIVATE'"
                  :to="`/groups/admin/${route.params.slug}/settings/join-requests`"
                  exactActiveClass="text-blue-600 bg-blue-600/20"
                  class="flex gap-3 items-center text-md cursor-pointer hover:bg-blue-500/20 p-2 px-3 hover:text-blue-600 rounded-md"
                >
                  <Icon name="tabler:users-plus"></Icon>
                  <div>Yêu cầu tham gia</div>
                </NuxtLink>

                <NuxtLink
                  :to="`/groups/admin/${route.params.slug}/settings/blocked`"
                  exactActiveClass="text-blue-600 bg-blue-600/20"
                  class="flex gap-3 items-center text-md cursor-pointer hover:bg-blue-500/20 hover:text-blue-600 p-2 px-3 rounded-md"
                >
                  <Icon name="tabler:flag-cog"></Icon>
                  <div>Chặn người dùng</div>
                </NuxtLink>
              </div>
            </div>
            <div class="col-span-12 lg:col-span-8 xl:col-span-9">
              <NuxtPage></NuxtPage>
            </div>
          </div>
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>
<script lang="ts" setup>
import { DEFAULT_AVATAR_URL } from "~/types/model";
import { formatNumber } from "~/utils/formatNumber";

const route = useRoute();
const groupStore = useGroupStore();
</script>
