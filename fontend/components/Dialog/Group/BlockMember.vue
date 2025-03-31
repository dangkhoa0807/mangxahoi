<template>
  <Dialog
    v-model:visible="model"
    modal
    :showHeader="false"
    :style="{ width: '32rem' }"
  >
    <div class="flex flex-col items-center w-full gap-4 my-5">
      <Icon name="tabler:ban" class="!text-6xl text-red-500" />
      <div class="text-center">
        <p class="font-medium text-lg mb-2">Chặn thành viên này?</p>
        <p class="text-gray-600">Thành viên bị chặn sẽ không thể:</p>
        <ul class="text-gray-600 list-disc list-inside text-left mt-2">
          <li>Tham gia lại nhóm</li>
          <li>Xem nội dung của nhóm</li>
          <li>Tương tác với các thành viên trong nhóm</li>
        </ul>
      </div>
    </div>

    <div class="mt-4">
      <label class="block mb-2">Lý do chặn:</label>
      <InputText
        v-model="reason"
        placeholder="Nhập lý do chặn thành viên..."
        class="w-full"
      />
    </div>

    <div class="flex justify-center gap-2 mt-6">
      <Button
        label="Huỷ"
        severity="secondary"
        :outlined="true"
        @click="model = false"
      />
      <Button
        label="Chặn"
        severity="danger"
        @click="blockMember"
        :loading="isBlocking"
      />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";

const model = defineModel<boolean>({ required: true });
const props = defineProps({
  groupId: { type: String, required: true },
  userId: { type: String, required: true },
});

const emit = defineEmits(["blocked"]);
const toast = useToast();
const reason = ref("");
const isBlocking = ref(false);

async function blockMember() {
  if (isBlocking.value) return;

  isBlocking.value = true;
  try {
    const { data } = await useAPI<ApiResponse>(
      `/api/group/${props.groupId}/ban/${props.userId}`,
      {
        method: "POST",
        body: {
          reason: reason.value,
        },
      }
    );

    if (data.value?.code === 200) {
      toast.success("Đã chặn thành viên khỏi nhóm");
      model.value = false;
      emit("blocked");
    } else {
      toast.error(data.value?.message || "Không thể chặn thành viên");
    }
  } catch (error) {
    toast.error("Đã xảy ra lỗi khi chặn thành viên");
  } finally {
    isBlocking.value = false;
  }
}
</script>
