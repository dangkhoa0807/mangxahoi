<template>
  <div>
    <div v-if="user">
      <div class="mx-auto w-full xl:w-9/12">
        <div class="grid grid-cols-12 gap-4">
          <!-- Main Content Section -->
          <div class="col-span-12">
            <div class="bg-white rounded-md shadow-sm mb-4 last:mb-0">
              <div class="relative">
                <img
                  :src="
                    user.profile.bannerUrl ||
                    'https://cdn1.epicgames.com/ue/product/Screenshot/Screenshot23-1920x1080-a2f8a3c1f88f3b5716bdd8c9a2ea0c28.jpg?resize=1&w=1920'
                  "
                  alt=""
                  class="w-full max-h-[220px] object-cover"
                />
                <div
                  v-if="auth.user && user.id == auth.user.id"
                  @click="showBannerDialog = true"
                  class="absolute size-8 rounded-full right-2 bottom-2 bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300"
                >
                  <Icon name="bxs:camera" class="size-6"></Icon>
                </div>
              </div>
              <div
                class="flex flex-col lg:flex-row gap-3 lg:gap-0 justify-between items-center p-2 px-3"
              >
                <div class="flex flex-col lg:flex-row gap-2 lg:gap-3">
                  <div
                    class="h-20 lg:h-14 w-40 lg:w-32 relative mx-auto lg:mx-0"
                  >
                    <img
                      :src="
                        user.profile.avatarUrl ||
                        'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
                      "
                      alt=""
                      class="top-[-80px] aspect-square rounded-full shadow-sm absolute"
                    />
                    <div
                      v-if="auth.user && user.id == auth.user.id"
                      @click="showAvatarDialog = true"
                      class="absolute size-8 rounded-full right-0 bottom-5 bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300"
                    >
                      <Icon name="bxs:camera" class="size-6"></Icon>
                    </div>
                  </div>
                  <div class="text-center lg:text-start">
                    <div class="text-center lg:text-start">
                      <div class="text-lg font-semibold">
                        {{ user.profile.name }}
                      </div>
                      <div class="text-sm text-gray-600">
                        {{ user._count?.followers || 0 }} người theo dõi •
                        {{ user._count?.following || 0 }} đang theo dõi
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="user.hasBlocked">
                  <button
                    @click="unblockUser(user.id)"
                    class="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                  >
                    <Icon name="tabler:ban"></Icon> Bỏ chặn
                  </button>
                </div>
                <div v-else-if="auth.user && user.id !== auth.user.id">
                  <!-- Message button -->
                  <div class="flex gap-2">
                    <button
                      v-if="user.canMessage"
                      @click="startConversation(user.id)"
                      class="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                    >
                      <Icon name="tabler:message"></Icon> Nhắn tin
                    </button>

                    <!-- Existing friend buttons -->
                    <HeadlessMenu
                      as="div"
                      class="relative inline-block text-left"
                      v-if="user.isFriend"
                    >
                      <div>
                        <HeadlessMenuButton
                          class="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                        >
                          <Icon name="tabler:user-check"></Icon> Bạn bè
                          <Icon name="tabler:chevron-down"></Icon>
                        </HeadlessMenuButton>
                      </div>

                      <transition
                        enter-active-class="transition duration-100 ease-out"
                        enter-from-class="transform scale-95 opacity-0"
                        enter-to-class="transform scale-100 opacity-100"
                        leave-active-class="transition duration-75 ease-in"
                        leave-from-class="transform scale-100 opacity-100"
                        leave-to-class="transform scale-95 opacity-0"
                      >
                        <HeadlessMenuItems
                          class="absolute right-0 z-30 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
                        >
                          <div class="p-2">
                            <HeadlessMenuItem v-slot="{ active }">
                              <div
                                class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
                                @click="unfriend(user.id)"
                              >
                                <Icon
                                  name="tabler:user-x"
                                  class="text-2xl text-gray-600"
                                ></Icon>
                                Huỷ kết bạn
                              </div>
                            </HeadlessMenuItem>
                            <HeadlessMenuItem v-slot="{ active }">
                              <div
                                v-if="
                                  auth.user &&
                                  user.id !== auth.user.id &&
                                  !user.isFollowing
                                "
                                @click="followUser(user.id)"
                                class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
                              >
                                <Icon
                                  name="tabler:user-plus"
                                  class="text-2xl text-gray-600"
                                ></Icon>
                                Theo dõi
                              </div>
                              <div
                                v-else-if="
                                  auth.user &&
                                  user.id !== auth.user.id &&
                                  user.isFollowing
                                "
                                @click="unfollowUser(user.id)"
                                class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
                              >
                                <Icon
                                  name="tabler:user-check"
                                  class="text-2xl text-gray-600"
                                ></Icon>
                                Đang theo dõi
                              </div>
                            </HeadlessMenuItem>
                          </div>
                        </HeadlessMenuItems>
                      </transition>
                    </HeadlessMenu>

                    <!-- Pending friend request sent by current user -->
                    <button
                      v-else-if="user.hasSentRequest"
                      class="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                      @click="cancelFriendRequest(user.id)"
                    >
                      <Icon name="tabler:clock"></Icon> Đã gửi lời mời
                    </button>

                    <!-- Pending friend request received from this user -->
                    <button
                      v-else-if="user.hasReceivedRequest"
                      @click="acceptFriend(user.id)"
                      class="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                    >
                      <Icon name="tabler:user-plus"></Icon> Xác nhận
                    </button>

                    <!-- No relationship - can send friend request -->
                    <button
                      v-else
                      @click="addFriend(user.id)"
                      class="bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                    >
                      <Icon name="tabler:user-plus"></Icon> Kết bạn
                    </button>

                    <!-- Block user -->
                    <HeadlessMenu
                      as="div"
                      class="relative inline-block text-left"
                    >
                      <div class="h-full">
                        <HeadlessMenuButton
                          class="bg-gray-200 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-300 flex items-center gap-2 h-full"
                        >
                          <Icon name="tabler:dots-vertical"></Icon>
                        </HeadlessMenuButton>
                      </div>

                      <transition
                        enter-active-class="transition duration-100 ease-out"
                        enter-from-class="transform scale-95 opacity-0"
                        enter-to-class="transform scale-100 opacity-100"
                        leave-active-class="transition duration-75 ease-in"
                        leave-from-class="transform scale-100 opacity-100"
                        leave-to-class="transform scale-95 opacity-0"
                      >
                        <HeadlessMenuItems
                          class="absolute right-0 z-30 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
                        >
                          <div class="p-2">
                            <HeadlessMenuItem v-slot="{ active }">
                              <div
                                class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full text-red-600"
                                @click="showBlockDialog = true"
                              >
                                <Icon name="tabler:ban" class="text-2xl"></Icon>
                                Chặn người dùng
                              </div>
                            </HeadlessMenuItem>
                          </div>
                        </HeadlessMenuItems>
                      </transition>
                    </HeadlessMenu>
                  </div>
                </div>

                <!-- New button for the user's own profile -->
                <div v-else-if="auth.user && user.id === auth.user.id">
                  <button
                    @click="router.push('/settings/profile')"
                    class="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                  >
                    <Icon name="tabler:edit"></Icon> Chỉnh sửa
                  </button>
                </div>
              </div>

              <div class="h-[1px] bg-gray-200"></div>
              <Tabs
                :value="router.currentRoute.value.path"
                class="rounded-md overflow-hidden"
              >
                <TabList class="bg-white border-b">
                  <Tab
                    :value="`/user/${route.params.username}`"
                    class="tab-item text-gray-700"
                    :pt="{
                      root: 'p-0',
                    }"
                  >
                    <router-link
                      v-slot="{ href, navigate }"
                      :to="`/user/${route.params.username}`"
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
                    :value="`/user/${route.params.username}/image`"
                    class="tab-item text-gray-700"
                    :pt="{
                      root: 'p-0',
                    }"
                  >
                    <router-link
                      v-slot="{ href, navigate }"
                      :to="`/user/${route.params.username}/image`"
                      custom
                    >
                      <a
                        v-ripple
                        :href="href"
                        @click="navigate"
                        class="flex items-center gap-2 text-inherit p-4"
                      >
                        Ảnh
                      </a>
                    </router-link>
                  </Tab>
                  <Tab
                    v-if="user.isShowFollowing"
                    :value="`/user/${route.params.username}/following`"
                    class="tab-item text-gray-700"
                    :pt="{
                      root: 'p-0',
                    }"
                  >
                    <router-link
                      v-slot="{ href, navigate }"
                      :to="`/user/${route.params.username}/following`"
                      custom
                    >
                      <a
                        v-ripple
                        :href="href"
                        @click="navigate"
                        class="flex items-center gap-2 text-inherit p-4"
                      >
                        Đang theo dõi
                      </a>
                    </router-link>
                  </Tab>
                </TabList>
              </Tabs>
            </div>
          </div>

          <!-- Sidebar Section -->
          <NuxtPage class="col-span-12"></NuxtPage>
        </div>
      </div>
    </div>
    <div v-else class="mx-auto w-full xl:w-9/12">{{ message }}</div>

    <ChangeAvatar v-model="showAvatarDialog" @changed="fetchUser" />
    <ChangeBanner v-model="showBannerDialog" @changed="fetchUser" />
    <BlockUser
      v-model="showBlockDialog"
      :userId="user?.id ?? ''"
      @blocked="fetchUser"
    />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { Conversation, User } from "~/types/model";
import BlockUser from "~/components/Dialog/BlockUser.vue";
import ChangeAvatar from "~/components/Dialog/ChangeAvatar.vue";
import ChangeBanner from "~/components/Dialog/ChangeBanner.vue";

const router = useRouter();
const route = useRoute();

const showAvatarDialog = ref(false);
const showBannerDialog = ref(false);
const showBlockDialog = ref(false);

const user = ref<User>();
const message = ref("");

provide("user", user);

async function fetchUser() {
  const { data } = await useAPI<
    ApiResponse<
      User & {
        isFriend: boolean;
        hasSentRequest: boolean;
        hasReceivedRequest: boolean;
        isFollowing: boolean;
        _count: {
          followers: number;
          following: number;
        };
      }
    >
  >(`/api/user/${route.params.username}`);

  if (data.value?.code == 200) {
    user.value = data.value.data;
  } else {
    message.value = data.value?.message || "Không tìm thấy người dùng";
  }
}

await Promise.all([fetchUser()]);

const auth = useAuth();

const toast = useToast();

async function addFriend(userId: string) {
  const { data } = await useAPI<ApiResponse>(`/api/friend/add/${userId}`, {
    method: "POST",
  });

  if (data.value?.code == 200) {
    toast.success(data.value.message);
    await fetchUser(); // Refresh user data to update status
  } else {
    toast.error(data.value?.message || "Gửi lời mời kết bạn thất bại");
  }
}

async function cancelFriendRequest(userId: string) {
  const { data: response } = await useAPI<ApiResponse>(
    `/api/friend/cancel/${userId}`,
    {
      method: "POST",
    }
  );

  if (response.value?.code == 200) {
    toast.success(response.value.message);
    await fetchUser();
  } else {
    toast.error(response.value?.message || "Huỷ yêu cầu kết bạn thất bại");
  }
}

async function acceptFriend(userId: string) {
  const { data } = await useAPI<ApiResponse>(`/api/friend/accept/${userId}`, {
    method: "POST",
  });

  if (data.value?.code == 200) {
    toast.success(data.value.message);
    await fetchUser(); // Refresh user data to update status
  } else {
    toast.error(data.value?.message || "Chấp nhận lời mời kết bạn thất bại");
  }
}

async function startConversation(userId: string) {
  const { data } = await useAPI<ApiResponse<Conversation>>(
    "/api/conversations",
    {
      method: "POST",
      body: {
        userId: userId,
      },
    }
  );

  if (data.value?.code === 200) {
    router.push(`/conversations/${data.value.data.id}`);
  }
}

async function unfriend(userId: string) {
  const { data } = await useAPI<ApiResponse>(`/api/friend/unfriend/${userId}`, {
    method: "POST",
  });

  if (data.value?.code == 200) {
    toast.success(data.value.message);
    await fetchUser(); // Refresh user data to update status
  } else {
    toast.error(data.value?.message || "Huỷ kết bạn thất bại");
  }
}

async function followUser(userId: string) {
  const { data } = await useAPI<ApiResponse>(`/api/follow/${userId}`, {
    method: "POST",
  });

  if (data.value?.code == 200) {
    toast.success(data.value.message);
    await fetchUser(); // Refresh user data to update follow status
  } else {
    toast.error(data.value?.message || "Theo dõi thất bại");
  }
}

async function unfollowUser(userId: string) {
  const { data } = await useAPI<ApiResponse>(`/api/follow/${userId}`, {
    method: "DELETE",
  });

  if (data.value?.code == 200) {
    toast.success(data.value.message);
    await fetchUser(); // Refresh user data to update follow status
  } else {
    toast.error(data.value?.message || "Huỷ theo dõi thất bại");
  }
}

async function unblockUser(userId: string) {
  const { data } = await useAPI<ApiResponse>(`/api/block/${userId}`, {
    method: "DELETE",
  });

  if (data.value?.code == 200) {
    toast.success(data.value.message);
    await fetchUser();
  } else {
    toast.error(data.value?.message || "Bỏ chặn thất bại");
  }
}
</script>

<style scoped>
.p-0 {
  padding: 0 !important;
}
</style>
