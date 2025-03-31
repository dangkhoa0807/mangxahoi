<template>
  <div>
    <div class="mx-auto w-full 2xl:w-10/12 px-4">
      <div class="mt-4">
        <div class="text-3xl font-semibold mb-2">Cài đặt</div>
        <hr />

        <div class="grid grid-cols-12 gap-4 mt-4 text-base">
          <div class="col-span-12 lg:col-span-4 xl:col-span-3">
            <div class="bg-white rounded-md p-4 shadow-sm flex flex-col gap-1">
              <NuxtLink
                to="/settings/account"
                exactActiveClass="text-blue-600 bg-blue-600/20"
                class="flex gap-3 items-center text-md cursor-pointer hover:bg-blue-500/20 p-2 px-3 hover:text-blue-600 rounded-md"
              >
                <Icon name="tabler:user-cog"></Icon>
                <div>Tài khoản</div>
              </NuxtLink>
              <NuxtLink
                to="/settings/profile"
                exactActiveClass="text-blue-600 bg-blue-600/20"
                class="flex gap-3 items-center text-md cursor-pointer hover:bg-blue-500/20 hover:text-blue-600 p-2 px-3 rounded-md"
              >
                <Icon name="tabler:user-hexagon"></Icon>
                <div>Trang cá nhân</div>
              </NuxtLink>
              <NuxtLink
                to="/settings/privacy"
                exactActiveClass="text-blue-600 bg-blue-600/20"
                class="flex gap-3 items-center text-md cursor-pointer hover:bg-blue-500/20 hover:text-blue-600 p-2 px-3 rounded-md"
              >
                <Icon name="tabler:lock-cog"></Icon>
                <div>Quyền riêng tư</div>
              </NuxtLink>
              <NuxtLink
                to="/settings/notifications"
                exactActiveClass="text-blue-600 bg-blue-600/20"
                class="flex gap-3 items-center text-md cursor-pointer hover:bg-blue-500/20 hover:text-blue-600 p-2 px-3 rounded-md"
              >
                <Icon name="tabler:bell-cog"></Icon>
                <div>Thông báo</div>
              </NuxtLink>
              <NuxtLink
                to="/settings/blocked"
                exactActiveClass="text-blue-600 bg-blue-600/20"
                class="flex gap-3 items-center text-md cursor-pointer hover:bg-blue-500/20 hover:text-blue-600 p-2 px-3 rounded-md"
              >
                <Icon name="tabler:flag-cog"></Icon>
                <div>Chặn người dùng</div>
              </NuxtLink>
              <NuxtLink
                to="/settings/devices"
                exactActiveClass="text-blue-600 bg-blue-600/20"
                class="flex gap-3 items-center text-md cursor-pointer hover:bg-blue-500/20 hover:text-blue-600 p-2 px-3 rounded-md"
              >
                <Icon name="tabler:device-mobile"></Icon>
                <div>Thiết bị</div>
              </NuxtLink>
            </div>
          </div>
          <div class="col-span-12 lg:col-span-8 xl:col-span-9">
            <NuxtPage></NuxtPage>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "default",
  middleware: ["auth"],
});
</script>

<style scoped></style>
