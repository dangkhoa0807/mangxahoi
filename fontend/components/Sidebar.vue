<template>
  <ul id="sidebar">
    <li class="mb-2">
      <NuxtLink
        href="/"
        class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200"
      >
        <Icon name="tabler:home" class="text-2xl"></Icon>

        Trang chủ</NuxtLink
      >
    </li>
    <li class="mb-2" v-if="auth.user">
      <NuxtLink
        href="/friends"
        class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200"
      >
        <Icon name="tabler:users" class="text-2xl"></Icon>

        Bạn bè</NuxtLink
      >
    </li>
    <li class="mb-2" v-if="auth.user">
      <NuxtLink
        href="/saved"
        class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200"
      >
        <Icon name="tabler:bookmark-filled" class="text-2xl"></Icon>

        Đã lưu</NuxtLink
      >
    </li>
    <li class="mb-2">
      <NuxtLink
        href="/groups"
        class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200"
      >
        <Icon name="tabler:users-group" class="text-2xl"></Icon>

        Hội nhóm</NuxtLink
      >
    </li>

    <li class="mb-2" v-if="auth.user">
      <NuxtLink
        href="/conversations"
        class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200"
      >
        <Icon name="tabler:message" class="text-2xl"></Icon>

        Trò chuyện</NuxtLink
      >
    </li>
  </ul>

  <Divider v-if="auth.user && auth.isAdmin" />

  <div class="text-sm font-semibold" v-if="auth.user && auth.isAdmin">
    Quản trị viên
  </div>

  <ul id="sidebar" class="mt-2" v-if="auth.user && auth.isAdmin">
    <li class="mb-2">
      <NuxtLink
        href="/admin/analytics"
        class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200"
      >
        <Icon name="tabler:chart-bar" class="text-2xl"></Icon>

        Thống kê</NuxtLink
      >
    </li>
    <li class="mb-2">
      <NuxtLink
        href="/admin/users"
        class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200"
      >
        <Icon name="tabler:users" class="text-2xl"></Icon>

        Người dùng</NuxtLink
      >
    </li>
    <li class="mb-2">
      <NuxtLink
        href="/admin/bans"
        class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200"
      >
        <Icon name="tabler:ban" class="text-2xl"></Icon>

        Tài khoản vi phạm</NuxtLink
      >
    </li>
    <li class="mb-2">
      <DropdownMenu
        label="Sticker"
        icon="tabler:list-check"
        :active="isStickersActive"
      >
        <NuxtLink
          href="/admin/stickers"
          class="block py-2 px-4 rounded hover:bg-gray-200"
        >
          Danh sách
        </NuxtLink>
        <NuxtLink
          href="/admin/stickers/packs"
          class="block py-2 px-4 rounded hover:bg-gray-200"
        >
          Bộ sticker
        </NuxtLink>
      </DropdownMenu>
    </li>

    <li class="mb-2">
      <DropdownMenu
        label="Báo cáo"
        icon="tabler:list-check"
        :active="isReportsActive"
      >
        <NuxtLink
          href="/admin/reports/posts"
          class="block py-2 px-4 rounded hover:bg-gray-200"
        >
          Bài viết
        </NuxtLink>
        <NuxtLink
          href="/admin/reports/comments"
          class="block py-2 px-4 rounded hover:bg-gray-200"
        >
          Bình luận
        </NuxtLink>
      </DropdownMenu>
    </li>
  </ul>

  <Divider></Divider>
  <ul id="sidebar">
    <li class="mb-2">
      <NuxtLink
        href="/terms"
        class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200"
      >
        <Icon name="tabler:file-description" class="text-2xl"></Icon>

        Điều khoản
      </NuxtLink>
    </li>

    <li class="mb-2">
      <NuxtLink
        href="/privacy"
        class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200"
      >
        <Icon name="tabler:shield-lock" class="text-2xl"></Icon>

        Chính sách</NuxtLink
      >
    </li>

    <li class="mb-2">
      <NuxtLink
        href="/about"
        class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200"
      >
        <Icon name="tabler:info-circle" class="text-2xl"></Icon>

        Về chúng tôi</NuxtLink
      >
    </li>
  </ul>
</template>

<script setup lang="ts">
import DropdownMenu from "~/components/DropdownMenu.vue";

const route = useRoute();
const auth = useAuth();

// Check if current route is a reports route
const isReportsActive = computed(() => {
  return route.path.startsWith("/admin/reports");
});

const isStickersActive = computed(() => {
  return route.path.startsWith("/admin/stickers");
});
</script>
