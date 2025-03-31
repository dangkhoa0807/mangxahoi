<template>
  <div>
    <Dialog
      v-model:visible="model"
      modal
      :draggable="false"
      header="Xác Nhận Email Mới"
      :style="{ width: '28rem' }"
      class="rounded-lg shadow-lg"
      @hide="clear"
    >
      <div class="flex flex-col items-center">
        <div
          class="bg-blue-100 w-12 h-12 flex items-center justify-center rounded-full mb-4"
        >
          <Icon name="tabler:mail" class="text-blue-500 text-2xl" />
        </div>
        <p class="text-center mb-2">Vui lòng nhập email mới của bạn</p>
        <div class="flex gap-2 relative w-full mb-4">
          <InputText
            v-model="newEmail"
            placeholder="Email mới"
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
        <Button
          label="Xác nhận"
          class="mt-4 w-full"
          @click="verify"
          :loading="isLoading"
        ></Button>
      </div>
    </Dialog>

    <Loading v-model="isLoading" />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import Loading from "./Loading.vue";

const model = defineModel<boolean>({ required: true, default: false });

const props = defineProps({
  ticket: { type: String, required: true },
});

const emit = defineEmits(["update:modelValue", "confirmed"]);
const toast = useToast();
const auth = useAuth();

const isLoading = ref(false);

const newEmail = ref("");
const verificationCode = ref("");
const countdown = ref(0);
const isCountingDown = ref(false);

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
  if (isCountingDown.value || !newEmail.value) return;

  isLoading.value = true;
  const { data: response } = await useAPI<ApiResponse<{}>>(
    "/api/user/newEmailCaptcha",
    {
      method: "POST",
      body: {
        email: newEmail.value,
        action_ticket: props.ticket,
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
  isLoading.value = true;
  const { data: response } = await useAPI<ApiResponse>(
    "/api/user/changeEmail",
    {
      method: "POST",
      body: {
        email: newEmail.value,
        code: verificationCode.value,
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
    toast.error(response.value?.message ?? "Xác minh thất bại");
  }
}

function clear() {
  newEmail.value = "";
  verificationCode.value = "";
  countdown.value = 0;
  isCountingDown.value = false;
}
</script>
