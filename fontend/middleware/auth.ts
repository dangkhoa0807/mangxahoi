export default defineNuxtRouteMiddleware((to, from) => {
  const nuxtApp = useNuxtApp();

  try {
    const auth = useAuth();

    if (!auth.user) {
      return nuxtApp.runWithContext(() => navigateTo("/"));
    }
  } catch (error) {}
});
