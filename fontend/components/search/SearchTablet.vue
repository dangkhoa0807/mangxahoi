<template>
  <div class="group relative flex">
    <InputText
      aria-describedby="username-help"
      placeholder="Tìm kiếm"
      class="w-[320px] flex-shrink lg:w-[480px] md:block hidden h-[40px]"
      v-model="search"
      @keyup.enter="onSearch()"
      @focus="isFocused = true"
      @blur="startHideTimer"
    />
    <div
      v-if="isFocused"
      class="absolute top-0 left-0 w-[480px] z-50 mt-11 h-fit max-h-[400px] overflow-y-auto bg-white rounded-lg shadow-md p-4 flex flex-col gap-4 border border-gray-300"
    >
      <!-- Tìm kiếm gần đây -->
      <div v-if="!search && recentSearches.length > 0">
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

      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="flex flex-col gap-4">
        <div v-for="i in 3" :key="i" class="animate-pulse">
          <div class="flex gap-3 items-center">
            <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Results -->
      <template v-else>
        <!-- Tìm kiếm người dùng -->
        <div class="flex flex-col gap-4" v-if="searchUserData.length > 0">
          <span class="text-gray-500">Mọi người</span>
          <div v-for="(searchUser, index) in searchUserData" :key="index">
            <div
              class="flex gap-3 justify-between hover:bg-gray-200 p-1 rounded-md"
            >
              <NuxtLink
                :to="'/user/' + searchUser.id"
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
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Tìm kiếm nhóm -->
        <div class="flex flex-col gap-4" v-if="searchGroupData.length > 0">
          <span class="text-gray-500">Nhóm</span>
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

        <div
          v-if="
            searchUserData.length == 0 &&
            searchGroupData.length == 0 &&
            search &&
            !isLoading
          "
          class="text-gray-500 text-center"
        >
          Không tìm thấy kết quả
        </div>

        <div v-if="search">
          <hr />
          <div
            class="text-gray-500 text-center flex items-center gap-2 mt-4 cursor-pointer"
            @click="onSearch()"
          >
            <Icon name="tabler:search" class="text-gray-400"></Icon>
            Tìm kiếm cho "{{ search }}"
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ApiResponse } from "~/types/api";
import type { Group, User } from "~/types/model";

const router = useRouter();
const isFocused = ref(false);
const search = ref("");
let hideTimer: any = null;

const recentSearches = ref<string[]>([]);
const searchUserData = ref<User[]>([]);
const searchGroupData = ref<Group[]>([]);
const isLoading = ref(false);

onMounted(() => {
  const savedSearches = localStorage.getItem("recentSearches");
  if (savedSearches) {
    recentSearches.value = JSON.parse(savedSearches);
  }
});

const route = useRoute();

const getQuery = computed(() => route.query.q);

watch(getQuery, (newQuery) => {
  search.value = newQuery as string;
});

onMounted(() => {
  search.value = getQuery.value as string;
});

watch(
  search,
  useDebounce(async () => {
    if (search.value?.trim()) {
      isLoading.value = true;
      try {
        await fetchSearchResult();
      } finally {
        isLoading.value = false;
      }
    } else {
      searchUserData.value = [];
      searchGroupData.value = [];
    }
  }, 800)
);

const fetchSearchResult = async () => {
  const { data: response } = await useAPI<
    ApiResponse<{
      users: User[];
      groups: Group[];
    }>
  >(`/api/search/all`, {
    method: "GET",
    query: {
      q: search.value.trim(),
    },
  });

  if (response.value?.code == 200) {
    searchUserData.value = response.value.data.users;
    searchGroupData.value = response.value.data.groups;
  }
};

const onSearch = () => {
  const query = search.value.trim();
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

    // router.push(`/search/posts?q=${encodeURIComponent(query)}`);
    navigateTo(`/search/posts?q=${encodeURIComponent(query)}`);
  }
};

const handleDeleSearch = (index: number) => {
  recentSearches.value = recentSearches.value.filter((item, i) => i !== index);
  localStorage.setItem("recentSearches", JSON.stringify(recentSearches.value));
};

const startHideTimer = () => {
  hideTimer = setTimeout(() => {
    isFocused.value = false;
  }, 200);
};
</script>

<style></style>
