<template>
  <div>
    <div class="flex gap-2 w-full" v-if="auth.user">
      <div class="w-11 h-11 bg-gray-200 rounded-full shrink-0">
        <img
          :src="auth.user.profile.avatarUrl ?? DEFAULT_AVATAR_URL"
          alt="avatar"
          class="w-full h-full object-cover rounded-full"
        />
      </div>
      <div
        class="sticky bottom-0 bg-white p-2 flex flex-col gap-3 z-20 border rounded-xl w-full"
        v-if="auth.user"
      >
        <div v-if="imagePreviews.length" class="flex gap-2">
          <div
            v-for="(preview, index) in imagePreviews"
            :key="index"
            class="relative w-20 h-20"
          >
            <img
              :src="preview.url"
              alt="Preview"
              class="w-full h-full object-cover rounded-lg border"
            />
            <button
              @click="removeImage(index)"
              class="absolute -top-2 -right-2 rounded-full bg-red-500 hover:bg-red-600 text-white w-5 h-5 flex items-center justify-center shadow-md transition duration-150 ease-in-out"
            >
              <Icon name="tabler:x" class="text-md" />
            </button>
          </div>
        </div>
        <div v-if="stickerPreview" class="relative w-20 h-20">
            <img
              :src="stickerPreview.url"
              alt="Sticker"
              class="w-24 h-fit object-cover"
            />
            <button
              @click="removeSticker()"
              class="absolute -top-2 -right-2 rounded-full bg-red-500 hover:bg-red-600 text-white w-5 h-5 flex items-center justify-center shadow-md transition duration-150 ease-in-out"
            >
              <Icon name="tabler:x" class="text-md" />
            </button>
        </div>

        <textarea
          class="w-full p-1 border-0 focus:outline-none resize-none max-h-[72px]"
          v-model="comment"
          placeholder="Nhập bình luận"
          rows="1"
          @input="autoResize"
          @focus="isCommenting = true"
        />
        <div class="flex justify-between text-md" v-if="isCommenting">
          <div class="flex gap-1">
            <!-- Icon chọn ảnh -->
            <div
              v-if="!imagePreviews.length"
              class="cursor-pointer rounded-full w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 hover:border-blue-100 transition duration-300 ease-in-out"
              @click="$refs.fileInput.click()"
            >
              <Icon name="tabler:photo" class="text-xl text-gray-600" />
              <input
                type="file"
                ref="fileInput"
                @change="onFileChange"
                accept="image/*"
                class="hidden"
              />
            </div>
            <!-- Icon chọn biểu tượng cảm xúc -->
            <HeadlessPopover class="relative">
              <HeadlessPopoverButton
                class="cursor-pointer rounded-full w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 hover:border-blue-100 transition duration-300 ease-in-out"
                aria-label="Chọn biểu tượng cảm xúc"
              >
                <Icon name="tabler:mood-smile" class="text-2xl"></Icon>
              </HeadlessPopoverButton>

              <transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <HeadlessPopoverPanel
                  class="absolute bottom-full mb-2 left-0 z-10"
                >
                  <EmojiPicker :native="true" @select="onSelectEmoji" />
                </HeadlessPopoverPanel>
              </transition>
            </HeadlessPopover>
            <!-- icon chọn sticker -->
            <HeadlessPopover class="relative" v-if="stickerPreview === null">
            <HeadlessPopoverButton
              class="cursor-pointer rounded-full w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 hover:border-blue-100 transition duration-300 ease-in-out"
              aria-label="Chọn biểu tượng cảm xúc"
            >
              <div class="w-5 h-5">
                <Icon name="tabler:sticker-2" class="text-xl"></Icon>
              </div>
            </HeadlessPopoverButton>

            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <HeadlessPopoverPanel
                class="absolute bottom-full mb-2 left-0 z-10 w-80 bg-white rounded-lg shadow-sm border"
              >
                <KeepAlive>
                  <StickerComponent
                      @select="(sticker) => (stickerPreview = sticker)"
                  />
                </KeepAlive>
              </HeadlessPopoverPanel>
            </transition>
          </HeadlessPopover>
          </div>
          <div class="flex gap-2">
            <button
              class="text-gray-500 px-3 py-1 border border-gray-300 rounded-full"
              @click="isCommenting = false"
            >
              Huỷ
            </button>
            <button
              class="bg-blue-500 text-white px-3 py-1 rounded-full"
              :class="{
                'bg-blue-500 hover:bg-blue-600': canPostComment,
                'bg-gray-300 cursor-not-allowed': !canPostComment,
              }"
              :disabled="!canPostComment"
              @click="postComment()"
            >
              Đăng
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DEFAULT_AVATAR_URL,type Sticker } from "~/types/model";
const auth = useAuth();
const comment = defineModel<string>({ required: true, default: "" });
const isCommenting = ref(false);
import EmojiPicker from "vue3-emoji-picker";
import StickerComponent from "~/components/Sticker.vue";

const emit = defineEmits(["postComment"]);
const fileInput = ref<HTMLInputElement | null>(null);
const imagePreviews = ref<{ url: string; file: File }[]>([]);

const stickerPreview = ref<Sticker | null>(null);

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = input.files;

  if (!files) return;

  for (const file of files) {
    // Check if file is an image
    if (!file.type.startsWith("image/")) continue;

    // Check file size (e.g., 5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const toast = useToast();
      toast.error(`File ${file.name} không được vượt quá 5MB`);
      continue;
    }

    const url = URL.createObjectURL(file);
    imagePreviews.value.push({ url, file });
  }

  // Reset input
  input.value = "";
};

const canPostComment = computed(() => {
  return comment.value?.trim() || imagePreviews.value.length || stickerPreview.value !== null;
});

const removeImage = (index: number) => {
  URL.revokeObjectURL(imagePreviews.value[index].url);
  imagePreviews.value.splice(index, 1);
};

const removeSticker = () => {
  stickerPreview.value =null
};

const postComment = () => {
  // Nếu có sticker được chọn

  if (
      !comment.value?.trim() &&
      !imagePreviews.value.length &&
      !stickerPreview.value
    )
      return;
  emit("postComment", {
    content: comment.value,
    image: imagePreviews.value.length ? imagePreviews.value[0].file : null,
    stickerId : stickerPreview.value ? stickerPreview.value.id : null
  });
  comment.value = "";
  imagePreviews.value = [];
  isCommenting.value = false;
  stickerPreview.value = null;
};

function onSelectEmoji(emoji: any) {
  comment.value += emoji.i;
}

const autoResize = (e: Event) => {
  const textarea = e.target as HTMLTextAreaElement;
  textarea.style.height = "auto";
  const newHeight = Math.min(textarea.scrollHeight, 72); // 72px = 3 dòng (24px/dòng)
  textarea.style.height = `${newHeight}px`;
};
</script>

<style scoped>
textarea {
  min-height: 24px; /* Chiều cao tối thiểu 1 dòng */
  line-height: 24px; /* Chiều cao mỗi dòng */
}
</style>
