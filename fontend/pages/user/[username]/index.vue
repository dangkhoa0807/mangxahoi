<template>
  <div class="grid grid-cols-10 gap-4">
    <div class="col-span-10 lg:col-span-6 order-last lg:order-first">
      <CreatePostButton
        v-if="auth.user && user?.id == auth.user.id"
      ></CreatePostButton>

      <div v-if="!posts.length">Chưa có bài viết nào.</div>

      <!-- List Posts -->
      <PostComponent
        :post="post"
        v-for="post in posts"
        :key="post.id"
        @on-reaction="onReaction"
      ></PostComponent>
    </div>
    <div class="col-span-10 lg:col-span-4">
      <div class="sticky top-0">
        <div class="bg-white rounded-md p-4 pt-3 shadow-sm mb-4 last:mb-0">
          <div class="text-lg font-bold text-zinc-800">Giới thiệu</div>
          <div class="mt-2">
            {{
              user?.profile.bio
                ? user?.profile.bio
                : "Chưa thiết lập giới thiệu."
            }}
          </div>

          <div v-if="auth.user && user?.id == auth.user.id">
            <NuxtLink
              to="/settings/profile?action=bio"
              class="bg-gray-200 text-zinc-800 px-3 py-1 rounded-md hover:bg-gray-300 flex items-center gap-2 mt-2"
            >
              <Icon name="tabler:edit"></Icon> Chỉnh sửa
            </NuxtLink>
          </div>
        </div>

        <div class="bg-white rounded-md p-4 pt-3 shadow-sm mb-4 last:mb-0">
          <div class="flex justify-between items-center">
            <div class="font-semibold text-lg text-zinc-800">
              Danh sách bạn bè
            </div>
            <NuxtLink
              to="/friends/list"
              class="text-blue-600 flex items-center hover:underline"
              v-if="auth.user && user?.id == auth.user.id"
            >
              Xem tất cả
            </NuxtLink>
          </div>
          <div class="grid grid-cols-12 gap-3">
            <div class="col-span-12 mt-2" v-if="!friends.length">
              Người dùng chưa có bạn bè nào.
            </div>
            <div
              class="col-span-4 mt-2"
              v-for="friend in friends"
              :key="friend.id"
            >
              <nuxt-link :to="`/user/${friend.id}`">
                <img
                  :src="
                    friend.profile.avatarUrl ??
                    `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
                  "
                  alt=""
                  class="w-full aspect-square border rounded-md mb-1"
                />
                <div class="truncate text-center">
                  {{ friend.profile.name }}
                </div>
              </nuxt-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { Post, User } from "~/types/model";
import PostComponent from "@/components/Post/Post.vue";
import CreatePostButton from "~/components/Post/CreatePostButton.vue";

const auth = useAuth();
const route = useRoute();

const user = inject("user", ref<User>());
const posts = ref<Post[]>([]);

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

async function fetchPosts() {
  const { data } = await useAPI<
    ApiResponse<{
      list: Post[];
      hasMore: boolean;
    }>
  >(`/api/user/${route.params.username}/posts`, {
    method: "GET",
  });

  if (data.value?.code == 200) {
    posts.value = data.value.data.list;
  }
}

const friends = ref<User[]>([]);

async function fetchFriends() {
  const { data } = await useAPI<
    ApiResponse<{
      list: User[];
      hasMore: boolean;
    }>
  >(`/api/user/${route.params.username}/friends`);

  if (data.value?.code == 200) {
    friends.value = data.value.data.list;
  }
}

await Promise.all([fetchPosts(), fetchFriends()]);

watch(user, () => {
  fetchPosts();
});

onMounted(() => {
  useListen("user:update-post", (data) => {
    const updatedPost = data as Post;
    const index = posts.value.findIndex((post) => post.id === updatedPost.id);
    if (index !== -1) {
      posts.value[index] = updatedPost;
    }
  });

  useListen("new-post", (data) => {
    posts.value.unshift(data as Post);
  });

  useListen("user:delete-post", (id) => {
    posts.value = posts.value.filter((post) => post.id !== id);
  });
});

onUnmounted(() => {
  removeListen("user:update-post");
  removeListen("new-post");
  removeListen("user:delete-post");
});
</script>

<style scoped></style>
