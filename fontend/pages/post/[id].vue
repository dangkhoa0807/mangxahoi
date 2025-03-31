<template>
  <div></div>
</template>

<script setup lang="ts">
const route = useRoute();

navigateTo(`/?postId=${route.params.id}`);
</script>

<style scoped></style>
