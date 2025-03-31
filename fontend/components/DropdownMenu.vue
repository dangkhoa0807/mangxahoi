<template>
  <div class="mb-2">
    <button
      @click="isOpen = !isOpen"
      class="group flex gap-4 py-2 px-4 rounded hover:bg-gray-200 w-full"
      :class="{ 'bg-gray-200': active }"
    >
      <Icon :name="icon" class="text-2xl"></Icon>
      {{ label }}
      <Icon
        name="tabler:chevron-down"
        class="text-2xl ml-auto transition-transform"
        :class="{ 'rotate-180': isOpen }"
      ></Icon>
    </button>
    <div v-show="isOpen" class="ml-4 mt-2">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  label: { type: String, required: true },
  icon: { type: String, required: true },
  active: { type: Boolean, default: false },
});

const isOpen = ref(props.active);

watch(
  () => props.active,
  (newValue) => {
    isOpen.value = newValue;
  }
);
</script>
