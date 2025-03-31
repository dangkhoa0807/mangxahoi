import { ref, onMounted, onUnmounted } from "vue";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "@/tailwind.config.js";

export function useBreakpoint() {
  const config = resolveConfig(tailwindConfig);
  const screens = config.theme.screens;

  const isMd = ref(false);
  const isLg = ref(false);

  const checkBreakpoint = () => {
    if (screens.md) {
      isMd.value = window.matchMedia(`(min-width: ${screens.md})`).matches;
    }
    if (screens.lg) {
      isLg.value = window.matchMedia(`(min-width: ${screens.lg})`).matches;
    }
  };

  onMounted(() => {
    checkBreakpoint(); // Kiểm tra khi component được mount

    // Theo dõi sự thay đổi của breakpoint md và lg
    if (screens.md) {
      window
        .matchMedia(`(min-width: ${screens.md})`)
        .addEventListener("change", checkBreakpoint);
    }
    if (screens.lg) {
      window
        .matchMedia(`(min-width: ${screens.lg})`)
        .addEventListener("change", checkBreakpoint);
    }
  });

  onUnmounted(() => {
    // Loại bỏ listener khi component bị unmount
    if (screens.md) {
      window
        .matchMedia(`(min-width: ${screens.md})`)
        .removeEventListener("change", checkBreakpoint);
    }
    if (screens.lg) {
      window
        .matchMedia(`(min-width: ${screens.lg})`)
        .removeEventListener("change", checkBreakpoint);
    }
  });

  return { isMd, isLg };
}
