<template>
  <div>
    <Dialog
      v-model:visible="model"
      modal
      :draggable="false"
      header="Đổi mật khẩu"
      :style="{ width: '28rem' }"
      class="rounded-lg shadow-lg"
      @hide="clear"
    >
      <Form @submit="changePassword" :validation-schema="schema">
        <div class="flex flex-col items-center">
          <div
            class="bg-blue-100 w-12 h-12 flex items-center justify-center rounded-full mb-4"
          >
            <Icon name="tabler:lock" class="text-blue-500 text-2xl" />
          </div>
          <p class="text-center mb-4">Vui lòng nhập mật khẩu mới của bạn</p>

          <div class="flex flex-col gap-3 w-full">
            <div class="flex gap-2 relative w-full">
              <Field
                v-model="password"
                type="password"
                name="password"
                placeholder="Mật khẩu mới"
                class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-gray-500 transition duration-300 ease-in-out"
              />
            </div>
            <ErrorMessage name="password" class="text-red-500 text-sm" />

            <div class="flex gap-2 relative w-full">
              <Field
                v-model="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Xác nhận mật khẩu mới"
                class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-gray-500 transition duration-300 ease-in-out"
              />
            </div>
            <ErrorMessage name="confirmPassword" class="text-red-500 text-sm" />
          </div>

          <Button
            label="Xác nhận"
            class="mt-4 w-full"
            type="submit"
            :loading="isLoading"
          ></Button>
        </div>
      </Form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import * as yup from "yup";
import type { ApiResponse } from "~/types/api";

const model = defineModel<boolean>({ required: true, default: false });

const props = defineProps({
  ticket: { type: String, required: true },
});

const toast = useToast();
const auth = useAuth();

const isLoading = ref(false);
const password = ref("");
const confirmPassword = ref("");

const schema = yup.object({
  password: yup
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .required("Mật khẩu không được bỏ trống"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Mật khẩu xác nhận không khớp")
    .required("Xác nhận mật khẩu không được bỏ trống"),
});

function clear() {
  password.value = "";
  confirmPassword.value = "";
}

async function changePassword() {
  isLoading.value = true;
  const { data: response } = await useAPI<ApiResponse>(
    "/api/user/changePassword",
    {
      method: "POST",
      body: {
        password: password.value,
        action_ticket: props.ticket,
      },
    }
  );

  isLoading.value = false;
  if (response.value?.code == 200) {
    toast.success(response.value.message);
    model.value = false;
    await auth.getUser();
  } else {
    toast.error(response.value?.message ?? "Đổi mật khẩu thất bại");
  }
}
</script>
