<template>
  <div>
    <div class="mx-auto w-full xl:w-9/12">
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12 lg:col-span-8">
          <div class="bg-white rounded-md p-4 pt-3 shadow-sm mb-4">
            <div class="text-xl font-bold text-gray-700">
              #{{ nameHashtag }}
            </div>
            <div class="text-sm text-gray-700">{{ posts.length }} bài viết</div>
          </div>

          <div
            v-if="!posts.length"
            class="bg-white rounded-md p-4 pt-3 shadow-sm"
          >
            Không có bài viết nào cho hashtag này.
          </div>
          <!-- Posts -->
          <PostComponent
            :post="post"
            v-for="post in posts"
            :key="post.id"
            @on-reaction="onReaction"
          ></PostComponent>

          <button
            v-if="hasMore"
            ref="loadMoreBtn"
            @click="fetchPosts"
            :disabled="isLoading"
            class="mt-4 w-full px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              v-if="isLoading"
              class="flex items-center justify-center gap-2"
            >
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
        <div class="col-span-12 lg:col-span-4">
          <div class="sticky top-0">
            <!-- Hot Trend -->
            <div class="bg-white rounded-md p-4 pt-3 shadow-sm">
              <div class="text-lg font-bold text-gray-700">Chủ đề hot</div>
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
                      <div class="font-bold text-gray-700">
                        #{{ hashtag.name }}
                      </div>
                      <div>{{ hashtag.postCount }} bài viết</div>
                    </div>
                  </NuxtLink>
                </div>
              </div>
            </div>

            <!-- Infomation -->
            <div class="mt-4 text-sm">
              <a href="#">Điều khoản sử dụng</a> .
              <a href="#">Quyền riêng tư</a> .
              <a href="#">Giới thiệu</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PostComponent from "~/components/Post/Post.vue";
import type { ApiResponse } from "~/types/api";
import type { Hashtag, Post, User } from "~/types/model";

const auth = useAuth();
const route = useRoute();

const cursor = ref<string | null>(null);
const limit = ref(10);
const posts = ref<Post[]>([]);
const hasMore = ref(false);
const nameHashtag = route.params.name;
const isLoading = ref(false);

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

const fetchPosts = async () => {
  isLoading.value = true;
  const { data: response } = await useAPI<
    ApiResponse<{
      posts: Post[];
      hasMore: boolean;
      cursor: string | null;
    }>
  >("/api/hashtag/" + nameHashtag, {
    method: "GET",
    query: {
      cursor: cursor.value,
      limit: limit.value,
    },
  });

  if (response.value && response.value.code === 200) {
    if (posts.value.length) {
      posts.value.push(...response.value.data.posts);
    } else {
      posts.value = response.value.data.posts;
    }
    cursor.value = response.value.data.cursor;
    hasMore.value = response.value.data.hasMore;
  }
  isLoading.value = false;
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
      hashTags.value.push(...response.value.data);
    } else {
      hashTags.value = response.value.data;
    }
  }
};

await Promise.all([fetchPosts(), fetchHashtags()]);

const loadMoreBtn = ref<HTMLButtonElement | null>(null);

onMounted(() => {
  useListen("user:update-post-list", () => {
    posts.value = [];
    fetchPosts();
  });
  useListen("user:delete-post", (id) => {
    posts.value = posts.value.filter((post) => post.id !== id);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && hasMore.value) {
        fetchPosts();
      }
    });
  });

  if (loadMoreBtn.value) {
    observer.observe(loadMoreBtn.value);
  }
});

onBeforeUnmount(() => {
  removeListen("user:update-post-list");
  removeListen("user:delete-post");
});
</script>

<style scoped></style>
