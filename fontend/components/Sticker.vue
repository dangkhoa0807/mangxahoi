<template>
  <div class="sticker-picker overflow-hidden">
    <!-- Sticker packs -->

    <div class="border-b">
      <div class="flex">
        <div class="min-w-0 w-full h-14">
          <Swiper
            :modules="[Navigation]"
            :slides-per-view="6"
            :navigation="true"
            class="h-14"
          >
            <!-- Tab tìm kiếm -->
            <SwiperSlide>
              <div
                @click="activateSearch"
                class="p-2 cursor-pointer hover:bg-gray-100 transition h-full aspect-square"
                :class="{ 'bg-gray-100': stickerStore.isSearchTabActive }"
              >
                <div class="flex items-center justify-center h-full">
                  <Icon name="tabler:search" class="text-gray-500 text-2xl" />
                </div>
              </div>
            </SwiperSlide>
            <!-- Existing slides -->
            <SwiperSlide
              v-for="pack in stickerStore.stickerPacks"
              :key="pack.id"
            >
              <div
                @click="selectPack(pack)"
                class="p-2 cursor-pointer hover:bg-gray-100 transition h-full aspect-square"
                :class="{
                  'bg-gray-100': stickerStore.selectedPackId === pack.id,
                }"
              >
                <img
                  :src="pack.coverUrl"
                  class="rounded-md object-cover w-full h-full object-center"
                  :alt="pack.name"
                />
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
        <!-- <div
            class="bg-white hover:bg-gray-100 flex items-center justify-center shrink-0 aspect-square cursor-pointer"
          >
            <Icon name="tabler:plus" class="text-gray-500 text-2xl" />
          </div> -->
      </div>
    </div>

    <!-- Sticker grid -->
    <div class="p-2 overflow-y-auto" style="height: 300px">
      <div v-if="stickerStore.isSearchTabActive" class="mb-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm kiếm..."
          class="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:border-blue-500"
          ref="searchInput"
        />
      </div>

      <div v-if="loading" class="grid grid-cols-4 gap-2">
        <div
          v-for="n in 12"
          :key="n"
          class="aspect-square rounded-lg bg-gray-200 animate-pulse"
        ></div>
      </div>

      <div
        v-else-if="
          getStickersByPackId(stickerStore.selectedPackId ?? '').length === 0
        "
        class="text-center py-4 text-gray-500"
      >
        Không tìm thấy sticker nào
      </div>

      <div v-else class="grid grid-cols-4 gap-2">
        <div
          v-for="sticker in getStickersByPackId(
            stickerStore.selectedPackId ?? ''
          )"
          :key="sticker.id"
          @click="selectSticker(sticker)"
          class="aspect-square rounded-lg cursor-pointer hover:bg-gray-100 transition"
        >
          <img
            :src="sticker.url"
            class="w-full h-full object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Sticker, StickerPack } from "~/types/model";
import { Navigation } from "swiper/modules";
import type { ApiResponse } from "~/types/api";

// Use the store
const stickerStore = useStickerStore();

// Add search results state
const searchQuery = ref("");
const searchResults = ref<Sticker[]>([]);
const loading = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);

// Methods
async function selectPack(pack: StickerPack) {
  stickerStore.isSearchTabActive = false;
  stickerStore.selectedPackId = pack.id;
  loading.value = true;

  if (stickerStore.stickers[pack.id]) {
    loading.value = false;
  } else {
    await stickerStore.fetchStickersByPackId(pack.id);
    loading.value = false;
  }
}

function getStickersByPackId(packId: string) {
  if (stickerStore.isSearchTabActive) {
    return searchResults.value;
  }
  return stickerStore.stickers[packId] ?? [];
}

function selectSticker(sticker: Sticker) {
  emit("select", sticker);
}

function activateSearch() {
  stickerStore.isSearchTabActive = true;
  stickerStore.selectedPackId = null;
  searchResults.value = [];
  searchQuery.value = "";
  nextTick(() => {
    searchInput.value?.focus();
  });
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  loading.value = true;
  try {
    const { data } = await useAPI<ApiResponse<{ list: Sticker[] }>>(
      `/api/sticker/search`,
      {
        method: "GET",
        params: {
          search: searchQuery.value,
          limit: 48,
        },
      }
    );

    if (data.value?.code === 200) {
      searchResults.value = data.value.data.list;
    }
  } catch (error) {
    console.error("Error searching stickers:", error);
    searchResults.value = [];
  } finally {
    loading.value = false;
  }
}

const debouncedSearch = useDebounce(handleSearch, 500);

// Add watch for search query
watch(searchQuery, () => {
  debouncedSearch();
});

onMounted(async () => {
  stickerStore.fetchStickers();
});

// Emits
const emit = defineEmits(["select"]);
</script>

<style scoped lang="scss">
.sticker-picker {
  position: relative;
}

:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 20px;
  height: 20px;
  color: #666;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(50%);
}

:deep(.swiper-button-next)::after,
:deep(.swiper-button-prev)::after {
  font-size: 12px;
  font-weight: bold;
}

:deep(.swiper-button-disabled) {
  opacity: 0;
}
</style>
