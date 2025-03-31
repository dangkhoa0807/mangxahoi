<template>
  <Dialog
    v-model:visible="model"
    modal
    header="Chỉnh sửa tên hiển thị"
    :pt="{
      content: 'pb-4',
    }"
    :style="{ width: '32rem' }"
    @hide="clear"
    :draggable="false"
  >
    <Form @submit="updateName" :validation-schema="schema">
      <div class="mb-4">
        <label for="name">Họ và tên</label>
        <Field
          v-model="name"
          name="name"
          placeholder="Họ và tên"
          class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-blue-500 transition duration-300 ease-in-out"
        />
        <ErrorMessage name="name" class="block mt-1 text-red-500" />
      </div>

      <Button
        type="submit"
        label="Lưu thay đổi"
        class="w-full"
        :loading="isLoading"
      ></Button>
    </Form>

    <Loading v-model="isLoading" />
  </Dialog>
</template>

<script setup lang="ts">
import * as yup from "yup";
import type { ApiResponse } from "~/types/api";
import Loading from "./Loading.vue";

const model = defineModel<boolean>({ required: true });
const props = defineProps({
  currentName: { type: String, required: true },
});

const auth = useAuth();
const toast = useToast();
const isLoading = ref(false);
const name = ref(props.currentName);

const schema = yup.object({
  name: yup.string().required("Tên không được bỏ trống"),
});

async function updateName() {
  try {
    isLoading.value = true;
    const { data: response } = await useAPI<
      ApiResponse<{ access_token: string; refresh_token: string }>
    >("/api/user/name", {
      method: "PUT",
      body: {
        name: name.value,
      },
      watch: false,
    });

    if (response.value?.code === 200) {
      toast.success(response.value?.message);
      if (auth.user?.profile) {
        auth.user.profile.name = name.value;
      }
      model.value = false;
    } else {
      toast.error(response.value?.message || "Đã xảy ra lỗi");
    }
  } catch (error) {
    toast.error("Đã xảy ra lỗi khi cập nhật tên");
  } finally {
    isLoading.value = false;
  }
}

function clear() {
  name.value = props.currentName;
}
</script>
