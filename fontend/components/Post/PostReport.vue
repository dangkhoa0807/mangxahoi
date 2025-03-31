<template>
  <div>
    <Dialog
      v-model:visible="visible"
      modal
      :show-header="false"
      :pt="{
        root: 'pt-4',
        content: 'pb-4',
      }"
      :style="{ width: '34rem' }"
      dismissableMask
    >
      <div class="flex justify-between items-center sticky top-0 bg-white pb-3">
        <div class="text-xl text-gray-800">Báo cáo bài viết</div>
        <div class="flex items-center gap-4">
          <div
            class="hover:bg-gray-100 rounded-full transition duration-150 ease-in-out cursor-pointer w-7 h-7 flex items-center justify-center"
            @click="visible = false"
          >
            <Icon name="tabler:x" class="text-2xl"></Icon>
          </div>
        </div>
      </div>
      <hr />

      <div class="flex flex-col gap-4 my-4">
        <div class="flex items-center gap-2">
          <RadioButton
            v-model="reportReason"
            inputId="reason1"
            name="reportReason"
            value="Nội dung không phù hợp"
          />
          <label for="reason1">Nội dung không phù hợp</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton
            v-model="reportReason"
            inputId="reason2"
            name="reportReason"
            value="Nội dung xúc phạm"
          />
          <label for="reason2">Nội dung xúc phạm</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton
            v-model="reportReason"
            inputId="reason3"
            name="reportReason"
            value="Spam hoặc lừa đảo"
          />
          <label for="reason3">Spam hoặc lừa đảo</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton
            v-model="reportReason"
            inputId="reason4"
            name="reportReason"
            value="Vi phạm bản quyền"
          />
          <label for="reason4">Vi phạm bản quyền</label>
        </div>

        <Textarea
          v-model="reportDescription"
          rows="3"
          placeholder="Mô tả chi tiết lý do báo cáo..."
          class="w-full mt-2 p-2 border rounded"
        ></Textarea>
      </div>

      <hr />

      <div class="flex justify-end gap-2 mt-4">
        <Button
          type="button"
          label="Huỷ"
          severity="secondary"
          @click="visible = false"
        ></Button>
        <Button type="button" label="Báo cáo" @click="onReport"></Button>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";

const visible = defineModel({ required: true, default: false });

const props = defineProps({
  postId: { type: String },
});

const toast = useToast();

// Biến lưu lý do báo cáo
const reportReason = ref("");
const reportDescription = ref("");

async function onReport() {
  const { data } = await useAPI<ApiResponse<{}>>(
    `/api/post/${props.postId}/report`,
    {
      method: "POST",
      body: {
        reason: reportReason,
        description: reportDescription,
      },
    }
  );

  if (data.value?.code == 200) {
    visible.value = false;
    toast.success(data.value?.message ?? "Báo cáo thành công");
  } else {
    toast.error(data.value?.message ?? "Lấy dữ liệu thất bại");
  }
}
</script>
