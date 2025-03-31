<template>
  <div class="flex items-center justify-between bg-white">
    <div class="flex flex-1 justify-between sm:hidden">
      <button
        @click="page--"
        :disabled="page === 1"
        class="relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :class="page === 1 ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'"
      >
        Trước
      </button>
      <button
        @click="page++"
        :disabled="page === totalPages"
        class="relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :class="
          page === totalPages ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'
        "
      >
        Sau
      </button>
    </div>
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-gray-700">
          Hiển thị
          <span class="font-medium">{{ startItem }}</span>
          đến
          <span class="font-medium">{{ endItem }}</span>
          của
          <span class="font-medium">{{ totalItems }}</span>
          kết quả
        </p>
      </div>
      <div>
        <nav
          class="isolate inline-flex -space-x-px rounded-sm shadow-sm"
          aria-label="Pagination"
        >
          <button
            @click="page--"
            :disabled="page === 1"
            class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="sr-only">Previous</span>
            <Icon name="heroicons:chevron-left-20-solid" class="h-5 w-5" />
          </button>

          <template v-for="pageNum in displayedPages" :key="pageNum">
            <button
              v-if="pageNum !== '...'"
              @click="page = Number(pageNum)"
              :class="[
                pageNum === page
                  ? 'relative z-10 inline-flex items-center bg-blue-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                  : 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
              ]"
            >
              {{ pageNum }}
            </button>
            <span
              v-else
              class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
            >
              ...
            </span>
          </template>

          <button
            @click="page++"
            :disabled="page === totalPages"
            class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="sr-only">Next</span>
            <Icon name="heroicons:chevron-right-20-solid" class="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const page = defineModel<number>({ required: true, default: 1 });
const emit = defineEmits(["page-change"]);

const props = defineProps({
  totalItems: {
    type: Number,
    required: true,
  },
  perPage: {
    type: Number,
    required: true,
  },
});

watch(page, (newPage) => {
  emit("page-change", newPage);
});

const totalPages = computed(() => Math.ceil(props.totalItems / props.perPage));
const startItem = computed(() => (page.value - 1) * props.perPage + 1);
const endItem = computed(() =>
  Math.min(page.value * props.perPage, props.totalItems)
);

const displayedPages = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;

  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    if (page.value <= 3) {
      for (let i = 1; i <= 4; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(totalPages.value);
    } else if (page.value >= totalPages.value - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages.value - 3; i <= totalPages.value; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = page.value - 1; i <= page.value + 1; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(totalPages.value);
    }
  }

  return pages;
});
</script>
