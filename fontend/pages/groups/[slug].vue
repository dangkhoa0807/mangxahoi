<template>
  <div>
    <div class="mx-auto w-full xl:w-9/12" v-if="groupStore.currentGroup">
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12">
          <div
            class="bg-white rounded-md shadow-sm overflow-hidden mb-4 last:mb-0"
          >
            <div class="relative">
              <img
                :src="
                  groupStore.currentGroup.bannerUrl ??
                  `https://gcs.tripi.vn/public-tripi/tripi-feed/img/474091cHU/simple-blue-banner_060833462.png`
                "
                alt=""
                srcset=""
                class="w-full max-h-[220px] object-cover"
              />
              <div
                v-if="groupStore.currentGroup.isOwner"
                @click="changeBannerDialog = true"
                class="absolute size-8 rounded-full right-2 bottom-2 bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300"
              >
                <Icon name="bxs:camera" class="size-6"></Icon>
              </div>
            </div>
            <div
              class="flex flex-col lg:flex-row gap-3 lg:gap-0 justify-between items-center p-2 px-3"
            >
              <div class="flex flex-col lg:flex-row gap-3">
                <div class="h-20 lg:h-14 w-40 lg:w-32 relative mx-auto lg:mx-0">
                  <img
                    :src="
                      groupStore.currentGroup.iconUrl ??
                      `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
                    "
                    alt=""
                    srcset=""
                    class="top-[-80px] aspect-square rounded-full shadow-sm absolute"
                  />
                  <div
                    v-if="groupStore.currentGroup.isOwner"
                    @click="changeIconDialog = true"
                    class="absolute size-8 rounded-full right-0 bottom-5 bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300"
                  >
                    <Icon name="bxs:camera" class="size-6"></Icon>
                  </div>
                </div>
                <div class="text-center lg:text-start">
                  <div class="text-lg font-semibold">
                    {{ groupStore.currentGroup.name }}
                  </div>
                  <div
                    class="flex text-gray-600 text-sm gap-2 justify-center lg:justify-start"
                  >
                    <div class="flex items-center gap-1">
                      <div
                        v-if="groupStore.currentGroup.privacy == 'PUBLIC'"
                        class="flex items-center gap-1"
                      >
                        <Icon name="tabler:world" class="text-[12px]"></Icon>
                        <span> Nhóm công khai, </span>
                      </div>
                      <div
                        v-else-if="groupStore.currentGroup.privacy == 'PRIVATE'"
                        class="flex items-center gap-1"
                      >
                        <Icon name="tabler:lock" class="text-[12px]"></Icon>
                        <span>Nhóm riêng tư,</span>
                      </div>
                    </div>
                    <div class="">
                      {{ formatNumber(groupStore.currentGroup._count.members) }}
                      thành viên
                    </div>
                  </div>
                </div>
              </div>
              <div class="lg:mt-0 text-center lg:text-start flex gap-2">
                <nuxt-link
                  :to="`/groups/admin/${route.params.slug}/settings/info`"
                  class="block h-8"
                  v-if="groupStore.currentGroup.isOwner"
                  ><button
                    class="bg-zinc-600 text-white px-3 py-1 rounded-md hover:bg-zinc-700 flex items-center gap-2 mx-auto lg:mx-0 h-full"
                  >
                    <Icon name="tabler:settings-cog"></Icon></button
                ></nuxt-link>
                <div v-else class="flex items-center gap-2">
                  <div
                    v-if="groupStore.currentGroup.hasJoinRequest"
                    class="flex items-center gap-2"
                    @click="
                      groupStore.cancelJoinRequest(groupStore.currentGroup.id)
                    "
                  >
                    <button
                      class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 flex items-center gap-2 mx-auto lg:mx-0"
                    >
                      <Icon name="tabler:users-group"></Icon> Huỷ yêu cầu tham
                      gia
                    </button>
                  </div>

                  <button
                    v-if="
                      !groupStore.currentGroup.isJoined &&
                      !groupStore.currentGroup.hasJoinRequest
                    "
                    @click="groupStore.joinGroup(groupStore.currentGroup.id)"
                    class="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 flex items-center gap-2 mx-auto lg:mx-0"
                  >
                    <Icon name="tabler:users-group"></Icon> Tham gia
                  </button>
                  <button
                    v-if="groupStore.currentGroup.isJoined"
                    @click="groupStore.leaveGroup(groupStore.currentGroup.id)"
                    class="bg-zinc-500 text-white px-3 py-1 rounded-md flex items-center gap-2 mx-auto lg:mx-0 cursor-pointer hover:bg-zinc-600"
                  >
                    <Icon name="tabler:logout"></Icon> Rời nhóm
                  </button>
                </div>
              </div>
            </div>

            <div class="h-[1px] bg-gray-200"></div>

            <Tabs
              :value="router.currentRoute.value.path"
              class="rounded-md overflow-hidden"
            >
              <TabList class="bg-white border-b">
                <Tab
                  :value="`/groups/${route.params.slug}`"
                  class="tab-item text-gray-700"
                  :pt="{
                    root: 'p-0',
                  }"
                >
                  <router-link
                    v-slot="{ href, navigate }"
                    :to="`/groups/${route.params.slug}`"
                    custom
                  >
                    <a
                      v-ripple
                      :href="href"
                      @click="navigate"
                      class="flex items-center gap-2 text-inherit p-4"
                    >
                      Bài viết
                    </a>
                  </router-link>
                </Tab>
                <Tab
                  :value="`/groups/${route.params.slug}/about`"
                  class="tab-item text-gray-700"
                  :pt="{
                    root: 'p-0',
                  }"
                >
                  <router-link
                    v-slot="{ href, navigate }"
                    :to="`/groups/${route.params.slug}/about`"
                    custom
                  >
                    <a
                      v-ripple
                      :href="href"
                      @click="navigate"
                      class="flex items-center gap-2 text-inherit p-4"
                    >
                      Giới thiệu
                    </a>
                  </router-link>
                </Tab>
                <Tab
                  :value="`/groups/${route.params.slug}/members`"
                  class="tab-item text-gray-700"
                  :pt="{
                    root: 'p-0',
                  }"
                >
                  <router-link
                    v-slot="{ href, navigate }"
                    :to="`/groups/${route.params.slug}/members`"
                    custom
                  >
                    <a
                      v-ripple
                      :href="href"
                      @click="navigate"
                      class="flex items-center gap-2 text-inherit p-4"
                    >
                      Thành viên
                    </a>
                  </router-link>
                </Tab>
              </TabList>
            </Tabs>
          </div>

          <NuxtPage></NuxtPage>
        </div>
      </div>

      <!-- Dialog -->
      <ChangeBanner
        v-model="changeBannerDialog"
        :group-id="groupStore.currentGroup.id"
        @updated="groupStore.fetchGroup(route.params.slug as string)"
      ></ChangeBanner>
      <ChangeIcon
        v-model="changeIconDialog"
        :group-id="groupStore.currentGroup.id"
        @updated="groupStore.fetchGroup(route.params.slug as string)"
      ></ChangeIcon>
    </div>
    <div v-else class="text-center mt-10">{{ groupStore.message }}</div>
  </div>
</template>

<script setup lang="ts">
import ChangeIcon from "~/components/Dialog/Group/ChangeIcon.vue";
import ChangeBanner from "~/components/Dialog/Group/ChangeBanner.vue";
import { formatNumber } from "~/utils/formatNumber";

const changeBannerDialog = ref(false);
const changeIconDialog = ref(false);

const route = useRoute();
const router = useRouter();

const groupStore = useGroupStore();

await groupStore.fetchGroup(route.params.slug as string);
</script>

<style scoped>
.p-0 {
  padding: 0 !important;
}
</style>
