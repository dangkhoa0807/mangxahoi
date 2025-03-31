<template>
  <Transition name="slide">
    <div v-if="modelValue" class="fixed inset-0 bg-white z-50">
      <!-- Header -->
      <div class="flex items-center gap-3 p-4 border-b">
        <div class="cursor-pointer" @click="closeSearch">
          <Icon name="material-symbols:arrow-back" class="text-2xl"></Icon>
        </div>
        <div class="flex-1">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Tìm kiếm..."
            class="w-full bg-gray-100 rounded-full px-4 py-2 focus:outline-none"
            @keyup.enter="handleSearch"
          />
        </div>
      </div>

      <!-- Search Results -->
      <div class="h-[calc(100vh-70px)] overflow-y-auto">
        <!-- Recent Searches -->
        <div v-if="!searchQuery" class="p-4">
          <div class="text-gray-500 mb-2">Tìm kiếm gần đây</div>
          <div class="flex flex-col gap-2">
            <div
              v-for="(item, index) in recentSearches"
              :key="index"
              class="flex items-center justify-between py-2"
            >
              <NuxtLink
                :to="`/search/posts?q=${encodeURIComponent(item)}`"
                class="flex items-center gap-3"
              >
                <Icon
                  name="material-symbols:history"
                  class="text-gray-400"
                ></Icon>
                <span>{{ item }}</span>
              </NuxtLink>
              <Icon
                name="material-symbols:close"
                class="text-gray-400"
                @click="handleDeleSearch(index)"
              ></Icon>
            </div>
          </div>
        </div>

        <!-- Search Results -->
        <div
          class="flex flex-col gap-4 mt-4 px-4"
          v-if="searchUserData.length > 0 || searchGroupData.length > 0"
        >
          <div class="text-gray-500">Kết quả tìm kiếm</div>
          <div v-for="(searchUser, index) in searchUserData" :key="index">
            <div
              class="flex gap-3 justify-between hover:bg-gray-200 p-1 rounded-md"
            >
              <div
                @click="handleUserClick(searchUser.id)"
                class="grid grid-cols-12 gap-3 items-center rounded-md cursor-pointer max-w-72"
              >
                <div class="col-span-2">
                  <img
                    class="w-full rounded-full"
                    :src="
                      searchUser.profile.avatarUrl ||
                      'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
                    "
                    alt="Avatar"
                  />
                </div>
                <div class="col-span-8">
                  <div class="text-gray-800 truncate hover:underline">
                    {{ searchUser.profile.name }}
                  </div>
                  <div class="text-sm truncate">
                    {{ searchUser._count?.followers || 0 }} người theo dõi
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Group Results -->
          <div v-for="(group, index) in searchGroupData" :key="index">
            <div
              class="flex gap-3 justify-between hover:bg-gray-200 p-1 rounded-md"
            >
              <div
                @click="router.push(`/groups/${group.id}`)"
                class="grid grid-cols-12 gap-3 items-center rounded-md cursor-pointer max-w-72"
              >
                <div class="col-span-2">
                  <img
                    class="w-full rounded-full"
                    :src="
                      group.iconUrl ||
                      'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
                    "
                    alt="Group Avatar"
                  />
                </div>
                <div class="col-span-8">
                  <div class="text-gray-800 truncate hover:underline">
                    {{ group.name }}
                  </div>
                  <div class="text-sm truncate">
                    {{ group._count?.members || 0 }} thành viên
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { User, Group } from "~/types/model";

import type { ApiResponse } from "~/types/api";
const router = useRouter();
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(["update:modelValue"]);

const searchQuery = ref("");

const recentSearches = ref<string[]>([]);
const searchUserData = ref<User[]>([]);
const searchGroupData = ref<Group[]>([]);

// Thêm hàm để load recent searches khi component được tạo
onMounted(() => {
  const savedSearches = localStorage.getItem("recentSearches");
  if (savedSearches) {
    recentSearches.value = JSON.parse(savedSearches);
  }
});

const handleDeleSearch = (index: number) => {
  recentSearches.value = recentSearches.value.filter((item, i) => i !== index);
  localStorage.setItem("recentSearches", JSON.stringify(recentSearches.value));
};
// Hàm đóng search
const closeSearch = () => {
  emit("update:modelValue", false);
};

// Hàm xử lý khi click vào user
const handleUserClick = (userId: string) => {
  closeSearch(); // Đóng search trước
  router.push(`/user/${userId}`); // Sau đó chuyển trang
};

// Watch searchQuery để tìm kiếm
watch(
  searchQuery,
  useDebounce(async () => {
    if (searchQuery.value.trim()) {
      await Promise.all([fetchSearchUser(), fetchSearchGroup()]);
    } else {
      searchUserData.value = [];
      searchGroupData.value = [];
    }
  }, 800)
);

const fetchSearchUser = async () => {
  const { data: response } = await useAPI<
    ApiResponse<{
      searchUser: User[];
    }>
  >("/api/search", {
    method: "POST",
    body: JSON.stringify({
      search: searchQuery.value.trim(),
    }),
  });
  if (response.value?.code == 200) {
    searchUserData.value = response.value.data.searchUser;
  }
};

const fetchSearchGroup = async () => {
  const { data: response } = await useAPI<
    ApiResponse<{
      groups: Group[];
    }>
  >(`/api/search/groups?q=${encodeURIComponent(searchQuery.value.trim())}`, {
    method: "GET",
  });
  if (response.value?.code == 200) {
    searchGroupData.value = response.value.data.groups;
  }
};

// Cập nhật hàm handleSearch
const handleSearch = () => {
  const query = searchQuery.value.trim();
  if (query) {
    // Thêm từ khóa mới vào đầu mảng và loại bỏ các từ khóa trùng lặp
    const updatedSearches = [
      query,
      ...recentSearches.value.filter((item) => item !== query),
    ];
    // Giới hạn số lượng từ khóa gần đây (ví dụ: 5 từ khóa)
    recentSearches.value = updatedSearches.slice(0, 5);
    // Lưu vào localStorage
    localStorage.setItem(
      "recentSearches",
      JSON.stringify(recentSearches.value)
    );

    closeSearch();
    router.push(`/search/posts?q=${encodeURIComponent(query)}`);
  }
};
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateY(100%);
}

.slide-leave-to {
  transform: translateY(100%);
}

.slide-enter-to,
.slide-leave-from {
  transform: translateY(0);
}
</style>
