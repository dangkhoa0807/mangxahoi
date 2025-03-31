<template>
  <input
    ref="tagInput"
    :value="model"
    :placeholder="placeholder"
    class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-gray-500 transition duration-300 ease-in-out"
  />
</template>

<script setup>
import Tagify from "@yaireo/tagify";
import "@yaireo/tagify/dist/tagify.css";

const model = defineModel(ref([]));

const props = defineProps({
  onChange: Function,
  placeholder: { type: String, default: "Nhập tags..." },
});

const tagInput = ref(null);
let tagifyInstance;

onMounted(() => {
  tagifyInstance = new Tagify(tagInput.value, {});

  tagifyInstance.on("change", (e) => {
    model.value = e.detail.value;
  });
});

onBeforeUnmount(() => {
  tagifyInstance.destroy();
});
</script>
