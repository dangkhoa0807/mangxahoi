import type { ApiResponse } from "~/types/api";

export default defineNuxtRouteMiddleware(async (to, from) => {
  try {
    const auth = useAuth();

    if (!auth.isAdmin) {
      return navigateTo("/");
    }
  } catch (error) {}
});
