<template>
  <div>
    <div v-if="!loading">
      <!-- Group content -->
      <NuxtPage />
    </div>
    <div v-else>Loading...</div>
  </div>
</template>

<script setup lang="ts">
// Sử dụng Pinia
const groupStore = useGroupStore();
const route = useRoute();

// Hoặc sử dụng Composable
const { currentGroup, loading, fetchGroup } = useGroupStore();

// Fetch data khi route thay đổi
watch(
  () => route.params.slug,
  async (newSlug) => {
    if (newSlug) {
      await fetchGroup(newSlug as string);
    }
  },
  { immediate: true }
);
</script>

<style scoped></style>
