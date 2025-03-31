<template>
  <div>
    <div class="bg-white rounded-md shadow-sm p-5">
      <div class="flex justify-between items-center">
        <h2 class="font-semibold text-2xl mb-1">Yêu cầu tham gia nhóm</h2>
      </div>

      <hr class="mb-4" />

      <!-- Search input -->
      <div class="mb-4">
        <InputText
          v-model="searchQuery"
          placeholder="Tìm kiếm theo tên..."
          class="w-full"
        />
      </div>

      <hr class="mb-4" />

      <!-- No requests message -->
      <div v-if="!joinRequests.length" class="text-gray-500 text-center py-4">
        Không có yêu cầu tham gia nào.
      </div>

      <!-- Join requests list -->
      <div v-else class="flex flex-col gap-4">
        <div
          v-for="request in joinRequests"
          :key="request.id"
          class="flex items-center justify-between border-b pb-4"
        >
          <div class="flex items-center gap-4">
            <img
              :src="
                request.user.profile.avatarUrl ??
                'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
              "
              alt="Avatar"
              class="w-12 h-12 rounded-md object-cover"
            />
            <div>
              <NuxtLink
                :to="`/user/${request.user.id}`"
                class="font-semibold hover:underline"
              >
                {{ request.user.profile.name }}
              </NuxtLink>
              <div class="text-sm text-gray-500">
                Đã yêu cầu vào {{ formatTimeAgo(request.createdAt) }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="acceptRequest(request.id)"
              class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Chấp nhận
            </button>
            <button
              @click="rejectRequest(request.id)"
              class="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Từ chối
            </button>
          </div>
        </div>
      </div>

      <!-- Load more button -->
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
import type { GroupJoinRequest } from "~/types/model";

definePageMeta({
  layout: "group-admin",
});

const route = useRoute();
const toast = useToast();
const groupStore = useGroupStore();

const joinRequests = ref<GroupJoinRequest[]>([]);
const hasMore = ref(false);
const currentPage = ref(1);
const limit = 10;
const searchQuery = ref("");

// Create debounced fetch function
const debouncedFetch = useDebounce(async (page: number, reset: boolean) => {
  await fetchJoinRequests(page);
}, 300);

// Modify fetchJoinRequests function to include search
async function fetchJoinRequests(page = 1) {
  try {
    const { data } = await useAPI<
      ApiResponse<{
        list: GroupJoinRequest[];
        pagination: { hasMore: boolean };
      }>
    >(`/api/group/${groupStore.currentGroup?.id}/join-requests`, {
      method: "GET",
      params: {
        page,
        limit,
        search: searchQuery.value,
      },
    });

    if (data.value?.code === 200) {
      if (page === 1) {
        joinRequests.value = data.value.data.list;
      } else {
        joinRequests.value.push(...data.value.data.list);
      }
      hasMore.value = data.value.data.pagination.hasMore;
      currentPage.value = page;
    }
  } catch (error) {
    console.error("Error fetching join requests:", error);
    toast.error("Không thể tải danh sách yêu cầu tham gia");
  }
}

// Accept join request
async function acceptRequest(requestId: string) {
  try {
    const { data } = await useAPI<ApiResponse>(
      `/api/group/${groupStore.currentGroup?.id}/join-requests/${requestId}`,
      {
        method: "PUT",
        body: {
          status: "ACCEPTED",
        },
      }
    );

    if (data.value?.code === 200) {
      toast.success("Đã chấp nhận yêu cầu tham gia");
      joinRequests.value = joinRequests.value.filter(
        (request) => request.id !== requestId
      );
      await groupStore.fetchGroup(route.params.slug as string);
    } else {
      toast.error(data.value?.message || "Không thể chấp nhận yêu cầu");
    }
  } catch (error) {
    console.error("Error accepting request:", error);
    toast.error("Đã xảy ra lỗi khi chấp nhận yêu cầu");
  }
}

// Reject join request
async function rejectRequest(requestId: string) {
  try {
    const { data } = await useAPI<ApiResponse>(
      `/api/group/${groupStore.currentGroup?.id}/join-requests/${requestId}`,
      {
        method: "PUT",
        body: {
          status: "REJECTED",
        },
      }
    );

    if (data.value?.code === 200) {
      toast.success("Đã từ chối yêu cầu tham gia");
      joinRequests.value = joinRequests.value.filter(
        (request) => request.id !== requestId
      );
    } else {
      toast.error(data.value?.message || "Không thể từ chối yêu cầu");
    }
  } catch (error) {
    toast.error("Đã xảy ra lỗi khi từ chối yêu cầu");
  }
}

// Load more requests
function loadMore() {
  fetchJoinRequests(currentPage.value + 1);
}

// Format time ago
function formatTimeAgo(date: string | Date) {
  return new Date(date).toLocaleDateString("vi-VN");
}

// Add watch for search query changes
watch(searchQuery, () => {
  currentPage.value = 1;
  debouncedFetch(1, true);
});

// Initial fetch
await fetchJoinRequests();
</script>
