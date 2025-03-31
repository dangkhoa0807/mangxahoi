export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  const api = $fetch.create({
    baseURL: config.public.API_DOMAIN,
    // baseURL: "https://api.twok.erisvn.net",
  });

  return {
    provide: {
      api,
    },
  };
});
