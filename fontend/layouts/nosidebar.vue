<template>
  <div class="h-screen">
    <NuxtLoadingIndicator color="#3d60fa" />
    <!-- Header -->
    <TheHeader></TheHeader>

    <!-- Main content wrapper -->
    <div class="flex h-[calc(100vh-64px)]">
      <!-- Main Content -->
      <div class="flex-1 bg-gray-100 overflow-y-auto">
        <slot></slot>
      </div>
    </div>

    <CreatePosts></CreatePosts>
  </div>
</template>

<script lang="ts" setup>
import TheHeader from "~/components/TheHeader.vue";
import CreatePosts from "~/components/CreatePosts.vue";
</script>

<style lang="scss">
.p-accordionheader {
  padding-top: 4px !important;
}
.p-accordioncontent-content {
  padding: 0 !important;
}
</style>
