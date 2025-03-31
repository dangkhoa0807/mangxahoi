<template>
  <!-- Create Posts -->
  <div class="bg-white p-4 rounded-lg mb-4 gap-3 flex md:md-0" v-if="auth.user">
    <div class="h-11 w-11 flex-shrink-0">
      <img
        class="w-full rounded-full"
        :src="
          auth.user.profile.avatarUrl ??
          `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
        "
        alt="Avatar"
      />
    </div>
    <div
      class="text-gray-500 bg-zinc-100 p-2 px-4 rounded-md cursor-pointer w-full truncate flex items-center"
      @click="createPost.showDialog()"
    >
      Bạn muốn chia sẽ điều gì?
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuth();
const createPost = useCreatePost();
</script>

<style scoped></style>
