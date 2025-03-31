<template>
  <div class="mx-auto w-full">
    <div class="bg-white rounded-md shadow-sm p-5">
      <div class="font-semibold text-2xl mb-1">Tài khoản</div>
      <hr />
      <div class="w-full mt-4">
        <div class="flex flex-col gap-3 w-full">
          <div
            class="flex justify-between group hover:cursor-pointer"
            @click="showVerification('change_email')"
          >
            <span>Email</span>
            <div class="flex gap-1">
              <div>{{ auth.user.email }}</div>
              <span
                class="group-hover:bg-gray-200 size-6 rounded-full inline-flex items-center justify-center"
              >
                <Icon name="tabler:edit" />
              </span>
            </div>
          </div>
          <div
            class="flex justify-between group hover:cursor-pointer"
            @click="showVerification('change_password')"
          >
            <span>Mật khẩu</span>
            <div class="flex gap-1 items-center">
              <div>••••••</div>
              <span
                class="group-hover:bg-gray-200 size-6 rounded-full inline-flex items-center justify-center"
              >
                <Icon name="tabler:edit" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ChangeEmail
      v-model="changeEmailVisible"
      :email="auth.user.email"
      :ticket="actionTicket"
    />

    <ChangePassword v-model="changePasswordVisible" :ticket="actionTicket" />

    <EmailVerification
      v-model="emailVerificationVisible"
      :email="auth.user.email"
      :action="action"
      @verified="handleVerified"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ApiResponse } from "~/types/api";
import EmailVerification from "~/components/Dialog/EmailVerification.vue";
import ChangeEmail from "~/components/Dialog/ChangeEmail.vue";
import ChangePassword from "~/components/Dialog/ChangePassword.vue";

const emailVerificationVisible = ref(false);

const auth = useAuth();

const action = ref<string>("");

const showVerification = (_action: string) => {
  action.value = _action;
  emailVerificationVisible.value = true;
};

const handleVerified = (data: { ticket: string; action: string }) => {
  emailVerificationVisible.value = false;
  actionTicket.value = data.ticket;
  if (data.action === "change_email") {
    changeEmailVisible.value = true;
  } else if (data.action === "change_password") {
    changePasswordVisible.value = true;
  }
};

const changeEmailVisible = ref(false);
const actionTicket = ref("");
const changePasswordVisible = ref(false);
</script>

<style></style>
