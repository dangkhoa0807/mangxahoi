<template>
  <div class="bg-white rounded-lg p-4 shadow-sm mb-4">
    <div class="flex flex-col gap-4">
      <!-- Người tố cáo -->
      <div class="flex justify-between items-center">
        <div class="text-sm font-medium">#{{ id }}</div>

        <div v-if="status === 'PENDING'" class="text-blue-500">Chưa xử lý</div>
        <div v-else-if="status === 'RESOLVED'" class="text-green-500">
          Đã xử lý
        </div>
        <div v-else class="text-red-500">Đã từ chối</div>
      </div>

      <div
        class="bg-gray-50 p-3 rounded-lg flex flex-col gap-3 border border-zinc-300"
      >
        <!-- Người tố cáo -->
        <NuxtLink
          :to="`/user/${user.id}`"
          class="flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <img
              :src="user.profile?.avatarUrl ?? DEFAULT_AVATAR_URL"
              class="w-10 h-10 rounded-full object-cover"
              :alt="user.profile?.name"
            />
            <div>
              <div class="font-medium">{{ user.profile?.name }}</div>
              <div class="text-sm text-gray-600">
                Đã tố cáo bài viết với lý do: {{ reason }}
              </div>
            </div>
          </div>
          <div class="text-sm text-gray-500">
            <FromNow :datetime="createdAt" />
          </div>
        </NuxtLink>

        <hr v-if="description" />

        <!-- Chi tiết tố cáo -->
        <div v-if="description">
          <span class="text-sm font-medium mb-2">Mô tả: </span>
          <span class="text-sm">{{ description }}</span>
        </div>
      </div>

      <hr />

      <!-- Nội dung bài viết -->
      <div class="flex justify-between items-center">
        <PostHeader
          :show-close="false"
          :post="post"
          :show-action-menu="false"
        ></PostHeader>
        <div class="text-sm text-gray-500 text-end">
          ({{ post._count.reports }} lượt tố cáo)
        </div>
      </div>

      <hr />

      <div v-if="post.title || post.content">
        <h3 class="font-semibold text-lg" v-if="post.title">
          {{ post.title }}
        </h3>
        <div v-html="post.content" v-if="post.content"></div>
      </div>

      <PostImage v-if="post.images.length" :images="post.images"></PostImage>

      <!-- Bài viết được chia sẻ -->
      <div
        v-if="post.originalPost"
        class="border rounded-md p-4 flex flex-col gap-3"
      >
        <div v-if="post.originalPost.title || post.originalPost.content">
          <h3 class="font-semibold text-lg" v-if="post.originalPost.title">
            {{ post.originalPost.title }}
          </h3>
          <div
            v-html="post.originalPost.content"
            v-if="post.originalPost.content"
          ></div>
        </div>
        <PostImage
          v-if="post.originalPost.images.length"
          :images="post.originalPost.images"
        ></PostImage>

        <hr />

        <PostHeader
          :show-close="false"
          :show-action-menu="false"
          :post="post.originalPost"
        ></PostHeader>
      </div>

      <!-- Tags -->
      <div v-if="post.hashTags.length">
        <span>Tags: </span>
        <span
          v-for="(hashtag, index) in post.hashTags"
          class="text-blue-500 hover:underline cursor-pointer me-1"
        >
          #{{ hashtag.hashtag.name
          }}<span v-if="index < post.hashTags.length - 1" class="text-zinc-700"
            >,</span
          >
        </span>
      </div>

      <!-- Hành động -->
      <div class="flex justify-end gap-3" v-if="status === 'PENDING'">
        <Button
          severity="primary"
          label="Giữ bài viết"
          @click="showKeepDialog = true"
        />
        <Button
          severity="danger"
          label="Gỡ bài/Phạt"
          @click="showRemoveDialog = true"
        />
      </div>

      <AdminDelete
        v-model="showRemoveDialog"
        :id="id"
        :show-penalty-options="true"
        @removed="$emit('removed', id)"
      />

      <AdminKeep v-model="showKeepDialog" :id="id" @kept="$emit('kept', id)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from "vue";
import { DEFAULT_AVATAR_URL, type Post, type User } from "~/types/model";
import FromNow from "../FromNow.vue";
import PostImage from "./PostImage.vue";
import PostHeader from "./PostHeader.vue";
import AdminDelete from "./Dialog/AdminDelete.vue";
import AdminKeep from "./Dialog/AdminKeep.vue";

const showRemoveDialog = ref(false);
const showKeepDialog = ref(false);

defineProps({
  id: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: String,
    required: true,
  },
  post: {
    type: Object as PropType<Post>,
    required: true,
  },
  user: {
    type: Object as PropType<User>,
    required: true,
  },
});

defineEmits(["removed", "kept"]);
</script>
