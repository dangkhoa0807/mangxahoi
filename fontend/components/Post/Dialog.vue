<template>
  <div>
    <PostModel
      v-model="modelOpen"
      v-if="post"
      :post="post"
      @on-reaction="onReaction"
    />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { Post } from "~/types/model";
import PostModel from "./PostModel.vue";

const post = ref<Post | null>(null);
const modelOpen = ref(false);
const postId = ref<string | null>(null);

const route = useRoute();
const toast = useToast();

async function fetchPost() {
  if (postId.value) {
    const { data: response } = await useAPI<ApiResponse<Post>>(
      `/api/post/${postId.value}`,
      {
        method: "GET",
      }
    );

    if (response.value && response.value.code === 200) {
      post.value = response.value.data;
      modelOpen.value = true;
    } else {
      toast.error(response.value?.message || "Không tìm thấy bài viết");
      modelOpen.value = false;
    }
  }
}

// Reaction bài viết
async function onReaction(type: string) {
  try {
    const { data } = await useAPI<
      ApiResponse<{
        isReacted: boolean;
        reactionCount: number;
      }>
    >(`/api/post/${postId.value}/reaction`, {
      method: "POST",
      body: {
        type,
      },
    });

    if (data.value?.code == 200) {
      post.value = post.value
        ? ({
            ...post.value,
            _count: {
              ...post.value._count,
              reactions: data.value.data.reactionCount,
            },
            reactions: [
              {
                type: type,
                postId: postId.value,
                id: "",
                post: post.value,
                createdAt: new Date(),
                user: post.value.user,
              },
            ],
          } as Post)
        : null;
    }
  } catch (error) {
    console.error("Error toggling like:", error);
  }
}

onMounted(async () => {
  postId.value = route.query.postId as string;
  setTimeout(async () => {
    await fetchPost();
  }, 500);

  useListen("openPostModal", async (data: any) => {
    const { postId: newPostId, commentId } = data;
    postId.value = newPostId;
    await fetchPost();

    // if (commentId) {
    //   useEvent("scrollToComment", { postId, commentId });
    // }
  });
});

onUnmounted(() => {
  postId.value = null;
  removeListen("openPostModal");
});
</script>

<style scoped></style>
