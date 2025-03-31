<template>
  <div>
    <Dialog
      v-model:visible="visible"
      modal
      :draggable="false"
      header="Đăng nhập"
      :style="{ width: '32rem' }"
      @show="clearData"
    >
      <Form @submit="handleLogin" :validation-schema="schema">
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

        <!-- Quên mật khẩu -->
        <div
          class="text-end mb-4 text-blue-600 cursor-pointer"
          @click="switchToForgetPass()"
        >
          Quên mật khẩu?
        </div>

        <!-- Nút đăng nhập -->
        <Button label="Đăng nhập" class="w-full" @click="handleLogin"></Button>
      </Form>

      <Divider align="center" type="dotted"> hoặc đăng nhập bằng </Divider>

      <div class="flex flex-col gap-3">
        <div
          @click="() => loginGoogle()"
          class="bg-white border p-2 rounded-3xl flex gap-4 py-3 items-center relative cursor-pointer"
        >
          <img
            class="w-8 absolute"
            src="https://s3.cloudfly.vn/shoperis/2024/09/bae878a333b19f19cea1231d371f9112.avif"
            alt="Google"
          />
          <div class="text-center w-full">Đăng nhập với Google</div>
        </div>
        <div
          @click="() => loginDiscord()"
          class="bg-white border p-2 rounded-3xl flex gap-4 py-3 items-center relative cursor-pointer"
        >
          <img
            class="w-8 absolute"
            src="https://cdn-icons-png.flaticon.com/512/3670/3670157.png"
            alt="Discord"
          />
          <div class="text-center w-full">Đăng nhập với Discord</div>
        </div>
      </div>

      <div class="mt-3 text-center">
        Chưa có tài khoản?
        <span class="text-blue-600 cursor-pointer" @click="switchToRegister()"
          >Tạo tài khoản ngay!</span
        >
      </div>
    </Dialog>

    <CreateProfile
      v-model="isVisibleCreateProfile"
      :action_ticket="actionTicket"
    ></CreateProfile>

    <DeviceVerification
      v-model="isVisibleDeviceVerification"
      :action_ticket="actionTicket"
    ></DeviceVerification>

    <Loading v-model="isLoading" />
  </div>
</template>

<script setup lang="ts">
import CreateProfile from "../CreateProfile.vue";
import Loading from "./Loading.vue";
import DeviceVerification from "./DeviceVerification.vue";

import * as yup from "yup";
import {
  useCodeClient,
  type ImplicitFlowSuccessResponse,
} from "vue3-google-signin";
import type { ApiResponse } from "~/types/api";

const toast = useToast();
const auth = useAuth();

const isLoading = ref(false);

// Xử lý chuyển đổi các modal
const visible = defineModel({ default: false });
const emit = defineEmits([
  "showForgetPassword",
  "showRegister",
  "showCreateProfile",
]);

function switchToForgetPass() {
  visible.value = false;
  emit("showForgetPassword");
}

function switchToRegister() {
  visible.value = false;
  emit("showRegister");
}

const schema = yup.object({
  email: yup
    .string()
    .email("Email chưa đúng định dạng.")
    .required("Email không được bỏ trống"),
  password: yup
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .required("Mật khẩu không được bỏ trống"),
});

const handleOnSuccess = async (response: ImplicitFlowSuccessResponse) => {
  const { data: result } = await useAPI<
    ApiResponse<{
      access_token: string;
      refresh_token: string;
      action_ticket: string;
    }>
  >("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({
      code: response.code,
    }),
  });
  if (result.value?.code == 200) {
    toast.success(result.value.message);

    await auth.setTokens(
      result.value.data.access_token,
      result.value.data.refresh_token
    );
    visible.value = false;

    if (!auth.user?.profile) {
      emit("showCreateProfile");
    }

    useEvent("user:update-post-list");
  } else if (result.value?.code == 201) {
    toast.success(result.value.message);
    visible.value = false;
    actionTicket.value = result.value.data.action_ticket;
    isVisibleCreateProfile.value = true;
  } else {
    toast.error(result.value?.message ?? "Lấy dữ liệu thất bại");
  }
};

// Đăng nhập với Google
const { isReady, login: loginGoogle } = useCodeClient({
  onSuccess: handleOnSuccess,
});

// Đăng nhập với Discord
async function loginDiscord() {
  try {
    isLoading.value = true;
    const { data: response } = await useAPI<
      ApiResponse<{
        url: string;
      }>
    >("/api/auth/discord", {
      method: "GET",
    });
    if (response.value?.code == 200) {
      window.location.href = response.value.data.url;
    } else {
      toast.error(response.value?.message ?? "Lấy dữ liệu thất bại");
    }
  } catch (error) {
    toast.error((error as Error).message);
  } finally {
    isLoading.value = false;
  }
}

// State form data và lỗi
const formData = reactive({
  email: "",
  password: "",
});

// Xử lý đăng nhập với email và mật khẩu
async function handleLogin() {
  isLoading.value = true;
  const { data: response } = await useAPI<
    ApiResponse<{
      access_token: string;
      refresh_token: string;
      action_ticket: string;
    }>
  >("/api/auth/login", {
    method: "POST",
    body: formData,
    watch: false,
  });

  if (response.value?.code == 200) {
    toast.success(response.value.message);

    await auth.setTokens(
      response.value.data.access_token,
      response.value.data.refresh_token
    );
    visible.value = false;

    if (!auth.user?.profile) {
      emit("showCreateProfile");
    }

    useEvent("user:update-post-list");
  } else if (response.value?.code == 201) {
    toast.success(response.value.message);
    visible.value = false;
    actionTicket.value = response.value.data.action_ticket;
    isVisibleCreateProfile.value = true;
  } else if (response.value?.code == 202) {
    toast.success(response.value.message);
    visible.value = false;
    actionTicket.value = response.value.data.action_ticket;
    isVisibleDeviceVerification.value = true;
  } else {
    toast.error(response.value?.message ?? "Lấy dữ liệu thất bại");
  }
  isLoading.value = false;
}

// xử lý tạo profile
const isVisibleCreateProfile = ref(false);
const actionTicket = ref();

async function clearData() {
  formData.email = "";
  formData.password = "";
}

// xử lý xác minh thiết bị
const isVisibleDeviceVerification = ref(false);
</script>

<style scoped></style>
