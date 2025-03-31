<template>
  <div class="flex items-start space-x-3">
    <!-- Reply avatar -->
    <div class="w-8 h-8 rounded-full bg-gray-200">
      <img
        :src="
          reply.user.profile.avatarUrl ??
          'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
        "
        alt="Avatar"
        class="rounded-full w-full h-full object-cover"
      />
    </div>

    <!-- Reply content -->
    <div class="flex-1">
      <div
        class="rounded-lg px-4 py-2 w-fit bg-gray-100"
        :class="[
          reply.content ? 'bg-gray-100' : 'bg-white',
          reply.content && reply.image ? 'mb-2' : '',
        ]"
      >
        <div class="flex items-center space-x-2">
          <h3 class="font-semibold text-sm">{{ reply.user.profile.name }}</h3>
          <span class="text-xs text-gray-500">
            <FromNow :datetime="reply.createdAt"></FromNow>
          </span>
        </div>
        <div class="text-sm text-gray-700 mt-1">
          <div v-html="reply.content"></div>
        </div>
      </div>

      <!-- Hình ảnh -->
      <div v-if="reply.image" class="w-fit bg-white border rounded-lg">
        <PostImage
          :images="[{ url: reply.image, file: null }]"
          class="max-w-52 object-cover"
        />
      </div>
      <div v-if="reply.sticker">
        <img
          :src="reply.sticker.url"
          alt="Sticker"
          class="w-24 h-fit object-cover"
        />
      </div>
      <div class="text-sm mt-2" v-if="reply._count.reactions">
        {{ reply._count.reactions }} lượt thích
      </div>

      <!-- Reply actions -->
      <div class="flex space-x-4 mt-2 text-xs text-gray-500">
        <button
          class="hover:underline"
          @click="emit('likeComment', reply.id)"
          :class="[reply.isLiked ? 'text-blue-500' : 'text-zinc-500']"
        >
          {{ reply.isLiked ? "Đã thích" : "Thích" }}
        </button>
        <button class="hover:underline" @click="emit('toggleReply', commentId)">
          Trả lời
        </button>
        <button
          class="flex justify-center hover:bg-zinc-300 rounded-xl"
          @click="emit('showActionMenu', $event, reply)"
        >
          <Icon name="ph:dots-three" class="text-zinc-900 text-base"></Icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import type { Comment } from "~/types/model";
import FromNow from "../FromNow.vue";
import PostImage from "../Post/PostImage.vue";

const props = defineProps({
  reply: { type: Object as PropType<Comment>, required: true },
  commentId: { type: String, required: true },
});

const emit = defineEmits([
  "onLiked",
  "showActionMenu",
  "toggleReply",
  "likeComment",
]);
</script>
