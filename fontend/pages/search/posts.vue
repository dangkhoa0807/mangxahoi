<template>
  <div>
    <!-- Empty state -->
    <div
      class="p-4 bg-white rounded-md shadow-sm"
      v-if="!isLoading && (!posts || !posts.length)"
    >
      <div class="flex flex-col gap-4">Không tìm thấy bài viết</div>
    </div>

    <!-- Posts list -->
    <div>
      <PostComponent
        :post="post"
        v-for="post in posts"
        :key="post.id"
        @on-reaction="onReaction"
      ></PostComponent>
    </div>

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
      v-else-if="!hasMore && posts.length > 0"
      class="text-center text-gray-500 py-4"
    >
      Đã hiển thị tất cả bài viết
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { ApiResponse } from "~/types/api";
import type { Post, User } from "~/types/model";
import PostComponent from "~/components/Post/Post.vue";

const route = useRoute();
const posts = ref<Post[]>([]);
const isLoading = ref(false);
const hasMore = ref(true);
const cursor = ref<string | null>(null);
const search = computed(() => route.query.q);

const auth = useAuth();

const fetchPosts = async (reset = false) => {
  if (reset) {
    posts.value = [];
    cursor.value = null;
  }

  isLoading.value = true;

  try {
    const { data: response } = await useAPI<
      ApiResponse<{
        list: Post[];
        pagination: {
          cursor: string | null;
          hasMore: boolean;
        };
      }>
    >(`/api/search/post?q=${search.value}`, {
      method: "GET",
      query: {
        search: search.value,
        cursor: cursor.value,
      },
    });

    if (response.value && response.value.code === 200) {
      if (reset) {
        posts.value = response.value.data.list;
      } else {
        posts.value = [...posts.value, ...response.value.data.list];
      }
      cursor.value = response.value.data.pagination.cursor;
      hasMore.value = !!response.value.data.pagination.hasMore;
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
  } finally {
    isLoading.value = false;
  }
};

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

const loadMore = () => {
  if (!isLoading.value && hasMore.value) {
    fetchPosts();
  }
};

watch(search, () => {
  fetchPosts(true);
});

// Initial fetch
fetchPosts();
</script>
<style scoped>
.bg-gray-100 button {
  background-color: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bg-gray-100 button:hover {
  color: #1a73e8;
}

.font-bold1 {
  font-weight: 600;
  color: #1a73e8;
}
</style>
