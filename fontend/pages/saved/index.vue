<template>
  <div class="mx-auto w-full xl:w-9/12 bg-gray-100">
    <h1 class="text-2xl font-bold mb-4 mt-2">Bài viết đã lưu</h1>
    <div v-if="!savedPosts.length">Chưa có bài viết nào được lưu.</div>
    <div class="grid grid-cols-12 gap-4">
      <div class="col-span-12">
        <PostComponent
          v-for="post in savedPosts"
          :key="post.id"
          :post="post"
        ></PostComponent>
      </div>
    </div>
    <button
      v-if="hasMore"
      @click="loadMoreSavedPosts"
      class="mt-4 w-full px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
    >
      Tải thêm
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { Post } from "~/types/model";
import PostComponent from "~/components/Post/Post.vue";

const savedPosts = ref<Post[]>([]);
const currentPage = ref(1);
const hasMore = ref(false);
const isLoading = ref(false);

async function fetchSavedPosts(page = 1) {
  if (isLoading.value) return;
  isLoading.value = true;

  try {
    const { data } = await useAPI<
      ApiResponse<{ list: Post[]; hasMore: boolean }>
    >("/api/post/saved", {
      method: "GET",
      params: {
        page,
        pageSize: 10,
      },
    });

    if (data.value?.code === 200) {
      if (page === 1) {
        savedPosts.value = data.value.data.list;
      } else {
        savedPosts.value.push(...data.value.data.list);
      }
      hasMore.value = data.value.data.hasMore;
    }
  } catch (error) {
    console.error("Error fetching saved posts:", error);
  } finally {
    isLoading.value = false;
  }
}

async function loadMoreSavedPosts() {
  if (hasMore.value) {
    currentPage.value++;
    await fetchSavedPosts(currentPage.value);
  }
}

await fetchSavedPosts();
</script>

<style scoped></style>
