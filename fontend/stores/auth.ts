import type { ApiResponse } from "@/types/api";
import { defineStore } from "pinia";
import type { User } from "~/types/model";

export const useAuth = defineStore("auth", () => {
  const accessToken = useCookie("accessToken", { maxAge: 30 * 24 * 60 * 60 });
  const refreshToken = useCookie("refreshToken", { maxAge: 30 * 24 * 60 * 60 });
  const { $api } = useNuxtApp();
  const device = useDevice();
  const isAuthenticated = computed(() => !!user.value);
  const user = ref<User | null>(null);

  const isRefreshing = ref(false);
  const refreshingTokenPromise = ref<Promise<void> | null>(null);

  async function getUser() {
    try {
      if (accessToken.value) {
        const data = await $api<ApiResponse<User>>("/api/user", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken.value}`,
          },
        });

        if (data.code == 200) {
          user.value = data.data;
        } else if (data.code == 401) {
          await refreshTokens();
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  const isAdmin = computed(() => {
    if (user.value) {
      return user.value.roles.some((role) => role === "ADMIN");
    }
    return false;
  });

  async function refreshTokens() {
    if (!refreshToken.value) {
      await signOut();
      return;
    }

    if (refreshingTokenPromise.value) {
      return refreshingTokenPromise.value;
    }

    isRefreshing.value = true;

    refreshingTokenPromise.value = new Promise(async (resolve, reject) => {
      try {
        const deviceId = device.getDeviceId();

        const data = await $api<
          ApiResponse<{
            access_token: string;
            refresh_token: string;
          }>
        >("/api/auth/refreshToken", {
          method: "POST",
          body: {
            refresh_token: refreshToken.value,
          },
          headers: {
            "Content-Type": "application/json",
            "device-id": deviceId,
          },
        });

        if (data.code == 200) {
          accessToken.value = data.data.access_token;
          refreshToken.value = data.data.refresh_token;
          await getUser();
          resolve();
        } else {
          await signOut();
          reject(new Error("Failed to refresh tokens"));
        }
      } catch (error) {
        console.log("ERROR refreshToken: ", error);
        await signOut();
        reject(error);
      } finally {
        refreshingTokenPromise.value = null; // Đảm bảo giải phóng
        isRefreshing.value = false;
      }
    });

    return refreshingTokenPromise.value;
  }

  async function setTokens(access: string, refresh: string) {
    accessToken.value = access;
    refreshToken.value = refresh;
    await getUser();
  }

  async function signOut() {
    await $api("/api/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
      },
    });
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    if (import.meta.client) {
      const toast = useToast();
      toast.success("Đăng xuất thành công");
      navigateTo({ path: "/" });
    }
  }

  function getAccessToken() {
    return accessToken.value;
  }

  function getRefreshToken() {
    return refreshToken.value;
  }

  return {
    isAuthenticated,
    user,
    signOut,
    setTokens,
    getUser,
    getAccessToken,
    getRefreshToken,
    refreshTokens,
    isAdmin,
  };
});
