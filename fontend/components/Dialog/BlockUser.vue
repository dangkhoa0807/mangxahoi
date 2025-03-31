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
        <p class="font-medium text-lg mb-2">Chặn người dùng này?</p>
        <p class="text-gray-600">Người bạn chặn sẽ không thể:</p>
        <ul class="text-gray-600 list-disc list-inside text-left mt-2">
          <li>Xem trang cá nhân của bạn</li>
          <li>Gửi lời mời kết bạn</li>
          <li>Nhắn tin với bạn</li>
        </ul>
      </div>
    </div>
    <div class="flex justify-center gap-2">
      <Button
        label="Huỷ"
        severity="secondary"
        :outlined="true"
        @click="model = false"
      />
      <Button
        label="Chặn"
        severity="danger"
        @click="blockUser"
        :loading="isBlocking"
      />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";

const model = defineModel<boolean>({ required: true });
const props = defineProps({
  userId: { type: String, required: true },
});

const emit = defineEmits(["blocked"]);
const toast = useToast();
const isBlocking = ref(false);

async function blockUser() {
  if (isBlocking.value) return;

  isBlocking.value = true;
  try {
    const { data } = await useAPI<ApiResponse>(`/api/block/${props.userId}`, {
      method: "POST",
    });

    if (data.value?.code === 200) {
      toast.success(data.value.message);
      model.value = false;
      emit("blocked");
    } else {
      toast.error(data.value?.message || "Không thể chặn người dùng");
    }
  } catch (error) {
    toast.error("Đã xảy ra lỗi khi chặn người dùng");
  } finally {
    isBlocking.value = false;
  }
}
</script>
