<template>
  <div>
    <div class="mx-auto w-full xl:w-9/12 my-5">
      <div class="bg-white rounded-md p-3 shadow-sm">
        <div class="font-semibold text-lg">Bạn bè đề xuất</div>
      </div>
    </div>
    <div class="mx-auto w-full xl:w-9/12">
      <div class="bg-white rounded-md shadow-sm p-5">
        <!-- Search bar -->
        <div class="flex items-center mb-4">
          <InputText
            v-model="searchQuery"
            placeholder="Tìm kiếm người dùng..."
            class="w-full max-w-[350px] rounded-3xl"
          />
        </div>

        <div v-if="!suggestions.length" class="text-center text-gray-500">
          Không có đề xuất nào.
        </div>

        <!-- Grid layout for suggestions -->
        <div class="grid grid-cols-12 gap-5">
          <div
            v-for="user in suggestions"
            :key="user.id"
            class="col-span-6 md:col-span-3 sm:col-span-4 border rounded-lg overflow-hidden shadow-sm"
          >
            <img
              :src="
                user.profile.avatarUrl ||
                'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
              "
              :alt="user.profile.name"
              class="w-full aspect-square object-cover"
            />
            <div class="p-3">
              <NuxtLink
                :to="`/user/${user.id}`"
                class="font-medium overflow-hidden truncate whitespace-nowrap hover:underline block"
              >
                {{ user.profile.name }}
              </NuxtLink>
              <div class="text-sm text-gray-500 mt-1">
                {{ user._count?.followers || 0 }} người theo dõi
              </div>
              <div class="flex flex-col gap-2 mt-3">
                <Button
                  v-if="!user.hasSentRequest"
                  @click="addFriend(user.id)"
                  label="Thêm bạn bè"
                  severity="info"
                  raised
                ></Button>
                <Button
                  v-else
                  label="Đã gửi lời mời"
                  severity="secondary"
                  raised
                  disabled
                ></Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Load more button -->
        <div v-if="hasMore" class="flex justify-center mt-4">
          <Button
            @click="loadMore"
            label="Xem thêm"
            severity="secondary"
            :loading="isLoading"
          ></Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { User } from "~/types/model";

const toast = useToast();

const suggestions = ref<User[]>([]);
const currentPage = ref(1);
const hasMore = ref(false);
const isLoading = ref(false);
const searchQuery = ref("");

// Fetch suggestions
async function fetchSuggestions(page = 1, reset = false) {
  if (isLoading.value) return;

  isLoading.value = true;

  const { data } = await useAPI<
    ApiResponse<{
      list: User[];
      hasMore: boolean;
    }>
  >("/api/friend/suggestions", {
    params: {
      page,
      search: searchQuery.value,
    },
  });

  isLoading.value = false;

  if (data.value?.code === 200) {
    if (reset) {
      suggestions.value = data.value.data.list;
    } else {
      suggestions.value.push(...data.value.data.list);
    }
    hasMore.value = data.value.data.hasMore;
  }
}

// Load more
async function loadMore() {
  currentPage.value++;
  await fetchSuggestions(currentPage.value);
}

// Add friend
async function addFriend(userId: string) {
  const { data } = await useAPI<ApiResponse>(`/api/friend/add/${userId}`, {
    method: "POST",
  });

  if (data.value?.code == 200) {
    toast.success(data.value.message);
    // Refresh the suggestions list
    await fetchSuggestions(currentPage.value, true);
  } else {
    toast.error(data.value?.message || "Gửi lời mời kết bạn thất bại");
  }
}

// Watch for search query changes
watch(searchQuery, async () => {
  currentPage.value = 1;
  await fetchSuggestions(1, true);
});

// Initial fetch
await fetchSuggestions();
</script>

<style></style>
