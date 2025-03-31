<template>
  <div>
    <div class="bg-white rounded-md p-4 pt-3 shadow-sm mb-4 last:mb-0">
      <div class="text-lg font-bold text-gray-700">Giới thiệu</div>
      <div class="mt-2">
        {{ groupStore.currentGroup?.description ?? "Chưa có lời giới thiệu." }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const groupStore = useGroupStore();

useHead({
  title: `Giới thiệu - ${groupStore.currentGroup?.name}`,
});
</script>

<style scoped></style>
