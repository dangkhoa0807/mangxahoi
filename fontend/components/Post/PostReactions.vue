<template>
  <Dialog
    v-model:visible="model"
    modal
    :show-header="false"
    :pt="{
      root: 'pt-4',
      content: 'pb-4',
    }"
    :style="{ width: '34rem' }"
    dismissableMask
  >
    <div class="flex justify-between items-center sticky top-0 bg-white pb-3">
      <div class="text-xl text-gray-800">Những người đã bày tỏ cảm xúc</div>
      <div class="flex items-center gap-4">
        <div
          class="hover:bg-gray-100 rounded-full transition duration-150 ease-in-out cursor-pointer w-7 h-7 flex items-center justify-center"
          @click="model = false"
        >
          <Icon name="tabler:x" class="text-2xl"></Icon>
        </div>
      </div>
    </div>
    <hr />

    <div class="flex gap-2 mt-4">
      <div
        v-for="type in reactionTypes"
        :key="type"
        class="px-3 py-1 rounded-full cursor-pointer"
        :class="selectedType === type ? 'bg-gray-200' : 'hover:bg-gray-100'"
        @click="handleTypeSelect(type)"
      >
        <div class="flex items-center gap-1">
          <img :src="getReactionImage(type)" class="w-5 h-5" />
          <span :class="getReactionClass(type)">{{ counter[type] || 0 }}</span>
        </div>
      </div>
    </div>

    <div class="mt-4 max-h-[400px] overflow-y-auto">
      <template v-if="loading && !reactions.length">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3 p-2">
          <div class="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          <div class="flex-1">
            <div class="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div class="h-3 bg-gray-200 rounded w-20 mt-2 animate-pulse"></div>
          </div>
          <div class="w-6 h-6 rounded-full bg-gray-200 animate-pulse"></div>
        </div>
      </template>

      <template v-else>
        <div v-if="!reactions.length">
          <div class="text-center text-gray-500">Chưa có ai bày tỏ cảm xúc</div>
        </div>
        <NuxtLink
          v-else
          v-for="reaction in reactions"
          :key="reaction.user.id"
          :to="`/user/${reaction.user.id}`"
          class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md"
        >
          <img
            :src="reaction.user.profile.avatarUrl || DEFAULT_AVATAR_URL"
            class="w-10 h-10 rounded-full object-cover"
          />
          <div class="flex-1">
            <div class="font-semibold">{{ reaction.user.profile.name }}</div>
            <div class="text-xs text-gray-500">
              <FromNow :datetime="reaction.createdAt" />
            </div>
          </div>
          <img :src="getReactionImage(reaction.type)" class="w-6 h-6" />
        </NuxtLink>
      </template>

      <div v-if="hasMore" class="text-center mt-4">
        <Button
          label="Xem thêm"
          @click="loadMore"
          :loading="loading"
          severity="secondary"
          size="small"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import {
  DEFAULT_AVATAR_URL,
  type Pagination,
  type Post,
  type Reaction,
} from "@/types/model";
import type { ApiResponse } from "~/types/api";

import FromNow from "~/components/FromNow.vue";

const model = defineModel<boolean>({ required: true });

const props = defineProps({
  post: { type: Object as PropType<Post>, required: true },
});

// Cache reactions by type
const reactionsByType = ref<Record<string, Reaction[]>>({
  ALL: [],
  LIKE: [],
  LOVE: [],
  HAHA: [],
  WOW: [],
  SAD: [],
  ANGRY: [],
});

const selectedType = ref<string>("ALL");
const counter = ref<Record<string, number>>({
  ALL: 0,
  LIKE: 0,
  LOVE: 0,
  HAHA: 0,
  WOW: 0,
  SAD: 0,
  ANGRY: 0,
});

// Track pagination state for each type
const paginationState = ref<Record<string, { page: number; hasMore: boolean }>>(
  {
    ALL: { page: 1, hasMore: false },
    LIKE: { page: 1, hasMore: false },
    LOVE: { page: 1, hasMore: false },
    HAHA: { page: 1, hasMore: false },
    WOW: { page: 1, hasMore: false },
    SAD: { page: 1, hasMore: false },
    ANGRY: { page: 1, hasMore: false },
  }
);

const loading = ref(false);
const reactionTypes = ["ALL", "LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"];

// Tính toán reactions dựa trên selectedType
const reactions = computed(
  () => reactionsByType.value[selectedType.value] || []
);
const hasMore = computed(
  () => paginationState.value[selectedType.value]?.hasMore || false
);

async function fetchReactions(type: string, page = 1, append = false) {
  if (loading.value) return;
  loading.value = true;

  try {
    const { data: response } = await useAPI<
      ApiResponse<{
        list: Reaction[];
        counter: Record<string, number>;
        pagination: Pagination;
      }>
    >(`/api/post/${props.post.id}/reactions`, {
      method: "GET",
      query: {
        type,
        page,
      },
    });

    if (response.value?.code === 200) {
      // Kiểm tra nếu counter thay đổi
      const hasCounterChanged = Object.entries(
        response.value.data.counter
      ).some(([key, value]) => counter.value[key] !== value);

      // Nếu counter thay đổi, reset tất cả dữ liệu đã fetch
      if (hasCounterChanged) {
        Object.keys(reactionsByType.value).forEach((key) => {
          reactionsByType.value[key] = [];
          paginationState.value[key] = { page: 1, hasMore: false };
        });
        append = false; // Không append dữ liệu mới khi counter thay đổi
      }

      if (append) {
        reactionsByType.value[type] = [
          ...reactionsByType.value[type],
          ...response.value.data.list,
        ];
      } else {
        reactionsByType.value[type] = response.value.data.list;
      }

      counter.value = response.value.data.counter;
      paginationState.value[type] = {
        page,
        hasMore: response.value.data.pagination.hasMore,
      };
    }
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  const currentType = selectedType.value;
  const currentState = paginationState.value[currentType];
  await fetchReactions(currentType, currentState.page + 1, true);
}

// Handle type selection
async function handleTypeSelect(type: string) {
  selectedType.value = type;
  // Only fetch if we haven't loaded this type before
  if (!reactionsByType.value[type].length) {
    await fetchReactions(type, 1);
  }
}

// Initial load when dialog opens
async function onDialogShow() {
  if (!reactionsByType.value.ALL.length) {
    await fetchReactions("ALL", 1);
  }
}

// Replace your existing watch with the new handler
watch(model, async (newValue) => {
  if (newValue) {
    await onDialogShow();
  }
});

function getReactionClass(type: string) {
  switch (type) {
    case "LIKE":
      return "text-blue-500";
    case "LOVE":
      return "text-red-500";
    case "HAHA":
    case "WOW":
    case "SAD":
    case "ANGRY":
      return "text-yellow-500";
    default:
      return "text-zinc-800";
  }
}

function getReactionImage(type: string) {
  switch (type) {
    case "ALL":
      return "https://s3.cloudfly.vn/shoperis/2024/12/170f7762bff14b214f0dc2da341419e4.avif";
    case "LIKE":
      return "https://s3.cloudfly.vn/shoperis/2024/12/61cd374ade627f125b88073c04c2b5e5.avif";
    case "LOVE":
      return "https://s3.cloudfly.vn/shoperis/2024/12/c9ddf4feaef1236318ecec9351818e96.avif";
    case "HAHA":
      return "https://s3.cloudfly.vn/shoperis/2024/12/10676dfd6334ab2f6d2355166e6ae31b.avif";
    case "SAD":
      return "https://s3.cloudfly.vn/shoperis/2024/12/9b67e1f2fb1ec9ea0cbaa48939ba7f58.avif";
    case "WOW":
      return "https://s3.cloudfly.vn/shoperis/2024/12/0038ee1bb2a9e1cad5462d191cc1f865.avif";
    case "ANGRY":
      return "https://s3.cloudfly.vn/shoperis/2024/12/7419aeeccc4b58b97feb1af50a0f2425.avif";
    default:
      return "https://s3.cloudfly.vn/shoperis/2024/12/8b76a2a1425f6e10ed7dd20f0402b052.avif";
  }
}
</script>
