// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        },
      },
    },
  },
  modules: [
    "@primevue/nuxt-module",
    "@nuxt/icon",
    "@nuxtjs/google-fonts",
    "nuxt-vue3-google-signin",
    "@pinia/nuxt",
    "@vee-validate/nuxt",
    "dayjs-nuxt",
    "nuxt-swiper",
    "nuxt-headlessui",
    "@vueuse/nuxt",
  ],
  googleFonts: {
    families: {
      Signika: true,
      "Noto+Color+Emoji": true,
    },
  },
  headlessui: {
    prefix: "Headless",
  },
  primevue: {
    importTheme: { from: "@/themes/main.js" },
    composables: {
      exclude: ["useToast"],
    },
    components: {
      exclude: ["Form"],
    },
  },
  googleSignIn: {
    clientId:
      "46142776992-vbl1gbpb3ej4vpau1566bjo2fai9im9p.apps.googleusercontent.com",
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  components: {
    dirs: [],
  },
  runtimeConfig: {
    NUXT_SECRET: process.env.SECRET_KEY,
    public: {
      API_DOMAIN: process.env.API_DOMAIN,
      WS_DOMAIN: process.env.WS_DOMAIN,
    },
  },
});
