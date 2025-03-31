<template>
  <Dialog
    v-model:visible="model"
    modal
    header="Chỉnh sửa mô tả"
    :style="{ width: '30rem' }"
  >
    <div class="flex flex-col gap-3">
      <Textarea
        v-model="newDescription"
        placeholder="Nhập mô tả nhóm"
        :autoResize="true"
        rows="5"
        class="w-full"
      />
      <Button label="Lưu thay đổi" @click="updateDescription" />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";

const model = defineModel<boolean>({ required: true });
const props = defineProps({
  groupId: { type: String, required: true },
  currentDescription: { type: String, required: true },
});

const emit = defineEmits(["updated"]);
const toast = useToast();
const newDescription = ref(props.currentDescription);

async function updateDescription() {
  const { data } = await useAPI<ApiResponse>(
    `/api/group/${props.groupId}/description`,
    {
      method: "PUT",
      body: { description: newDescription.value },
    }
  );

  if (data.value?.code === 200) {
    toast.success("Cập nhật mô tả thành công");
    model.value = false;
    emit("updated");
  } else {
    toast.error(data.value?.message || "Có lỗi xảy ra");
  }
}
</script>
