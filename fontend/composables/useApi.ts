import type { ApiResponse } from "@/types/api";
import type { UseFetchOptions } from "nuxt/app";

function hasCode<T>(data: any): data is ApiResponse<T> {
  return typeof data === "object" && "code" in data;
}

export const useAPI = async <T>(
  url: string,
  options: UseFetchOptions<T> = {},
  autoRefresh: boolean = true // Thêm tham số để bật/tắt tự động refresh token
) => {
  const auth = useAuth();
  let accessToken = auth.getAccessToken();

  const customOptions: UseFetchOptions<T> = {
    ...toValue(options),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "device-id": useDevice().getDeviceId(),
    },
    $fetch: useNuxtApp().$api,
  };

  const state = reactive<{
    data: T | null;
    status: "idle" | "pending" | "success" | "error";
    error: any;
  }>({
    data: null,
    status: "idle",
    error: null,
  });

  const fetchData = async () => {
    try {
      state.status = "pending";

      const { data, status, error, refresh } = await useFetch(url, {
        ...customOptions,
        key: url,
        watch: false,
      });

      if (error.value) {
        throw Error(String(error.value));
      }

      state.status = "success";
      state.data = data as any;
    } catch (error) {
      state.status = "error";
      state.error = error instanceof Error ? error.message : String(error);
    }

    if (
      autoRefresh &&
      state.data &&
      hasCode(state.data) &&
      state.data.code == 401 &&
      auth.getAccessToken()
    ) {
      await auth.refreshTokens();

      if (auth.user) {
        customOptions.headers = {
          ...customOptions.headers,
          Authorization: `Bearer ${auth.getAccessToken()}`,
        };

        return await useAPI(url, customOptions, autoRefresh);
      }
    }
  };

  await fetchData();

  const refresh = async () => {
    await fetchData();
  };

  return {
    ...toRefs(state),
    refresh,
  };
};
