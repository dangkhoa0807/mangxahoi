<template>
  <div class="mx-auto w-full xl:w-9/12 grid grid-cols-12 gap-4">
    <div class="col-span-12 lg:col-span-8">
      <!-- <Tabs value="0" class="mb-4 rounded-lg shadow-sm overflow-hidden">
        <TabList>
          <Tab value="0">Đề xuất</Tab>
          <Tab value="1">Đang theo dõi</Tab>
        </TabList>
      </Tabs> -->

      <CreatePostButton></CreatePostButton>

      <!-- Posts -->
      <PostComponent
        :post="post"
        @on-reaction="onReaction"
        v-for="post in posts"
        :key="post.id"
      ></PostComponent>

      <!-- Skeleton loader -->
      <div v-if="isLoading" class="space-y-4">
        <div
          v-for="i in 3"
          :key="i"
          class="bg-white rounded-lg p-4 shadow-sm animate-pulse"
        >
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 rounded w-1/4"></div>
              <div class="h-3 bg-gray-200 rounded w-1/6 mt-2"></div>
            </div>
          </div>
          <div class="mt-4 space-y-3">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <button
        v-if="hasMore"
        ref="loadMoreBtn"
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
        v-else-if="!hasMore && posts.length > 0"
        class="text-center text-gray-500 py-4"
      >
        Đã hiển thị tất cả bài viết
      </div>
    </div>
    <div class="col-span-12 lg:col-span-4 hidden lg:block">
      <div class="sticky top-20 space-y-4">
        <!-- Hot Trend -->
        <div class="bg-white rounded-md p-4 pt-3 shadow-sm">
          <div class="text-lg font-bold text-gray-700">Hashtag hot</div>

          <div class="flex flex-col gap-2 mt-2">
            <div
              class="bg-gray-100 p-2 rounded-sm px-3 hover:bg-gray-200 transition duration-150 ease-in-out cursor-pointer"
              v-for="hashtag in hashTags"
            >
              <NuxtLink
                :to="'/hashtag/' + hashtag.name"
                class="flex justify-between items-center"
              >
                <div>
                  <div class="font-bold text-gray-700">#{{ hashtag.name }}</div>
                  <div>{{ hashtag.postCount }} bài viết</div>
                </div>

                <!-- <div
                  class="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-full transition duration-150 ease-in-out"
                >
                  <Icon
                    name="entypo:dots-three-horizontal"
                    class="text-md text-gray-700"
                  ></Icon>
                </div> -->
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Infomation -->
        <div class="mt-4 text-sm">
          <NuxtLink to="/terms">Điều khoản sử dụng</NuxtLink> .
          <NuxtLink to="/privacy">Quyền riêng tư</NuxtLink> .
          <NuxtLink to="/about">Giới thiệu</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CreatePostButton from "~/components/Post/CreatePostButton.vue";
import PostComponent from "~/components/Post/Post.vue";
import PostModel from "~/components/Post/PostModel.vue";
import type { ApiResponse } from "~/types/api";
import type { Hashtag, Post, User } from "~/types/model";

useHead({
  title: "TWOK",
});

const auth = useAuth();

const isInitialLoading = ref(true);

const posts = ref<Post[]>([]);
const hasMore = computed(() => {
  return hasMoreTrending.value || hasMoreLatest.value;
});

function onReaction(data: {
  postId: string;
  type: string;
  count: number;
  isReacted: boolean;
}) {
  const index = posts.value.findIndex((post) => post.id === data.postId);
  if (index !== -1) {
    if (data.isReacted) {
      posts.value[index] = {
        ...posts.value[index],
        reactions: [
          {
            id: "",
            type: data.type,
            postId: data.postId,
            post: posts.value[index],
            createdAt: new Date(),
            user: auth.user as User,
          },
        ],
        _count: {
          ...posts.value[index]._count,
          reactions: data.count,
        },
      };
    } else {
      posts.value[index] = {
        ...posts.value[index],
        reactions: [],
        _count: {
          ...posts.value[index]._count,
          reactions: data.count,
        },
      };
    }
  }
}

const isLoading = ref(true);

// Lấy bài viết trending
const hasMoreTrending = ref(true);
const cursorTrending = ref<string | null>(null);

const fetchTrendingPosts = async () => {
  if (!hasMoreTrending.value) return;

  const { data: response } = await useAPI<
    ApiResponse<{
      list: Post[];
      pagination: {
        hasMore: boolean;
        cursor: string | null;
      };
    }>
  >("/api/post/trending", {
    method: "GET",
    query: {
      cursor: cursorTrending.value,
    },
  });

  if (response.value && response.value.code === 200) {
    const newPosts = response.value.data.list;

    const existingIds = new Set(posts.value.map((post) => post.id));
    const uniqueNewPosts = newPosts.filter((post) => !existingIds.has(post.id));
    posts.value.push(...uniqueNewPosts);

    hasMoreTrending.value = response.value.data.pagination.hasMore;
    cursorTrending.value = response.value.data.pagination.cursor;
  }
};

// Lấy bài viết mới nhất
const hasMoreLatest = ref(true);
const cursorLatest = ref<string | null>(null);

const fetchLatestPosts = async () => {
  if (!hasMoreLatest.value) return;

  const { data: response } = await useAPI<
    ApiResponse<{
      list: Post[];
      pagination: {
        hasMore: boolean;
        currentPage: number;
        cursor: string | null;
      };
    }>
  >("/api/post/latest", {
    method: "GET",
    query: {
      cursor: cursorLatest.value,
    },
  });

  if (response.value && response.value.code === 200) {
    const newPosts = response.value.data.list;

    const existingIds = new Set(posts.value.map((post) => post.id));
    const uniqueNewPosts = newPosts.filter((post) => !existingIds.has(post.id));
    posts.value.push(...uniqueNewPosts);

    hasMoreLatest.value = response.value.data.pagination.hasMore;
    cursorLatest.value = response.value.data.pagination.cursor;
  }
};

const loadMore = async () => {
  try {
    isLoading.value = true;
    await Promise.all([fetchLatestPosts(), fetchTrendingPosts()]);
  } finally {
    isLoading.value = false;
  }
};

const hashTags = ref<Hashtag[]>([]);

const fetchHashtags = async () => {
  const { data: response } = await useAPI<ApiResponse<Hashtag[]>>(
    "/api/hashtag",
    {
      method: "GET",
    }
  );

  if (response.value && response.value.code === 200) {
    if (hashTags.value.length) {
      hashTags.value = hashTags.value.concat(response.value.data);
    } else {
      hashTags.value = response.value.data;
    }
  }
};

const loadMoreBtn = ref<HTMLElement | null>(null);

await fetchHashtags();

onMounted(() => {
  try {
    Promise.all([fetchLatestPosts(), fetchTrendingPosts()]);
  } catch (error) {
    console.error(error);
  } finally {
    isInitialLoading.value = false;
  }

  useListen("new-post", (data) => {
    posts.value.unshift(data as Post);
  });
  useListen("user:delete-post", (id) => {
    posts.value = posts.value.filter((post) => post.id !== id);
  });

  useListen("user:update-post", (data) => {
    const updatedPost = data as Post;
    const index = posts.value.findIndex((post) => post.id === updatedPost.id);
    if (index !== -1) {
      posts.value[index] = updatedPost;
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && hasMore.value) {
        loadMore();
      }
    });
  });

  if (loadMoreBtn.value) {
    observer.observe(loadMoreBtn.value);
  }
});

onBeforeUnmount(() => {
  removeListen("new-post");
  removeListen("user:delete-post");
  removeListen("user:update-post");
});

const route = useRoute();

// onMounted(async () => {

// });
</script>

<style scoped></style>
