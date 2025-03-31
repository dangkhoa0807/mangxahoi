import { type ToastContainerOptions } from "vue3-toastify";

export const useToast = () => {
  const app = useNuxtApp();

  return {
    show(context: string | any, options?: ToastContainerOptions) {
      app.$toast(context, options);
    },
    loading(
      context: string | any = "Đang tải dữ liệu...",
      options?: ToastContainerOptions
    ) {
      app.$toast.loading(context, options);
    },
    update(id: any, options?: ToastContainerOptions) {
      app.$toast.update(id, options);
    },
    done(id: any) {
      app.$toast.done(id);
    },
    info(context: string | any, options?: ToastContainerOptions) {
      app.$toast.info(context, options);
    },
    success(context: string | any, options?: ToastContainerOptions) {
      app.$toast.success(context, options);
    },
    error(context: string | any, options?: ToastContainerOptions) {
      app.$toast.error(context, options);
    },
  };
};
