<template>
  <div>
    <!-- Posts Interact Count -->
    <div class="flex justify-between">
      <div
        class="hover:underline cursor-pointer"
        @click="showReactionUsers = true"
      >
        {{ post._count.reactions ? `${post._count.reactions} tương tác` : `` }}
      </div>
      <div class="flex gap-3">
        <div class="hover:underline cursor-pointer">
          {{ post._count.comments }} bình luận
        </div>
        <div class="hover:underline cursor-pointer">
          {{ post._count.shares }} chia sẽ
        </div>
      </div>
    </div>

    <PostReactions v-model="showReactionUsers" :post="post" />
  </div>
</template>

<script setup lang="ts">
import type { Post } from "~/types/model";
import PostReactions from "./PostReactions.vue";

const props = defineProps({
  post: { type: Object as PropType<Post>, required: true },
});

const showReactionUsers = ref(false);
</script>

<style scoped></style>
