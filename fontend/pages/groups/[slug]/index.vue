<template>
  <div class="grid grid-cols-12 gap-4">
    <div class="col-span-12 md:col-span-8">
      <!-- Create Posts -->
      <div
        class="bg-white p-4 rounded-lg mb-4 gap-3 flex md:md-0 shadow-sm items-center"
        v-if="auth.user"
      >
        <div class="h-11 w-11 flex-shrink-0">
          <img
            class="w-full rounded-full"
            :src="auth.user.profile?.avatarUrl ?? DEFAULT_AVATAR_URL"
            alt="Avatar"
          />
        </div>
        <div
          class="text-gray-500 bg-zinc-100 p-2 px-4 rounded-md cursor-pointer w-full truncate"
          @click="
            createPost.showDialog(
              groupStore.currentGroup?.id,
              groupStore.currentGroup?.privacy
            )
          "
        >
          Bạn muốn chia sẽ điều gì?
        </div>
      </div>

      <!-- Posts -->
      <div v-if="!posts.length">{{ message }}</div>
      <PostComponent
        :post="post"
        v-for="post in posts"
        :key="post.id"
      ></PostComponent>
    </div>
    <div class="col-span-4 hidden md:block">
      <div class="sticky top-0">
        <div class="bg-white rounded-md p-4 pt-3 shadow-sm mb-4 last:mb-0">
          <div class="text-lg font-bold text-gray-700">Giới thiệu</div>
          <div class="mt-2">
            {{
              groupStore.currentGroup?.description
                ? groupStore.currentGroup?.description
                : "Chưa có lời giới thiệu."
            }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DEFAULT_AVATAR_URL, type Group, type Post } from "~/types/model";

import PostComponent from "~/components/Post/Post.vue";
import type { ApiResponse } from "~/types/api";

const auth = useAuth();
const route = useRoute();
const createPost = useCreatePost();

const groupStore = useGroupStore();
const message = ref("Hiện chưa có bài viết nào");

const posts = ref<Post[]>([]);

useHead({
  title: `${groupStore.currentGroup?.name} - TWOK`,
});

async function fetchPosts() {
  const { data } = await useAPI<
    ApiResponse<{
      list: Post[];
      hasMore: boolean;
    }>
  >("/api/group/posts", {
    method: "GET",
    params: {
      groupId: groupStore.currentGroup?.id,
    },
  });

  if (data.value?.code == 200) {
    posts.value = data.value.data.list;
  } else if (data.value?.code == 403) {
    posts.value = [];
    message.value = data.value?.message ?? "Hiện chưa có bài viết nào";
  }
}

await fetchPosts();

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

<style lang="scss" scoped></style>
