<template>
  <Dialog
    v-model:visible="model"
    modal
    :draggable="false"
    header="Thay đổi ảnh nhóm"
    :style="{ width: '32rem' }"
    class="rounded-lg shadow-lg"
    @hide="clear"
  >
    <div class="flex flex-col items-center">
      <div
        class="w-full bg-zinc-100 rounded-lg p-4 flex flex-col items-center"
        v-if="!image"
      >
        <div
          class="bg-blue-100 w-24 h-24 flex items-center justify-center rounded-full mb-4"
        >
          <Icon name="tabler:camera" class="text-blue-500 text-3xl" />
        </div>

        <div class="flex justify-center mt-4 w-full">
          <span
            class="bg-blue-500 text-white py-2 px-4 rounded-lg cursor-pointer hover:bg-blue-600"
            @click="$refs.file.click()"
          >
            <input
              type="file"
              ref="file"
              @change="uploadImage"
              class="hidden"
              accept="image/*"
            />
            Tải lên hình ảnh
          </span>
        </div>
      </div>

      <div class="w-full relative" v-if="image">
        <button
          class="absolute top-2 w-8 h-8 flex items-center justify-center right-2 z-10 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
          @click="removeImage"
        >
          <Icon name="tabler:x" class="text-gray-600 text-xl" />
        </button>
        <Cropper
          ref="cropper"
          class="w-full aspect-square rounded-lg overflow-hidden"
          :src="image"
          :default-size="defaultSize"
          :stencil-component="CircleStencil"
        />
      </div>

      <div class="flex justify-end gap-2 mt-4 w-full">
        <Button
          label="Huỷ"
          severity="secondary"
          @click="model = false"
          class="p-button-text"
        />
        <Button label="Lưu thay đổi" :loading="saving" @click="updateIcon" />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import { CircleStencil } from "vue-advanced-cropper";
import type { ApiResponse } from "~/types/api";

const model = defineModel<boolean>({ required: true });
const props = defineProps({
  groupId: { type: String, required: true },
});
const emit = defineEmits(["updated"]);
const toast = useToast();

const image = ref();
const saving = ref(false);
const cropper = ref<InstanceType<typeof Cropper> | null>(null);

const uploadImage = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const target = e.target as FileReader;
      image.value = target.result as string;
    };
    reader.readAsDataURL(input.files[0]);
  }
};

async function updateIcon() {
  const result = cropper.value?.getResult();
  if (!result?.canvas) return;

  saving.value = true;
  try {
    const blob = await new Promise<Blob>((resolve) => {
      (result.canvas as HTMLCanvasElement).toBlob((blob) => {
        if (blob) resolve(blob);
      }, "image/jpeg");
    });

    const formData = new FormData();
    formData.append("icon", blob, "icon.jpg");

    const { data: response } = await useAPI<ApiResponse>(
      `/api/group/${props.groupId}/icon`,
      {
        method: "PUT",
        body: formData,
      }
    );

    if (response.value?.code === 200) {
      toast.success("Cập nhật ảnh nhóm thành công");
      emit("updated");
      model.value = false;
    } else {
      toast.error(response.value?.message || "Cập nhật ảnh nhóm thất bại");
    }
  } catch (error) {
    toast.error("Đã xảy ra lỗi khi cập nhật ảnh nhóm");
  } finally {
    saving.value = false;
  }
}

function clear() {
  image.value = "";
}

function removeImage() {
  image.value = "";
  if (cropper.value) {
    cropper.value = null;
  }
}

function defaultSize({
  imageSize,
  visibleArea,
}: {
  imageSize: { width: number; height: number };
  visibleArea: { width: number; height: number };
}) {
  return {
    width: (visibleArea || imageSize).width,
    height: (visibleArea || imageSize).height,
  };
}
</script>
