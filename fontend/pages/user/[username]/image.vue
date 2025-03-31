<template>
  <div class="bg-white p-4 rounded-md shadow-sm mb-4 gap-3">
    <div class="font-semibold text-lg text-zinc-800">Hinh ảnh</div>

    <div class="grid grid-cols-12 gap-3 w-full mt-4">
      <div class="col-span-12" v-if="!images.length">
        Người dùng chưa đăng ảnh nào.
      </div>
      <div
        class="col-span-6 sm:col-span-3 md:col-span-4 lg:col-span-3 xl:col-span-3 2xl:col-span-2"
        v-for="image in images"
      >
        <ImageVue
          class="w-full aspect-square object-cover rounded-md"
          alt="Thumbs"
          format="avif"
          quality="80"
          preview
        >
          <template #image>
            <img
              :src="image.url"
              alt="image"
              class="w-full max-h-600px object-cover rounded-sm"
            />
          </template>
          <template #preview="slotProps">
            <img
              class="container w-full rounded-sm"
              :src="image.url"
              alt="preview"
              :style="slotProps.style"
            />
          </template>
        </ImageVue>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ImageVue from "primevue/image";

import type { ApiResponse } from "~/types/api";
import type { Image } from "~/types/model";

const images = ref<Image[]>([]);
const route = useRoute();

async function fetchImages() {
  const { data } = await useAPI<
    ApiResponse<{
      list: Image[];
      hasMore: boolean;
    }>
  >(`/api/user/${route.params.username}/images`, {
    method: "GET",
    watch: false,
  });

  if (data.value?.code == 200) {
    images.value = data.value.data.list;
  }
}

await Promise.all([fetchImages()]);
</script>

<style scoped></style>
