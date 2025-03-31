<template>
  <Dialog
    v-model:visible="model"
    modal
    header="Quyền riêng tư"
    :style="{ width: '30rem' }"
  >
    <div class="flex flex-col gap-3">
      <div
        v-for="(label, value) in privacyOptions"
        :key="value"
        @click="selectPrivacy(value)"
        :class="[
          'flex items-center justify-between p-3 cursor-pointer rounded',
          currentPrivacy === value ? 'bg-blue-50' : 'hover:bg-gray-50',
        ]"
      >
        <span>{{ label }}</span>
        <RadioButton
          :modelValue="currentPrivacy"
          :value="value"
          @change="selectPrivacy(value)"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";

const model = defineModel<boolean>({ required: true });
const props = defineProps({
  groupId: { type: String, required: true },
  currentPrivacy: { type: String, required: true },
});

const emit = defineEmits(["updated"]);
const toast = useToast();

const privacyOptions = {
  PUBLIC: "Công khai",
  PRIVATE: "Riêng tư",
};

async function selectPrivacy(privacy: string) {
  const { data } = await useAPI<ApiResponse>(
    `/api/group/${props.groupId}/privacy`,
    {
      method: "PUT",
      body: { privacy },
    }
  );

  if (data.value?.code === 200) {
    toast.success("Cập nhật quyền riêng tư thành công");
    model.value = false;
    emit("updated");
  } else {
    toast.error(data.value?.message || "Có lỗi xảy ra");
  }
}
</script>
