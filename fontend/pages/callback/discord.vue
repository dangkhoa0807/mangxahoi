<template>
  <div>
    <h1>Bạn đang đăng nhập với Discord</h1>
    <p>{{ message ?? "Vui lòng đợi trong giây lát..." }}</p>
  </div>
</template>

<script lang="ts" setup>
import type { ApiResponse } from "~/types/api";

const route = useRoute();
const auth = useAuth();
const router = useRouter();
const message = ref("");

async function login() {
  const { data: response } = await useAPI<
    ApiResponse<{
      access_token: string;
      refresh_token: string;
    }>
  >("/api/auth/discord", {
    method: "POST",
    body: {
      code: route.query.code,
    },
  });
  if (response.value?.code == 200) {
    message.value = "Đăng nhập thành công";
    auth.setTokens(
      response.value.data.access_token,
      response.value.data.refresh_token
    );

    if (window) {
      window.location.href = "/";
    }
  } else {
    message.value = response.value?.message ?? "Đăng nhập thất bại";
  }
}

await login();
</script>
