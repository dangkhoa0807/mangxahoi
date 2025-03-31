<template>
  <div>
    <Dialog
      v-model:visible="visible"
      modal
      :draggable="false"
      header="Quên mật khẩu"
      :style="{ width: '28rem' }"
      class="rounded-lg shadow-lg"
      @show="clear"
    >
      <div v-if="step === 'verify'">
        <ForgetPasswordRequest @verified="handleVerified" />
      </div>
      <div v-if="step === 'reset'" class="flex flex-col items-center">
        <div
          class="bg-blue-100 w-12 h-12 flex items-center justify-center rounded-full mb-4"
        >
          <Icon name="tabler:lock" class="text-blue-500 text-2xl" />
        </div>
        <p class="text-center mb-4">Vui lòng nhập mật khẩu mới của bạn</p>

        <Form
          @submit="resetPassword"
          :validation-schema="schema"
          class="w-full"
        >
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
            label="Đặt lại mật khẩu"
            class="mt-4 w-full"
            type="submit"
            :loading="isLoading"
          ></Button>
        </Form>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import * as yup from "yup";
import type { ApiResponse } from "~/types/api";
import ForgetPasswordRequest from "./ForgetPasswordRequest.vue";

const visible = defineModel({ default: false });
const emit = defineEmits(["showLogin"]);
const toast = useToast();

const step = ref<"verify" | "reset">("verify");
const email = ref("");
const actionTicket = ref("");
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

function handleVerified(data: { ticket: string; action: string }) {
  actionTicket.value = data.ticket;
  step.value = "reset";
}

async function resetPassword() {
  try {
    isLoading.value = true;
    const { data: response } = await useAPI<ApiResponse>(
      "/api/auth/resetPassword",
      {
        method: "POST",
        body: {
          password: password.value,
          action_ticket: actionTicket.value,
        },
      }
    );

    if (response.value?.code === 200) {
      toast.success(response.value.message);
      visible.value = false;
      emit("showLogin");
    } else {
      toast.error(response.value?.message ?? "Đặt lại mật khẩu thất bại");
    }
  } catch (error) {
    toast.error("Đã xảy ra lỗi khi đặt lại mật khẩu");
  } finally {
    isLoading.value = false;
  }
}

async function clear() {
  step.value = "verify";
  email.value = "";
  actionTicket.value = "";
}
</script>
