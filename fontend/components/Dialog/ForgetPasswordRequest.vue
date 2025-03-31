<template>
  <div>
    <div class="flex flex-col items-center">
      <div
        class="bg-blue-100 w-12 h-12 flex items-center justify-center rounded-full mb-4"
      >
        <Icon name="tabler:mail" class="text-blue-500 text-2xl" />
      </div>
      <p class="text-center mb-2">
        Vui lòng nhập tài khoản cần tìm lại mật khẩu
      </p>
      <div class="flex gap-2 relative w-full mb-4">
        <InputText
          v-model="email"
          placeholder="Email"
          class="w-full border border-gray-300 rounded"
        />
      </div>
      <div class="flex gap-2 relative w-full">
        <InputText
          v-model="verificationCode"
          placeholder="Mã Xác Nhận"
          class="w-full border border-gray-300 rounded"
        />
        <div class="absolute right-3 h-full flex items-center">
          <div
            class="ps-2 cursor-pointer border-l border-blue-500/30"
            :class="[
              isCountingDown
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-500 hover:text-blue-600',
            ]"
            @click="sendVerificationCode"
          >
            {{ buttonText }}
          </div>
        </div>
      </div>
      <Button label="Xác nhận" class="mt-4 w-full" @click="verify"></Button>
    </div>

    <Loading v-model="isLoading" />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import Loading from "../Dialog/Loading.vue";

const emit = defineEmits(["verified"]);
const toast = useToast();

const email = ref("");
const verificationCode = ref("");
const countdown = ref(0);
const isCountingDown = ref(false);
const isLoading = ref(false);

const buttonText = computed(() => {
  return isCountingDown.value ? `Gửi mã (${countdown.value}s)` : "Gửi mã";
});

function startCountdown() {
  isCountingDown.value = true;
  countdown.value = 60;

  const timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
      isCountingDown.value = false;
    }
  }, 1000);
}

async function sendVerificationCode() {
  if (isCountingDown.value || !email.value) return;

  isLoading.value = true;
  const { data: response } = await useAPI<ApiResponse<{}>>(
    "/api/auth/emailCaptcha",
    {
      method: "POST",
      body: {
        email: email.value,
        action: "reset_password",
      },
    }
  );

  if (response.value?.code == 200) {
    toast.success(response.value.message);
    startCountdown();
  } else {
    toast.error(response.value?.message ?? "Gửi mã xác nhận thất bại");
  }
  isLoading.value = false;
}

async function verify() {
  if (!email.value || !verificationCode.value) {
    toast.error("Vui lòng nhập đầy đủ thông tin");
    return;
  }

  isLoading.value = true;
  const { data: response } = await useAPI<ApiResponse<{ ticket: string }>>(
    "/api/auth/actionTicket",
    {
      method: "POST",
      body: {
        email: email.value,
        code: verificationCode.value,
        action: "reset_password",
      },
    }
  );

  if (response.value?.code == 200) {
    toast.success(response.value.message);
    emit("verified", {
      email: email.value,
      code: verificationCode.value,
      ticket: response.value.data.ticket,
    });
  } else {
    toast.error(response.value?.message ?? "Xác minh thất bại");
  }
  isLoading.value = false;
}

function clear() {
  email.value = "";
  verificationCode.value = "";
  countdown.value = 0;
  isCountingDown.value = false;
}

onUnmounted(() => {
  countdown.value = 0;
  isCountingDown.value = false;
});
</script>
