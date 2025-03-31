<template>
  <Dialog
    v-model:visible="model"
    modal
    :draggable="false"
    :closable="false"
    :style="{ width: '20rem' }"
    class="rounded-lg shadow-lg"
    :show-header="false"
  >
    <div class="flex flex-col items-center py-4 mt-5">
      <div class="flex items-center gap-3">
        <Icon name="ph:spinner" class="text-2xl text-blue-500 animate-spin" />
        <span class="text-lg">{{ message }}</span>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
const model = defineModel<boolean>({ required: true, default: false });

defineProps({
  message: { type: String, default: "Đang xử lý..." },
});
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
