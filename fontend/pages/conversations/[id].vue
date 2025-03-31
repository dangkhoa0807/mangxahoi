<template>
  <div
    class="w-full lg:w-8/12 xl:w-9/12 h-full absolute top-0 right-0 z-10"
    v-if="chatStore.chatPartnerInfo"
  >
    <ChatMessage></ChatMessage>
  </div>
</template>

<script setup lang="ts">
import ChatMessage from "~/components/Messesage/ChatMessage.vue";

const chatStore = useChatStore();
const route = useRoute();

definePageMeta({
  layout: "conversations",
  middleware: ["auth"],
});
</script>

<style scoped></style>
