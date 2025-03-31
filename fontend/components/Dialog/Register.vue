<template>
  <div>
    <Dialog
      v-model:visible="visible"
      modal
      :draggable="false"
      header="Đăng ký"
      :style="{ width: '32rem' }"
    >
      <Form @submit="handleRegister" :validation-schema="schema">
        <!-- Email -->
        <div class="mb-4">
          <Field
            v-model="formData.email"
            name="email"
            placeholder="Email"
            class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-gray-500 transition duration-300 ease-in-out"
          />
          <ErrorMessage name="email" class="block mt-1 text-red-500" />
        </div>

        <div class="mb-4 relative">
          <Field
            v-model="formData.code"
            name="code"
            placeholder="Code"
            class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-gray-500 transition duration-300 ease-in-out"
          />
          <div
            class="absolute top-2 right-0 border-l border-[#ccc] cursor-pointer"
            @click="sendEmail"
          >
            <span class="text-[#4A88FC] px-4 hover:opacity-80">Gửi mã</span>
          </div>
          <ErrorMessage name="code" class="block mt-1 text-red-500" />
        </div>

        <!-- Mật khẩu -->
        <div class="mb-4">
          <Field
            type="password"
            v-model="formData.password"
            name="password"
            placeholder="Mật khẩu"
            class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-gray-500 transition duration-300 ease-in-out"
          />
          <ErrorMessage name="password" class="block mt-1 text-red-500" />
        </div>

        <!-- Xác nhận mật khẩu -->
        <div class="mb-4">
          <Field
            type="password"
            v-model="formData.confirm_password"
            name="confirm_password"
            placeholder="Xác nhận mật khẩu"
            class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-gray-500 transition duration-300 ease-in-out"
          />
          <ErrorMessage
            name="confirm_password"
            class="block mt-1 text-red-500"
          />
        </div>

        <!-- Nút Đăng ký -->
        <Button label="Đăng ký" class="w-full" type="submit"></Button>

        <div class="mt-3 text-center">
          Đã có tài khoản?
          <span class="text-blue-600 cursor-pointer" @click="switchToLogin()"
            >Đăng nhập ngay!</span
          >
        </div>
      </Form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import * as yup from "yup";
import type { ApiResponse } from "~/types/api";

const toast = useToast();

const schema = yup.object({
  email: yup
    .string()
    .email("Email chưa đúng định dạng.")
    .required("Email không được bỏ trống"),
  code: yup
    .string()
    .length(6, "Mã xác nhận phải có 6 ký tự")
    .required("Mã xác nhận không được bỏ trống"),
  password: yup
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .required("Mật khẩu không được bỏ trống"),
  confirm_password: yup
    .string()
    .oneOf([yup.ref("password"), ""], "Mật khẩu xác nhận không khớp")
    .required("Xác nhận mật khẩu không được bỏ trống"),
});

const formData = reactive({
  email: "",
  code: null,
  password: "",
  confirm_password: "",
});

const visible = defineModel({ default: true });
const emit = defineEmits(["showForgetPass", "showLogin"]);

function switchToLogin() {
  visible.value = false;
  emit("showLogin");
}

const handleRegister = async () => {
  const { data: response } = await useAPI<ApiResponse<{}>>(
    "/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: formData,
      watch: false,
    }
  );

  if (response.value?.code == 200) {
    switchToLogin();
    toast.success(response.value.message);
  } else {
    toast.error(response.value?.message ?? "Lấy dữ liệu thất bại");
  }
};

const sendEmail = async () => {
  const { data: response } = await useAPI<ApiResponse<{}>>(
    "/api/auth/emailCaptcha",
    {
      method: "POST",
      body: {
        email: formData.email,
        action: "register",
      },
    }
  );

  if (response.value?.code == 200) {
    toast.success(response.value.message);
  } else {
    toast.error(response.value?.message ?? "Lấy dữ liệu thất bại");
  }
};
</script>

<style scoped></style>
