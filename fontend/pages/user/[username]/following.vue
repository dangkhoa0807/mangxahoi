<template>
  <div class="col-span-12">
    <div class="bg-white rounded-md shadow-sm p-5">
      <div class="flex items-center mb-4">
        <InputText
          v-model="searchQuery"
          placeholder="Tìm kiếm người đang theo dõi..."
          class="w-full rounded-3xl"
        />
      </div>

      <hr />

      <!-- Following List -->
      <div class="grid grid-cols-12 gap-5 mt-4">
        <div v-if="!following.length" class="col-span-12">
          Không có thông tin.
        </div>

        <div
          v-for="follow in following"
          :key="follow.id"
          class="col-span-12 sm:col-span-4 md:col-span-6 lg:col-span-3 2xl:col-span-2 border rounded-lg overflow-hidden shadow-sm"
        >
          <img
            :src="
              follow.profile.avatarUrl ||
              'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
            "
            :alt="follow.profile.name"
            class="w-full aspect-square object-cover"
          />
          <div class="p-3">
            <NuxtLink
              :to="`/user/${follow.id}`"
              class="font-medium text-lg hover:underline block truncate"
            >
              {{ follow.profile.name }}
            </NuxtLink>
            <div class="text-sm text-gray-500 mt-1">
              {{ follow._count?.followers || 0 }} người theo dõi
            </div>
            <div class="flex gap-2 mt-3">
              <button
                v-if="follow.isFollowing"
                @click="unfollowUser(follow.id)"
                class="w-full bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2 justify-center truncate"
              >
                <Icon name="tabler:user-check" />
                Đang theo dõi
              </button>
              <button
                v-else
                @click="followUser(follow.id)"
                class="w-full bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 justify-center truncate"
              >
                <Icon name="tabler:user-plus" />
                Theo dõi
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More Button -->
      <button
        v-if="hasMore"
        @click="loadMore"
        class="mt-4 w-full px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
      >
        Tải thêm
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { User } from "~/types/model";

const route = useRoute();
const toast = useToast();

const following = ref<User[]>([]);
const currentPage = ref(1);
const hasMore = ref(false);
const searchQuery = ref("");

// Fetch following list
async function fetchFollowing(page = 1, reset = false) {
  const { data } = await useAPI<
    ApiResponse<{
      list: User[];
      hasMore: boolean;
    }>
  >(`/api/user/${route.params.username}/following`, {
    params: {
      page,
      search: searchQuery.value,
    },
  });

  if (data.value?.code === 200) {
    if (reset) {
      following.value = data.value.data.list;
    } else {
      following.value.push(...data.value.data.list);
    }
    hasMore.value = data.value.data.hasMore;
  }
}

// Load more
async function loadMore() {
  currentPage.value++;
  await fetchFollowing(currentPage.value);
}

// Follow/Unfollow functions
async function followUser(userId: string) {
  const { data } = await useAPI<ApiResponse>(`/api/follow/${userId}`, {
    method: "POST",
  });

  if (data.value?.code === 200) {
    toast.success(data.value.message);
    await fetchFollowing(currentPage.value, true);
  } else {
    toast.error(data.value?.message || "Theo dõi thất bại");
  }
}

async function unfollowUser(userId: string) {
  const { data } = await useAPI<ApiResponse>(`/api/follow/${userId}`, {
    method: "DELETE",
  });

  if (data.value?.code === 200) {
    toast.success(data.value.message);
    const userIndex = following.value.findIndex((user) => user.id === userId);
    if (userIndex !== -1) {
      following.value[userIndex].isFollowing = false;
    }
  } else {
    toast.error(data.value?.message || "Huỷ theo dõi thất bại");
  }
}

// Watch for search query changes
watch(searchQuery, async () => {
  currentPage.value = 1;
  await fetchFollowing(1, true);
});

// Initial fetch
await fetchFollowing();
</script>
