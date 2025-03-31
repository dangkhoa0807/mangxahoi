import type { ApiResponse } from "~/types/api";

export default defineNuxtRouteMiddleware(async (to, from) => {
  try {
    const auth = useAuth();

    if (import.meta.server) {
      await useAsyncData("user", () => auth.getUser().then(() => true));
    } else {
      useAsyncData("user", () => auth.getUser().then(() => true));
    }
  } catch (error) {}
});
