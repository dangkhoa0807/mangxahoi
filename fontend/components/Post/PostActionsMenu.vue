<template>
  <div class="flex flex-col gap-1" v-if="auth.user">
    <div
      class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
      @click="$emit('savePost')"
    >
      <Icon name="stash:save-ribbon" class="text-2xl text-zinc-600"></Icon>
      Lưu bài viết
    </div>

    <div
      class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
      v-if="auth.user && userId != auth.user.profile.id"
      @click="$emit('hidePost')"
    >
      <Icon name="tabler:eye-off" class="text-2xl text-zinc-600"> </Icon>
      Ẩn bài viết
    </div>

    <div
      class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
      @click="$emit('report')"
      v-if="userId != auth.user.id"
    >
      <Icon name="material-symbols:report" class="text-2xl text-zinc-600">
      </Icon>
      Báo cáo
    </div>

    <hr v-if="auth.user && userId == auth.user.profile.id" />

    <div
      v-if="auth.user && userId == auth.user.profile.id"
      class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
      @click="$emit('delete')"
    >
      <Icon
        name="material-symbols:delete-outline"
        class="text-2xl text-gray-600"
      ></Icon>
      Gỡ bài viết
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  userId: { type: String, required: true },
});

const emit = defineEmits(["savePost", "hidePost", "report", "delete"]);
const auth = useAuth();
</script>
