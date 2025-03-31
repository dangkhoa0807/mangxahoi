<template>
  <div class="mx-auto w-full xl:w-9/12">
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12 lg:col-span-8">
        <!-- Posts -->
        <div v-if="!posts.length">Hiện tại chưa có bài viết nào</div>

        <!-- Posts -->
        <PostComponent
          :post="post"
          v-for="post in posts"
          :key="post.id"
          @onReaction="onReaction"
        ></PostComponent>

        <!-- Load More Section -->
        <div v-if="posts.length" class="mt-4">
          <!-- Load More Button -->
          <button
            v-if="hasMore"
            @click="loadMore"
            :disabled="isLoading"
            class="w-full px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

          <!-- End of Posts Message -->
          <div
            v-else-if="!hasMore && posts.length > 0"
            class="text-center text-gray-500 py-4"
          >
            Đã hiển thị tất cả bài viết
          </div>
        </div>
      </div>
      <div class="col-span-12 lg:col-span-4">
        <div class="sticky top-0">
          <!-- Tạo nhóm -->
          <div class="bg-white rounded-md p-4 shadow-sm mb-4">
            <div class="text-lg font-bold text-gray-700 mb-2">Tạo nhóm mới</div>
            <button
              @click="visibleCreate = true"
              class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-150 ease-in-out"
            >
              Tạo nhóm
            </button>
          </div>

          <!-- Joined Groups -->
          <div
            class="bg-white rounded-md p-4 pt-3 shadow-sm"
            v-if="joinedGroups.length"
          >
            <div class="text-lg font-bold text-gray-700">Đang tham gia</div>
            <div class="grid gap-2 mt-2">
              <div
                class="bg-gray-100 p-2 rounded-md px-3 hover:bg-gray-200 flex gap-3 items-center transition duration-150 ease-in-out cursor-pointer"
                v-for="group in joinedGroups"
                :key="group.id"
              >
                <img
                  src="https://s3.cloudfly.vn/shoperis/2024/10/78df496f2a9e296a970290ae5d702336.avif"
                  alt=""
                  class="aspect-square w-11 border rounded-full"
                />
                <div>
                  <div class="font-bold text-gray-700">{{ group.name }}</div>
                  <div>{{ group._count.members }} thành viên</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Information -->
          <div class="mt-4 text-sm">
            <a href="#">Điều khoản sử dụng</a> .
            <a href="#">Quyền riêng tư</a> .
            <a href="#">Giới thiệu</a>
          </div>
        </div>
      </div>
    </div>

    <GroupCreate v-model="visibleCreate"></GroupCreate>
  </div>
</template>

<script setup lang="ts">
import GroupCreate from "~/components/Group/GroupCreate.vue";
import PostComponent from "~/components/Post/Post.vue";
import { groupService } from "~/services/group";
import type { ApiResponse } from "~/types/api";
import type { Group, Post, User } from "~/types/model";

definePageMeta({
  layout: "groups",
  middleware: ["auth"],
});

const visibleCreate = ref(false);
const posts = ref<Post[]>([]);
const page = ref<number>(1);
const hasMore = ref(false);
const isLoading = ref(false);

const auth = useAuth();

const fetchPosts = async () => {
  const { data: response } = await useAPI<
    ApiResponse<{
      list: Post[];
      pagination: {
        hasMore: boolean;
        currentPage: number;
      };
    }>
  >("/api/group/posts", {
    method: "GET",
    query: {
      page: page.value,
    },
  });

  if (response.value && response.value.code === 200) {
    const newPosts = response.value.data.list;

    if (posts.value.length) {
      const existingIds = new Set(posts.value.map((post) => post.id));
      const uniqueNewPosts = newPosts.filter(
        (post) => !existingIds.has(post.id)
      );
      posts.value.push(...uniqueNewPosts);
    } else {
      posts.value = newPosts;
    }

    hasMore.value = response.value.data.pagination.hasMore;
    page.value = response.value.data.pagination.currentPage;
  }
};

const loadMore = async () => {
  if (hasMore.value && !isLoading.value) {
    try {
      isLoading.value = true;
      page.value++;
      await fetchPosts();
    } finally {
      isLoading.value = false;
    }
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

await fetchPosts();

const joinedGroups = ref<Group[]>([]);
async function fetchJoinedGroups() {
  const { data } = await groupService.joined(1, 5);

  if (data.value?.code == 200) {
    joinedGroups.value = data.value.data.list;
  }
}

await fetchJoinedGroups();

onMounted(() => {
  useListen("user:update-post", (data) => {
    const updatedPost = data as Post;
    const index = posts.value.findIndex((post) => post.id === updatedPost.id);
    if (index !== -1) {
      posts.value[index] = updatedPost;
    }
  });
});

onBeforeUnmount(() => {
  removeListen("user:update-post");
});
</script>

<style scoped></style>
