import { defineStore } from "pinia";
import { ref } from "vue";
import type { ApiResponse } from "~/types/api";
import type { Sticker, StickerPack } from "~/types/model";

export const useStickerStore = defineStore("sticker", () => {
  // state
  const stickerPacks = ref<StickerPack[]>([]);
  const stickers = ref<Record<string, Sticker[]>>({});
  const selectedPackId = ref<string | null>(null);
  const isSearchTabActive = ref(false);

  // actions
  async function fetchStickers() {
    if (stickerPacks.value.length > 0) return;
    try {
      const { data } = await useAPI<ApiResponse<StickerPack[]>>(
        "/api/sticker/packs",
        {
          method: "GET",
        }
      );

      if (data.value?.code === 200) {
        stickerPacks.value = data.value.data;

        if (stickerPacks.value.length > 0 && !selectedPackId.value) {
          selectedPackId.value = stickerPacks.value[0].id;
          await fetchStickersByPackId(stickerPacks.value[0].id);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchStickersByPackId(packId: string) {
    try {
      const { data } = await useAPI<ApiResponse<{ stickers: Sticker[] }>>(
        `/api/sticker/packs/${packId}`
      );

      if (data.value?.code === 200) {
        stickers.value[packId] = data.value.data.stickers;
      }
    } catch (error) {
      console.error(error);
    }
  }

  return {
    // state
    stickerPacks,
    stickers,
    selectedPackId,
    isSearchTabActive,
    // actions
    fetchStickers,
    fetchStickersByPackId,
  };
});
