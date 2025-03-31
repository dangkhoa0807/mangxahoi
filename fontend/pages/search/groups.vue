<template>
  <div>
    <!-- No results message -->
    <div
      class="p-4 bg-white rounded-md shadow-sm"
      v-if="!isLoading && (!groups || !groups.length)"
    >
      <div class="flex flex-col gap-4">Không tìm thấy được nhóm</div>
    </div>

    <!-- Search results -->
    <div
      class="col-span-12 md:col-span-6 lg:col-span-4 mb-5"
      v-for="group in groups"
      :key="group.id"
    >
      <GroupItemHorizontal
        :group="group"
        @joined="joinedGroup"
        @requested="requestedGroup"
      />
    </div>

    <!-- Skeleton loading -->
    <div v-if="isLoading" class="grid grid-cols-12 gap-4">
      <div v-for="i in 5" :key="i" class="col-span-12">
        <div class="bg-white p-4 rounded-md shadow-sm animate-pulse">
          <div class="flex gap-4">
            <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
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
      v-else-if="!hasMore && groups.length > 0"
      class="text-center text-gray-500 py-4"
    >
      Đã hiển thị tất cả kết quả
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ApiResponse } from "~/types/api";
import type { Group } from "~/types/model";
import { formatNumber } from "~/utils/formatNumber";
import GroupItemHorizontal from "~/components/Group/GroupItemHorizontal.vue";

const route = useRoute();
const search = computed(() => route.query.q);
const toast = useToast();

const isLoading = ref(true);

const hasMore = ref(true);
const cursor = ref<string | null>(null);
const groups = ref<Group[]>([]);
const limit = ref(5);

const fetchGroups = async (reset = false) => {
  isLoading.value = true;
  try {
    const { data: response } = await useAPI<
      ApiResponse<{
        list: Group[];
        pagination: {
          hasMore: boolean;
          cursor: string | null;
        };
      }>
    >(`/api/search/groups`, {
      method: "GET",
      params: {
        search: search.value,
        limit: limit.value,
        cursor: cursor.value,
      },
    });
    if (response.value?.code == 200) {
      if (reset) {
        groups.value = response.value.data.list;
      } else {
        groups.value = [...groups.value, ...response.value.data.list];
      }
      hasMore.value = !!response.value.data.pagination.hasMore;
      cursor.value = response.value.data.pagination.cursor;
    }
  } finally {
    isLoading.value = false;
  }
};

const loadMore = () => {
  if (!isLoading.value && hasMore.value) {
    fetchGroups();
  }
};

async function joinedGroup(group: Group) {
  groups.value = groups.value.map((g) => (g.id === group.id ? group : g));
}

async function requestedGroup(group: Group) {
  groups.value = groups.value.map((g) => (g.id === group.id ? group : g));
}

fetchGroups(true);
</script>

<style></style>
