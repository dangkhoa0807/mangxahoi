<template>
  <div>
    <!-- friends request -->
    <div>
      <div class="mx-auto w-full xl:w-9/12">
        <div class="bg-white rounded-md shadow-sm p-5">
          <div class="flex justify-between items-center mb-4">
            <div class="font-semibold text-lg">Lời mời kết bạn</div>
          </div>

          <div v-if="!FriendRequestData.length">
            <div class="text-center text-gray-500">
              Không có lời mời kết bạn nào
            </div>
          </div>

          <div
            v-if="FriendRequestData.length"
            class="grid grid-cols-12 lg:grid-cols-12 2xl:grid-cols-15 gap-5"
          >
            <Request
              class="col-span-12 sm:col-span-4 md:col-span-4 lg:col-span-3 xl:col-span-3 2xl:col-span-3"
              :request="request"
              v-for="request in FriendRequestData"
              :key="request.id"
              @on-update="fetchFriendRequest"
            ></Request>
          </div>

          <!-- Add Load More Button -->
          <button
            v-if="hasMore"
            @click="loadMore"
            class="mt-4 w-full px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
            :disabled="isLoading"
          >
            {{ isLoading ? "Đang tải..." : "Tải thêm" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Request from "~/components/Friend/Request.vue";
import type { ApiResponse } from "~/types/api";
import type { FriendRequest } from "~/types/model";

const FriendRequestData = ref<FriendRequest[]>([]);
const currentPage = ref(1);
const hasMore = ref(false);
const isLoading = ref(false);

async function fetchFriendRequest(page = 1, reset = false) {
  if (isLoading.value) return;
  isLoading.value = true;

  try {
    const { data } = await useAPI<
      ApiResponse<{
        list: FriendRequest[];
        hasMore: boolean;
      }>
    >("/api/friend/friendRequest", {
      method: "GET",
      params: {
        page,
        pageSize: 8,
      },
    });

    if (data.value?.code === 200) {
      if (reset) {
        FriendRequestData.value = data.value.data.list;
      } else {
        FriendRequestData.value = [
          ...FriendRequestData.value,
          ...data.value.data.list,
        ];
      }
      hasMore.value = data.value.data.hasMore;
    }
  } catch (error) {
    console.error("Error fetching friend requests:", error);
  } finally {
    isLoading.value = false;
  }
}

async function loadMore() {
  if (!hasMore.value || isLoading.value) return;
  currentPage.value++;
  await fetchFriendRequest(currentPage.value);
}

// Initial fetch
await fetchFriendRequest(1, true);

onMounted(() => {
  useListen("user:update-friendRequest-list", (id) => {
    FriendRequestData.value = FriendRequestData.value.filter(
      (item) => item.id !== id
    );
  });
});
</script>

<style></style>
