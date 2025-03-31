<template>
  <div>
    <!-- friends request -->
    <div>
      <div class="mx-auto w-full xl:w-9/12">
        <div class="bg-white rounded-md shadow-sm p-5">
          <div class="flex justify-between items-center mb-4">
            <div class="font-semibold text-lg">Lời mời kết bạn</div>
            <NuxtLink
              to="/friends/requests"
              class="text-blue-600 flex items-center hover:underline"
            >
              XEM TẤT CẢ <Icon name="mingcute:right-line"></Icon>
            </NuxtLink>
          </div>

          <div
            v-if="friendRequestData.length"
            class="grid grid-cols-12 lg:grid-cols-12 2xl:grid-cols-15 gap-5"
          >
            <Request
              class="col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-3 xl:col-span-3 2xl:col-span-3"
              :request="request"
              v-for="request in friendRequestData"
              :key="request.id"
              @on-update="fetchFriendListAndRequest"
            ></Request>
          </div>
          <div v-if="!friendRequestData.length">
            <div class="text-center text-gray-500">
              Không có lời mời kết bạn nào
            </div>
          </div>
          <div
            class="flex justify-center mt-4 items-center gap-1 cursor-pointer"
            v-if="hasMoreFriendRequest"
          >
            <span>Xem thêm</span>
            <Icon name="icon-park-solid:down-one" class="text-xl"></Icon>
          </div>
        </div>
      </div>
    </div>
    <!-- friends all -->
    <div class="mt-5">
      <div class="mx-auto w-full xl:w-9/12">
        <div class="bg-white rounded-md shadow-sm p-5">
          <div class="flex justify-between items-center mb-4">
            <div class="font-semibold text-lg">Danh sách bạn bè</div>
            <NuxtLink
              to="/friends/list"
              class="text-blue-600 flex items-center hover:underline"
            >
              XEM TẤT CẢ <Icon name="mingcute:right-line"></Icon>
            </NuxtLink>
          </div>

          <div v-if="friendListData.length" class="grid grid-cols-12 gap-5">
            <div
              class="col-span-12 md:col-span-12 lg:col-span-6 2xl:col-span-4 p-3 border rounded-md flex justify-between items-center"
              v-for="friend in friendListData"
            >
              <div class="flex gap-4">
                <div class="h-[75px] w-[75px] rounded-md">
                  <img
                    :src="friend.profile.avatarUrl || DEFAULT_AVATAR_URL"
                    alt=""
                    class="rounded-md"
                  />
                </div>
                <div>
                  <NuxtLink
                    :to="`/user/${friend.id}`"
                    v-if="friend.profile.name"
                    class="text-lg hover:underline cursor-pointer"
                    >{{ friend.profile.name }}</NuxtLink
                  >
                  <div class="text-sm text-gray-500 mt-1">
                    {{ friend._count?.followers || 0 }} người theo dõi
                  </div>
                </div>
              </div>
              <HeadlessMenu as="div" class="relative inline-block text-left">
                <div>
                  <HeadlessMenuButton
                    class="w-8 h-8 flex justify-center items-center hover:bg-zinc-200 rounded-full transition duration-150 ease-in-out"
                  >
                    <Icon name="tabler:dots" class="text-2xl text-gray-700" />
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
                    class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
                  >
                    <div class="p-2">
                      <HeadlessMenuItem v-slot="{ active }">
                        <NuxtLink
                          :to="`/user/${friend.id}`"
                          :class="[
                            'flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full',
                          ]"
                        >
                          <Icon
                            name="fe:info"
                            class="text-2xl text-gray-600"
                          ></Icon>
                          Xem trang cá nhân
                        </NuxtLink>
                      </HeadlessMenuItem>
                      <HeadlessMenuItem v-slot="{ active }">
                        <div
                          :class="[
                            'flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full',
                          ]"
                          @click="showUnFriendAlert(friend.id)"
                        >
                          <Icon
                            name="material-symbols:delete-outline"
                            class="text-2xl text-gray-600"
                          ></Icon>
                          Huỷ kết bạn
                        </div>
                      </HeadlessMenuItem>
                    </div>
                  </HeadlessMenuItems>
                </transition>
              </HeadlessMenu>
            </div>
          </div>
          <div v-else>Bạn chưa có bạn bè nào</div>

          <div
            v-if="hasMoreFriendList"
            @click="fetchFriendList"
            class="flex justify-center mt-4 items-center gap-1 cursor-pointer"
          >
            <span>Xem thêm</span>
            <Icon name="icon-park-solid:down-one" class="text-xl"></Icon>
          </div>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="visibleUnFriendAlert"
      modal
      :showHeader="false"
      :style="{ width: '25rem' }"
    >
      <div class="flex flex-col items-center w-full gap-4 my-5">
        <Icon
          name="fluent:info-32-regular"
          class="!text-6xl text-primary-500"
        ></Icon>
        <p>Bạn có chắc muốn huỷ kết bạn?</p>
      </div>
      <div class="flex justify-center gap-2">
        <Button
          type="button"
          label="Thôi"
          severity="secondary"
          :outlined="true"
          @click="visibleUnFriendAlert = false"
        ></Button>
        <Button
          type="button"
          severity="danger"
          label="Xoá"
          @click="unFriend()"
        ></Button>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { FriendRequest, User } from "~/types/model";
import Request from "~/components/Friend/Request.vue";
import { DEFAULT_AVATAR_URL } from "~/types/model";

definePageMeta({
  middleware: ["auth"],
});

useHead({
  title: "Bạn bè - TWOK",
});

const toast = useToast();

const friendRequestData = ref<FriendRequest[]>([]);
const hasMoreFriendRequest = ref(false);

const friendListData = ref<User[]>([]);
const hasMoreFriendList = ref(false);
const friendListCursor = ref<string | null>(null);

async function fetchFriendRequest() {
  const { data } = await useAPI<
    ApiResponse<{
      list: FriendRequest[];
      hasMore: boolean;
    }>
  >("/api/friend/friendRequest", {
    method: "GET",
    params: {
      limit: 4,
    },
  });

  if (data.value?.code == 200) {
    friendRequestData.value = data.value.data.list;
    hasMoreFriendRequest.value = data.value.data.hasMore;
  }
}

async function fetchFriendList() {
  const { data } = await useAPI<
    ApiResponse<{
      list: User[];
      hasMore: boolean;
      cursor: string | null;
    }>
  >("/api/friend/friendList", {
    method: "GET",
    params: {
      limit: 4,
      cursor: friendListCursor.value,
    },
  });

  if (data.value?.code == 200) {
    friendListData.value.push(...data.value.data.list);
    hasMoreFriendList.value = data.value.data.hasMore;
    friendListCursor.value = data.value.data.cursor;
  }
}

const selectFriend = ref();
const visibleUnFriendAlert = ref(false);

async function showUnFriendAlert(userId: string) {
  selectFriend.value = userId;
  visibleUnFriendAlert.value = true;
}

async function unFriend() {
  const { data } = await useAPI<ApiResponse>(
    `/api/friend/unfriend/${selectFriend.value}`,
    {
      method: "POST",
    }
  );

  if (data.value?.code == 200) {
    await fetchFriendListAndRequest();
    visibleUnFriendAlert.value = false;
    toast.success(data.value?.message);
  } else {
    toast.error(data.value?.message ?? "Huỷ kết bạn thất bại");
  }
}

async function fetchFriendListAndRequest() {
  await Promise.all([fetchFriendList(), fetchFriendRequest()]);
}

await fetchFriendListAndRequest();
</script>

<style scoped></style>
