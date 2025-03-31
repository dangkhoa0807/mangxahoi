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

      <!-- Bình luận bị tố cáo -->
      <div>
        <div class="font-semibold mb-1">
          Bình luận bị tố cáo ({{ comment._count.reports }} lượt tố cáo)
        </div>
        <div
          class="flex items-start space-x-3 mb-2 last:mb-0 mt-4"
          :key="comment.id"
        >
          <!-- User avatar -->
          <div class="w-11 h-11 rounded-full bg-gray-200">
            <img
              :src="
                comment.user.profile.avatarUrl ??
                'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
              "
              alt="Avatar"
              class="rounded-full w-full h-full object-cover"
            />
          </div>

          <!-- Comment content -->
          <div class="flex-1">
            <div class="bg-gray-100 rounded-lg px-4 py-2">
              <div class="flex items-center space-x-2">
                <h3 class="font-semibold text-sm">
                  {{ comment.user.profile.name }}
                </h3>
                <span class="text-xs text-gray-500">
                  <FromNow :datetime="comment.createdAt"></FromNow>
                </span>
              </div>
              <div class="text-sm text-gray-700 mt-1">
                <div v-html="comment.content"></div>
              </div>
            </div>
            <div class="text-sm mt-2" v-if="comment._count.reactions">
              {{ comment._count.reactions }} lượt thích
            </div>
          </div>
        </div>
      </div>

      <!-- Hành động -->
      <div class="flex justify-end gap-2 mt-4" v-if="status === 'PENDING'">
        <Button
          type="button"
          label="Giữ lại"
          severity="secondary"
          :outlined="true"
          @click="showKeepDialog = true"
        />
        <Button
          type="button"
          severity="danger"
          label="Gỡ bình luận"
          @click="showRemoveDialog = true"
        />
      </div>
    </div>

    <CommentAdminDelete
      v-model="showRemoveDialog"
      :id="id"
      :show-penalty-options="true"
      @removed="$emit('removed', id)"
    />

    <CommentAdminKeep
      v-model="showKeepDialog"
      :id="id"
      @kept="$emit('kept', id)"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import { DEFAULT_AVATAR_URL, type Comment, type User } from "~/types/model";
import FromNow from "../FromNow.vue";
import CommentAdminDelete from "./Dialog/AdminDelete.vue";
import CommentAdminKeep from "./Dialog/AdminKeep.vue";

defineProps({
  id: { type: String, required: true },
  comment: { type: Object as PropType<Comment>, required: true },
  user: { type: Object as PropType<User>, required: true },
  status: { type: String, required: true },
  reason: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: String, required: true },
});

const emit = defineEmits(["kept", "removed"]);
const showRemoveDialog = ref(false);
const showKeepDialog = ref(false);
</script>
