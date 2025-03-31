<template>
  <div>
    <div class="">
      <div class="flex flex-col gap-4">
        <!-- Skeleton loading -->
        <div v-if="isLoading" v-for="i in 5" :key="i">
          <div
            class="animate-pulse flex items-center gap-3 p-3 bg-white rounded-lg"
          >
            <div class="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>

        <!-- Actual content -->
        <div v-else-if="!users || !users.length">
          Không tìm thấy được người dùng
        </div>
        <div v-else v-for="(searchUser, index) in users" :key="index">
          <UserSearchItem :user="searchUser" @update="updateUser" />
        </div>

        <!-- Load more button -->
        <button
          v-if="hasMore"
          @click="loadMore"
          :disabled="isLoading"
          class="mt-4 w-full px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isLoading" class="flex items-center justify-center gap-2">
            <Icon name="eos-icons:loading" class="animate-spin" />
            Đang tải...
          </span>
          <span v-else>Tải thêm</span>
        </button>
        <div
          v-else-if="!hasMore && users.length > 0"
          class="text-center text-gray-500 py-4"
        >
          Đã hiển thị tất cả kết quả
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ApiResponse } from "~/types/api";
import type { User } from "~/types/model";
import UserSearchItem from "~/components/User/UserSearchItem.vue";

const route = useRoute();
const search = route.query.q;

const isLoading = ref(true);
const hasMore = ref(false);
const cursor = ref("");
const limit = ref(5);
const users = ref<User[]>([]);

const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const { data: response } = await useAPI<
      ApiResponse<{
        list: User[];
        pagination: {
          cursor: string;
          hasMore: boolean;
        };
      }>
    >(`/api/search/user`, {
      method: "GET",
      query: {
        search: search,
        cursor: cursor.value,
        limit: limit.value,
      },
    });
    if (response.value?.code == 200) {
      users.value = [...users.value, ...response.value.data.list];
      hasMore.value = response.value.data.pagination.hasMore;
      cursor.value = response.value.data.pagination.cursor;
    }
  } finally {
    isLoading.value = false;
  }
};

const updateUser = (user: User) => {
  users.value = users.value.map((u) => (u.id === user.id ? user : u));
};

const loadMore = async () => {
  if (hasMore.value && !isLoading.value) {
    await fetchUsers();
  }
};

fetchUsers();
</script>

<style></style>
