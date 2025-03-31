<template>
  <Dialog
    v-model:visible="model"
    modal
    :showHeader="false"
    :style="{ width: '32rem' }"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col items-center w-full gap-4 my-5">
        <Icon
          name="fluent:info-32-regular"
          class="!text-6xl text-primary-500"
        ></Icon>
        <p>Bạn có chắc muốn gỡ bình luận này?</p>
      </div>

      <div v-if="showPenaltyOptions" class="border-t pt-4">
        <div class="font-semibold mb-3">Xử phạt người bình luận</div>

        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <Checkbox v-model="applyPenalty" binary />
            <label>Áp dụng hình phạt</label>
          </div>

          <div v-if="applyPenalty" class="flex flex-col gap-3 pl-6">
            <!-- Loại hình phạt -->
            <div>
              <label class="block mb-2">Hình thức</label>
              <div class="flex flex-wrap gap-3">
                <div
                  v-for="type in restrictionTypes"
                  :key="type.value"
                  class="flex items-center"
                >
                  <RadioButton
                    v-model="penaltyForm.restriction"
                    :value="type.value"
                    :inputId="type.value"
                  />
                  <label :for="type.value" class="ml-2">{{ type.label }}</label>
                </div>
              </div>
            </div>

            <!-- Thời hạn -->
            <div>
              <label class="block mb-2">Thời hạn</label>
              <Calendar
                v-model="penaltyForm.endAt"
                :showTime="true"
                placeholder="Để trống nếu cấm vĩnh viễn"
                class="w-full"
              />
            </div>

            <!-- Lý do -->
            <div>
              <label class="block mb-2">Lý do chi tiết</label>
              <InputText
                v-model="penaltyForm.reason"
                placeholder="Nhập lý do..."
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <Button
          type="button"
          label="Huỷ"
          severity="secondary"
          :outlined="true"
          @click="$emit('update:modelValue', false)"
        ></Button>
        <Button
          type="button"
          severity="danger"
          label="Gỡ bình luận"
          @click="handleRemove"
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
  showPenaltyOptions: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "removed"]);
const toast = useToast();

const applyPenalty = ref(false);
const penaltyForm = reactive({
  restriction: "",
  reason: "",
  endAt: null as Date | null,
});

const restrictionTypes = [
  { value: "FULL_BAN", label: "Cấm hoàn toàn" },
  { value: "COMMENT_BAN", label: "Cấm bình luận" },
  { value: "POST_BAN", label: "Cấm đăng bài" },
];

async function handleRemove() {
  try {
    if (props.showPenaltyOptions) {
      // Xử lý qua API báo cáo
      const { data: response } = await useAPI<ApiResponse>(
        `/api/admin/report/comments/${props.id}`,
        {
          method: "PUT",
          body: {
            action: "RESOLVED",
            punishment: {
              type: applyPenalty.value ? penaltyForm.restriction : "NONE",
              endAt: penaltyForm.endAt,
              reason: penaltyForm.reason,
            },
          },
        }
      );

      if (response.value?.code !== 200) {
        throw new Error(response.value?.message || "Không thể xử lý báo cáo");
      }
    } else {
      // Xử lý xóa bình luận thông thường
      const { data: removeResponse } = await useAPI<ApiResponse>(
        `/api/comment/${props.id}`,
        {
          method: "DELETE",
        }
      );

      if (removeResponse.value?.code !== 200) {
        throw new Error(
          removeResponse.value?.message || "Không thể xóa bình luận"
        );
      }
    }

    toast.success("Đã gỡ bình luận thành công");
    emit("removed");
    emit("update:modelValue", false);
  } catch (error) {
    toast.error((error as Error).message || "Có lỗi xảy ra");
  }
}
</script>
