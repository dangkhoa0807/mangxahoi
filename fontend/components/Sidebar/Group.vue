<script lang="ts" setup></script>

<template>
  <div
    class="w-64 h-[calc(100vh-64px)] sticky top-16 hidden md:block overflow-y-auto"
  >
    <div
      id="sidebar"
      class="bg-white h-screen text-gray-800 p-6 absolute md:relative z-40 transform -translate-x-full md:translate-x-0 transition-transform duration-200 ease-in-out md:h-auto"
    >
      <ul>
        <li class="mb-2">
          <NuxtLink
            href="/"
            class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200"
          >
            <div>
              <svg
                class="w-6 h-6 text-gray-700"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.293 3.293a1 1 0 0 1 1.414 0l6 6 2 2a1 1 0 0 1-1.414 1.414L19 12.414V19a2 2 0 0 1-2 2h-3a1 1 0 0 1-1-1v-3h-2v3a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2v-6.586l-.293.293a1 1 0 0 1-1.414-1.414l2-2 6-6Z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            Trang chủ</NuxtLink
          >
        </li>
        <li class="mb-2">
          <NuxtLink
            href="/groups"
            class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200"
          >
            <Icon name="ph:list-dashes-fill" class="text-2xl"></Icon>
            Bài viết</NuxtLink
          >
        </li>
        <li class="mb-2">
          <NuxtLink
            href="/groups/discover"
            class="group flex items-center gap-4 py-2 px-4 rounded hover:bg-gray-200"
          >
            <Icon
              name="material-symbols:explore-outline"
              class="text-2xl"
            ></Icon>
            Khám phá</NuxtLink
          >
        </li>
        <li class="mb-2">
          <NuxtLink
            href="/groups/joins"
            class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200"
          >
            <div>
              <svg
                class="w-6 h-6 text-gray-700"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                  d="M4.5 17H4a1 1 0 0 1-1-1 3 3 0 0 1 3-3h1m0-3.05A2.5 2.5 0 1 1 9 5.5M19.5 17h.5a1 1 0 0 0 1-1 3 3 0 0 0-3-3h-1m0-3.05a2.5 2.5 0 1 0-2-4.45m.5 13.5h-7a1 1 0 0 1-1-1 3 3 0 0 1 3-3h3a3 3 0 0 1 3 3 1 1 0 0 1-1 1Zm-1-9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
                />
              </svg>
            </div>
            Nhóm của bạn</NuxtLink
          >
        </li>
      </ul>
    </div>
  </div>
</template>
