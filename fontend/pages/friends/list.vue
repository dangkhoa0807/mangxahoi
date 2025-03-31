<template>
  <div>
    <div class="mx-auto w-full xl:w-9/12">
      <div class="bg-white rounded-md shadow-sm p-5">
        <div class="font-semibold text-lg mb-4">Tất cả bạn bè</div>

        <!-- Search bar -->
        <div class="flex items-center mb-4">
          <InputText
            v-model="searchQuery"
            placeholder="Tìm kiếm bạn bè..."
            class="w-full rounded-3xl"
          />
        </div>

        <div v-if="!friends.length" class="text-center text-gray-500">
          Bạn chưa có bạn bè nào
        </div>

        <!-- Friends grid -->
        <div class="grid grid-cols-12 gap-5">
          <div
            v-for="friend in friends"
            :key="friend.id"
            class="col-span-12 md:col-span-12 lg:col-span-6 2xl:col-span-4 p-3 border rounded-md flex justify-between items-center"
          >
            <div class="flex gap-4">
              <div class="h-[75px] w-[75px] rounded-md">
                <img
                  :src="
                    friend.profile.avatarUrl ||
                    'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
                  "
                  alt=""
                  class="rounded-md w-full h-full object-cover"
                />
              </div>
              <div>
                <NuxtLink
                  :to="`/user/${friend.id}`"
                  class="text-lg hover:underline cursor-pointer block"
                >
                  {{ friend.profile.name }}
                </NuxtLink>
                <div class="text-sm text-gray-500 mt-1">
                  {{ friend._count?.followers || 0 }} người theo dõi
                </div>
              </div>
            </div>

            <HeadlessMenu as="div" class="relative inline-block text-left">
              <HeadlessMenuButton
                class="w-8 h-8 flex justify-center items-center hover:bg-gray-100 rounded-full"
              >
                <Icon name="tabler:dots" class="text-2xl text-gray-700" />
              </HeadlessMenuButton>

              <transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <HeadlessMenuItems
                  class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                >
                  <div class="px-1 py-1">
                    <HeadlessMenuItem v-slot="{ active }">
                      <NuxtLink
                        :to="`/user/${friend.id}`"
                        class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
                      >
                        <Icon name="fe:info" class="text-2xl text-gray-600" />
                        Xem trang cá nhân
                      </NuxtLink>
                    </HeadlessMenuItem>
                    <HeadlessMenuItem v-slot="{ active }">
                      <div
                        class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
                        @click="showUnfriendConfirm(friend)"
                      >
                        <Icon
                          name="material-symbols:delete-outline"
                          class="text-2xl text-gray-600"
                        />
                        Huỷ kết bạn
                      </div>
                    </HeadlessMenuItem>
                  </div>
                </HeadlessMenuItems>
              </transition>
            </HeadlessMenu>
          </div>
        </div>

        <!-- Load more button -->
        <div v-if="hasMore" class="flex justify-center mt-4">
          <Button
            @click="loadMore"
            label="Xem thêm"
            severity="secondary"
            :loading="isLoading"
          />
        </div>
      </div>
    </div>

    <!-- Unfriend confirmation dialog -->
    <Dialog
      v-model:visible="showUnfriendDialog"
      modal
      :showHeader="false"
      :style="{ width: '25rem' }"
    >
      <div class="flex flex-col items-center w-full gap-4 my-5">
        <Icon
          name="fluent:info-32-regular"
          class="!text-6xl text-primary-500"
        />
        <p>
          Bạn có chắc muốn huỷ kết bạn với {{ selectedFriend?.profile.name }}?
        </p>
      </div>
      <div class="flex justify-center gap-2">
        <Button
          label="Thôi"
          severity="secondary"
          :outlined="true"
          @click="showUnfriendDialog = false"
        />
        <Button
          label="Xoá"
          severity="danger"
          @click="unfriend"
          :loading="isUnfriending"
        />
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { User } from "~/types/model";

definePageMeta({
  middleware: ["auth"],
});

const toast = useToast();

const friends = ref<User[]>([]);
const cursor = ref<string | null>(null);
const hasMore = ref(false);
const isLoading = ref(false);
const searchQuery = ref("");

const showUnfriendDialog = ref(false);
const selectedFriend = ref<User | null>(null);
const isUnfriending = ref(false);

const limit = 8;

// Tạo debounced version của fetchFriends
const debouncedFetch = useDebounce(async (reset: boolean) => {
  await fetchFriends(reset);
}, 300);

// Lấy danh sách bạn bè
async function fetchFriends(reset = false) {
  if (isLoading.value) return;
  isLoading.value = true;

  try {
    const { data } = await useAPI<
      ApiResponse<{
        list: User[];
        hasMore: boolean;
        cursor: string | null;
      }>
    >("/api/friend/friendList", {
      params: {
        cursor: cursor.value,
        limit: limit,
        search: searchQuery.value,
      },
    });

    if (data.value?.code === 200) {
      if (reset) {
        friends.value = data.value.data.list;
      } else {
        friends.value.push(...data.value.data.list);
      }
      hasMore.value = data.value.data.hasMore;
      cursor.value = data.value.data.cursor;
    }
  } catch (error) {
    toast.error("Có lỗi xảy ra khi tải danh sách bạn bè");
  } finally {
    isLoading.value = false;
  }
}

// Load more
async function loadMore() {
  await fetchFriends();
}

// Show unfriend confirmation
function showUnfriendConfirm(friend: User) {
  selectedFriend.value = friend;
  showUnfriendDialog.value = true;
}

// Unfriend user
async function unfriend() {
  if (!selectedFriend.value || isUnfriending.value) return;

  isUnfriending.value = true;

  try {
    const { data } = await useAPI<ApiResponse>(
      `/api/friend/unfriend/${selectedFriend.value.id}`,
      {
        method: "POST",
      }
    );

    if (data.value?.code === 200) {
      toast.success(data.value.message);
      friends.value = friends.value.filter(
        (f) => f.id !== selectedFriend.value?.id
      );
      showUnfriendDialog.value = false;
    } else {
      toast.error(data.value?.message || "Huỷ kết bạn thất bại");
    }
  } catch (error) {
    toast.error("Có lỗi xảy ra khi huỷ kết bạn");
  } finally {
    isUnfriending.value = false;
  }
}

// Watch for search query changes with debounce
watch(searchQuery, async () => {
  cursor.value = null;
  await debouncedFetch(true);
});

// Initial fetch
await fetchFriends(true);
</script>

<style></style>
