<template>
  <div>
    <NuxtLayout name="default">
      <template #sidebar>
        <SidebarGroup></SidebarGroup>
      </template>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import SidebarGroup from "~/components/Sidebar/Group.vue";
</script>

<style></style>
