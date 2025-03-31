import { defineStore } from "pinia";

export const useCreatePost = defineStore("post", () => {
  const groupId = ref();
  const privacy = ref("PUBLIC");
  const hashtag = ref();
  const isActive = ref(false);

  function showDialog(
    _groupId: string | null = null,
    _privacy: string = "PUBLIC"
  ) {
    groupId.value = _groupId;
    isActive.value = true;
    privacy.value = _privacy;
  }

  return { groupId, hashtag, isActive, privacy, showDialog };
});
