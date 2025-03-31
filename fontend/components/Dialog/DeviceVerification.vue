<!-- components/Dialog/DeviceVerification.vue -->
<template>
  <div>
    <Dialog
      v-model:visible="model"
      modal
      :draggable="false"
      header="Xác Minh Thiết Bị"
      :style="{ width: '28rem' }"
      class="rounded-lg shadow-lg"
      @hide="clear"
    >
      <div class="flex flex-col items-center">
        <div
          class="bg-blue-100 w-12 h-12 flex items-center justify-center rounded-full mb-4"
        >
          <Icon name="tabler:device-laptop" class="text-blue-500 text-2xl" />
        </div>
        <p class="text-center mb-2">
          Vui lòng nhập mã xác nhận được gửi đến email của bạn để xác minh thiết
          bị mới
        </p>
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
    </Dialog>

    <CreateProfile
      v-model="isVisibleCreateProfile"
      :action_ticket="createProfileTicket"
    ></CreateProfile>

    <Loading v-model="isLoading" />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import CreateProfile from "../CreateProfile.vue";
import Loading from "./Loading.vue";

const model = defineModel<boolean>({ required: true, default: false });
const props = defineProps({
  action_ticket: { type: String },
});

const emit = defineEmits(["verified"]);
const toast = useToast();
const auth = useAuth();

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
  if (isCountingDown.value) return;

  isLoading.value = true;
  const { data: response } = await useAPI<ApiResponse<{}>>(
    "/api/auth/newDeviceCaptcha",
    {
      method: "POST",
      body: {
        action_ticket: props.action_ticket,
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
  if (!verificationCode.value) {
    toast.error("Vui lòng nhập mã xác nhận");
    return;
  }

  isLoading.value = true;
  const { data: response } = await useAPI<
    ApiResponse<{
      access_token: string;
      refresh_token: string;
      action_ticket: string;
    }>
  >("/api/auth/verifyNewDevice", {
    method: "POST",
    body: {
      code: verificationCode.value,
      action_ticket: props.action_ticket,
    },
  });

  if (response.value?.code == 200) {
    toast.success(response.value.message);
    // emit("verified", response.value.data);
    await auth.setTokens(
      response.value.data.access_token,
      response.value.data.refresh_token
    );
    model.value = false;
  } else if (response.value?.code == 201) {
    model.value = false;
    isVisibleCreateProfile.value = true;
    createProfileTicket.value = response.value.data.action_ticket;
  } else {
    toast.error(response.value?.message ?? "Xác minh thất bại");
  }
  isLoading.value = false;
}

function clear() {
  verificationCode.value = "";
  countdown.value = 0;
  isCountingDown.value = false;
}

const isVisibleCreateProfile = ref(false);
const createProfileTicket = ref("");
</script>
