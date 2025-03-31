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
      :style="{ width: '35rem' }"
      dismissableMask
    >
      <div class="flex justify-between items-center sticky top-0 bg-white pb-3">
        <div class="text-xl text-gray-800">Tạo nhóm mới</div>
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

      <div class="flex flex-col gap-4 mt-4">
        <div class="">
          <label for="name">Tên nhóm</label>
          <Field
            v-model="formData.name"
            name="name"
            placeholder="Nhập tên nhóm"
            class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-gray-400 transition duration-300 ease-in-out"
          />
        </div>
        <div class="">
          <label for="description">Mô tả</label>
          <textarea
            v-model="formData.description"
            name="description"
            rows="4"
            placeholder="Nhập mô tả nhóm"
            class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-gray-400 transition duration-300 ease-in-out"
          ></textarea>
        </div>
        <div class="mt-[-5px]">
          <label for="description">Quyền riêng tư</label>
          <Select
            v-model="formData.privacy"
            :options="privacyOptions"
            optionLabel="name"
            optionValue="code"
            placeholder="Chọn quyền riêng tư"
            checkmark
            :highlightOnSelect="false"
            class="w-full border border-gray-300 rounded-md p-0 outline-none shadow-sm focus:border-gray-400 transition duration-300 ease-in-out mt-1"
          ></Select>
        </div>
      </div>

      <Button
        label="Tạo nhóm"
        class="w-full mt-3"
        @click="createGroup"
      ></Button>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";

const visible = defineModel({ required: true, default: false });

const privacyOptions = ref([
  { name: "Công khai", code: "PUBLIC" },
  { name: "Riêng tư", code: "PRIVATE" },
]);

const toast = useToast();

const formData = reactive({
  name: "",
  description: "",
  privacy: "",
});

async function createGroup() {
  const { data } = await useAPI<ApiResponse>("/api/group", {
    method: "POST",
    body: formData,
  });

  if (data.value?.code == 200) {
    visible.value = false;
    toast.success(data.value.message);
    return navigateTo("/groups/joins");
  } else {
    toast.error(data.value?.message);
  }
}
</script>

<style scoped></style>
