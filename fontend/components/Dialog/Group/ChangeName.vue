<template>
  <Dialog
    v-model:visible="model"
    modal
    header="Đổi tên nhóm"
    :style="{ width: '30rem' }"
  >
    <div class="flex flex-col gap-3">
      <InputText
        v-model="newName"
        placeholder="Nhập tên nhóm mới"
        class="w-full"
      />
      <Button label="Lưu thay đổi" @click="updateName" />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";

const model = defineModel<boolean>({ required: true });
const props = defineProps({
  groupId: { type: String, required: true },
  currentName: { type: String, required: true },
});

const emit = defineEmits(["updated"]);
const toast = useToast();
const newName = ref(props.currentName);

async function updateName() {
  const { data } = await useAPI<ApiResponse>(
    `/api/group/${props.groupId}/name`,
    {
      method: "PUT",
      body: { name: newName.value },
    }
  );

  if (data.value?.code === 200) {
    toast.success("Cập nhật tên nhóm thành công");
    model.value = false;
    emit("updated");
  } else {
    toast.error(data.value?.message || "Có lỗi xảy ra");
  }
}
</script>
