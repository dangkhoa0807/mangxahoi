<template>
  <div>
    <Dialog
      v-model:visible="model"
      modal
      :showHeader="false"
      :style="{ width: '32rem' }"
      :dismissibleMask="true"
      :pt="{
        content: 'custom-content',
      }"
    >
      <div class="flex flex-col gap-4">
        <div class="flex justify-between items-center mt-4">
          <div class="text-xl">Chỉnh sửa bình luận</div>
          <div
            class="hover:bg-gray-100 rounded-full transition duration-150 ease-in-out cursor-pointer w-7 h-7 flex items-center justify-center"
            @click="model = false"
          >
            <Icon name="tabler:x" class="text-2xl"></Icon>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <div class="relative border rounded-lg p-3">
            <div class="flex flex-col gap-3">
              <div v-if="imagePreview" class="relative w-fit">
                <img
                  :src="imagePreview.url"
                  alt="Image"
                  class="max-w-52 object-cover rounded-lg border"
                />
                <button
                  @click="removeImage()"
                  class="absolute -top-2 -right-2 rounded-full bg-red-500 hover:bg-red-600 text-white w-5 h-5 flex items-center justify-center shadow-md transition duration-150 ease-in-out"
                >
                  <Icon name="tabler:x" class="text-md" />
                </button>
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
                v-model="editContent"
                placeholder="Nhập bình luận"
                rows="1"
                @input="autoResize"
              />

              <div class="flex justify-between text-md">
                <div class="flex gap-1">
                  <!-- Icon chọn ảnh -->
                  <div
                    v-if="!imagePreview && !stickerPreview"
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
                      class="cursor-pointer rounded-full w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 hover:border-blue-100 transition duration-300 ease-in-out z-50"
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

                  <!-- Icon chọn sticker -->
                  <HeadlessPopover
                    class="relative"
                    v-if="!stickerPreview && !imagePreview"
                  >
                    <HeadlessPopoverButton
                      class="cursor-pointer rounded-full w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 hover:border-blue-100 transition duration-300 ease-in-out"
                      aria-label="Chọn sticker"
                    >
                      <Icon name="tabler:sticker-2" class="text-2xl"></Icon>
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
                        <StickerComponent
                          @select="onSelectSticker"
                          :comment="comment"
                          class="absolute bottom-full mb-2 left-0 z-10 w-80 bg-white rounded-lg shadow-sm border"
                        />
                      </HeadlessPopoverPanel>
                    </transition>
                  </HeadlessPopover>
                </div>

                <div class="flex gap-2">
                  <Button
                    type="button"
                    label="Huỷ"
                    severity="secondary"
                    :outlined="true"
                    @click="model = false"
                  />
                  <Button
                    type="button"
                    label="Lưu"
                    :disabled="!canEdit"
                    @click="handleEdit(comment?.id ?? '')"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <Loading v-model="isLoading" />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { Comment, Sticker } from "~/types/model";
import Loading from "~/components/Dialog/Loading.vue";
import EmojiPicker from "vue3-emoji-picker";
import StickerComponent from "~/components/Sticker.vue";

const model = defineModel<boolean>({ required: true });

const props = defineProps({
  comment: { type: Object as PropType<Comment | null> },
});

const emit = defineEmits(["update:modelValue", "edited"]);
const toast = useToast();

const editContent = ref(props.comment?.content ?? "");
const isLoading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const imagePreview = ref<{ url: string; file: File | null }>();
const stickerPreview = ref<Sticker | null>(null);

const canEdit = computed(() => {
  return editContent.value.trim() || imagePreview.value || stickerPreview.value;
});

onMounted(() => {
  stickerPreview.value = props.comment?.sticker ?? null;
  imagePreview.value = props.comment?.image
    ? { url: props.comment.image, file: null }
    : undefined;
});

function onSelectEmoji(emoji: any) {
  editContent.value += emoji.i;
}

function onSelectSticker(sticker: Sticker) {
  stickerPreview.value = sticker;
}

function removeSticker() {
  stickerPreview.value = null;
}

function removeImage() {
  if (imagePreview.value?.url) {
    URL.revokeObjectURL(imagePreview.value.url);
  }
  imagePreview.value = undefined;
}

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = input.files;

  if (!files?.length) return;

  const file = files[0];

  // Check if file is an image
  if (!file.type.startsWith("image/")) return;

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    toast.error(`File không được vượt quá 5MB`);
    return;
  }

  const url = URL.createObjectURL(file);
  imagePreview.value = { url, file };

  // Reset input
  input.value = "";
};

const autoResize = (e: Event) => {
  const textarea = e.target as HTMLTextAreaElement;
  textarea.style.height = "auto";
  const newHeight = Math.min(textarea.scrollHeight, 72);
  textarea.style.height = `${newHeight}px`;
};

async function handleEdit(commentId: string) {
  if (!canEdit.value) return;

  try {
    isLoading.value = true;
    const formData = new FormData();
    formData.append("content", editContent.value);

    if (imagePreview.value?.file) {
      formData.append("image", imagePreview.value.file);
    }

    if (stickerPreview.value) {
      formData.append("stickerId", stickerPreview.value.id);
    }

    const { data } = await useAPI<ApiResponse<Comment>>(
      `/api/comment/${commentId}`,
      {
        method: "PUT",
        body: formData,
      }
    );

    if (data.value?.code !== 200) {
      throw new Error(data.value?.message || "Không thể cập nhật bình luận");
    }

    toast.success("Đã cập nhật bình luận");
    emit("edited", data.value.data);
    model.value = false;
  } catch (error) {
    toast.error((error as Error).message || "Có lỗi xảy ra");
  } finally {
    isLoading.value = false;
  }
}
</script>

<style lang="scss">
textarea {
  min-height: 24px;
  line-height: 24px;
}

.custom-content {
  overflow-y: visible !important;
}
</style>
