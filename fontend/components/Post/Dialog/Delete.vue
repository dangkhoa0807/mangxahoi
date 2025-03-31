<template>
  <Dialog
    v-model:visible="modelValue"
    modal
    :showHeader="false"
    :style="{ width: '25rem' }"
  >
    <div class="flex flex-col items-center w-full gap-4 my-5">
      <Icon
        name="fluent:info-32-regular"
        class="!text-6xl text-primary-500"
      ></Icon>
      <p>Bạn có chắc muốn xoá bài viết này.</p>
    </div>
    <div class="flex justify-center gap-2">
      <Button
        type="button"
        label="Thôi"
        severity="secondary"
        :outlined="true"
        @click="$emit('update:modelValue', false)"
      ></Button>
      <Button
        type="button"
        severity="danger"
        label="Xoá"
        @click="$emit('confirm')"
      ></Button>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
defineProps({
  modelValue: { type: Boolean, required: true },
});

defineEmits(["update:modelValue", "confirm"]);
</script>
