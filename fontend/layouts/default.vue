<template>
  <div class="relative">
    <NuxtLoadingIndicator color="#3d60fa" />

    <!-- Header -->
    <KeepAlive>
      <TheHeader class="sticky top-0 z-50"></TheHeader>
    </KeepAlive>

    <div class="flex w-full">
      <!-- Sidebar -->
      <slot name="sidebar" v-if="auth.user">
        <div
          class="w-64 h-[calc(100vh-64px)] sticky top-16 hidden md:block overflow-y-auto shrink-0"
        >
          <div
            id="sidebar"
            class="bg-white h-screen text-gray-800 p-6 absolute md:relative z-40 transform -translate-x-full md:translate-x-0 transition-transform duration-200 ease-in-out md:h-auto"
          >
            <Sidebar></Sidebar>
          </div>
        </div>
      </slot>

      <!-- Main Content -->
      <div class="flex-1 bg-gray-100 p-4 w-full min-w-0">
        <NuxtPage />
      </div>
    </div>

    <!-- Overlay for Mobile -->
    <div
      id="overlay"
      class="hidden fixed inset-0 bg-black opacity-50 z-30"
    ></div>

    <CreatePosts></CreatePosts>
  </div>
</template>

<script lang="ts" setup>
import TheHeader from "~/components/TheHeader.vue";
import CreatePosts from "~/components/CreatePosts.vue";
import Sidebar from "~/components/Sidebar.vue";

const auth = useAuth();
</script>

<style lang="scss">
.p-accordionheader {
  padding-top: 4px !important;
}
.p-accordioncontent-content {
  padding: 0 !important;
}
</style>
