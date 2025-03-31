<template>
  <Dialog
    v-model:visible="model"
    modal
    :showHeader="false"
    :style="{ width: '32rem' }"
  >
    <div class="flex flex-col gap-4 my-4">
      <div class="flex flex-col items-center w-full gap-4 my-5 mb-2">
        <Icon
          name="fluent:info-32-regular"
          class="!text-6xl text-primary-500"
        ></Icon>
        <p>Bạn có chắc muốn giữ lại bài viết này?</p>
      </div>

      <div class="flex justify-center gap-2">
        <Button
          type="button"
          label="Huỷ"
          severity="secondary"
          :outlined="true"
          @click="model = false"
        ></Button>
        <Button
          type="button"
          severity="primary"
          label="Giữ lại"
          @click="handleKeep"
        ></Button>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";

const model = defineModel<boolean>({ required: true, default: true });

const props = defineProps({
  id: { type: String, required: true },
});

const emit = defineEmits(["update:modelValue", "kept"]);
const toast = useToast();

async function handleKeep() {
  try {
    const { data: response } = await useAPI<ApiResponse>(
      `/api/admin/report/posts/${props.id}`,
      {
        method: "PUT",
        body: {
          action: "REJECTED",
        },
      }
    );

    if (response.value?.code !== 200) {
      throw new Error(response.value?.message || "Không thể xử lý báo cáo");
    }

    toast.success("Đã giữ lại bài viết");
    emit("kept", props.id);
    model.value = false;
  } catch (error) {
    toast.error((error as Error).message || "Có lỗi xảy ra");
  }
}
</script>
