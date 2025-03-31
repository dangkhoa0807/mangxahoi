<template>
  <div>
    <Dialog
      v-model:visible="model"
      modal
      :draggable="false"
      header="Xác Minh Bảo Mật"
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
        <p class="text-center mb-2">
          Vui lòng nhập mã xác nhận email để xác minh danh tính
        </p>
        <p class="text-center font-semibold mb-4">{{ email }}</p>
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

    <Loading v-model="isLoading" />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import Loading from "~/components/Dialog/Loading.vue";

const model = defineModel<boolean>({ required: true, default: false });

const props = defineProps({
  email: { type: String, required: true },
  action: { type: String, required: true },
});

const emit = defineEmits(["update:modelValue", "verified"]);
const toast = useToast();

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
    "/api/user/emailCaptcha",
    {
      method: "POST",
      body: {
        action: props.action,
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
  const { data: response } = await useAPI<
    ApiResponse<{
      ticket: string;
    }>
  >("/api/user/actionTicket", {
    method: "POST",
    body: {
      code: verificationCode.value,
      action: props.action,
    },
  });

  if (response.value?.code == 200) {
    toast.success(response.value.message);
    emit("verified", {
      ticket: response.value.data.ticket,
      action: props.action,
    });
  } else {
    toast.error(response.value?.message ?? "Xác minh thất bại");
  }
  isLoading.value = false;
}

async function clear() {
  verificationCode.value = "";
  countdown.value = 0;
  isCountingDown.value = false;
}

onUnmounted(() => {
  countdown.value = 0;
  isCountingDown.value = false;
});
</script>
