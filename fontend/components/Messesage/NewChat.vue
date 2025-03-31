<template>
  <div>
    <Dialog
      v-model:visible="chatStore.showNewChatDialog"
      modal
      :show-header="false"
      :pt="{
        root: 'pt-4',
        content: 'pb-4',
      }"
      :style="{ width: '32rem' }"
      @show="fetchFriends(true)"
    >
      <div
        class="flex justify-between items-center sticky top-0 bg-white pb-3 z-20 border-b"
      >
        <div class="text-xl text-gray-800">Tạo trò chuyện</div>
        <div class="flex items-center gap-4">
          <div
            class="hover:bg-gray-100 rounded-full transition duration-150 ease-in-out cursor-pointer w-7 h-7 flex items-center justify-center"
            @click="chatStore.showNewChatDialog = false"
          >
            <Icon name="tabler:x" class="text-2xl"></Icon>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <InputGroup class="px-2">
          <InputGroupAddon>
            <Icon name="tabler:search" class="w-6 h-6"></Icon>
          </InputGroupAddon>
          <InputText
            v-model="searchQuery"
            placeholder="Tìm bạn bè"
            class="w-full border border-gray-300 rounded-3xl p-2 px-3 outline-none shadow-sm focus:border-gray-500 transition duration-300 ease-in-out"
          />
        </InputGroup>

        <div
          class="flex flex-col mt-4 max-h-[60vh] overflow-y-auto"
          @scroll="onScroll"
        >
          <div
            class="p-2 hover:bg-zinc-100 flex justify-between items-center cursor-pointer"
            v-for="friend in friends"
            :key="friend.id"
          >
            <div class="flex gap-4">
              <img
                :src="
                  friend.profile.avatarUrl ||
                  'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
                "
                class="w-12 h-12 rounded-md"
                alt="User Avatar"
              />
              <div class="pt-1">
                <div class="text-base text-gray-800">
                  {{ friend.profile.name }}
                </div>
                <div class="text-sm text-gray-700">@{{ friend.id }}</div>
              </div>
            </div>
            <div
              class="cursor-pointer border rounded-lg p-2 hover:bg-blue-500/30 hover:text-blue-700 hover:border-blue-100 transition duration-300 ease-in-out"
              aria-label="Xem thêm"
            >
              <div class="w-5 h-5" @click="createConversation(friend.id)">
                <Icon name="tabler:message-plus" class="text-xl"></Icon>
              </div>
            </div>
          </div>

          <div v-if="isLoading" class="flex justify-center p-4">
            <Icon
              name="eos-icons:loading"
              class="animate-spin text-2xl text-gray-500"
            />
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { Conversation, User } from "~/types/model";

const chatStore = useChatStore();
const auth = useAuth();
const router = useRouter();

const friends = ref<User[]>([]);
const hasMore = ref(false);
const currentPage = ref(1);
const searchQuery = ref();
const isLoading = ref(false);

async function fetchFriends(reset = true) {
  if (isLoading.value) return;
  isLoading.value = true;

  if (reset) {
    currentPage.value = 1;
    friends.value = [];
  }

  try {
    const { data } = await useAPI<
      ApiResponse<{
        list: User[];
        hasMore: boolean;
      }>
    >(`/api/friend/friendList`, {
      method: "GET",
      params: {
        search: searchQuery.value,
        page: currentPage.value,
        pageSize: 10,
      },
    });

    if (data.value?.code == 200) {
      friends.value = reset
        ? data.value.data.list
        : [...friends.value, ...data.value.data.list];
      hasMore.value = data.value.data.hasMore;
    }
  } catch (error) {
    console.error("Error fetching friends:", error);
  } finally {
    isLoading.value = false;
  }
}
const debouncedFetchFriends = useDebounce(fetchFriends, 300);

async function createConversation(userId: string) {
  const { data } = await useAPI<ApiResponse<Conversation>>(
    "/api/conversations",
    {
      method: "POST",
      body: {
        userId: userId,
      },
    }
  );

  if (data.value?.code == 200) {
    router.push(`/conversations/${data.value.data.id}`);
    chatStore.showNewChatDialog = false;
  }
}

watch(searchQuery, () => {
  debouncedFetchFriends();
});

function onScroll(event: Event) {
  const target = event.target as HTMLElement;
  const isAtBottom =
    target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

  if (isAtBottom && hasMore.value && !isLoading.value) {
    currentPage.value++;
    fetchFriends();
  }
}
</script>

<style scoped></style>
