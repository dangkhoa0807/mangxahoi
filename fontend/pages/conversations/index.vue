<template>
  <Chat></Chat>
</template>

<script setup lang="ts">
import Chat from "./[id].vue";

definePageMeta({
  layout: "conversations",
  middleware: ["auth"],
});
</script>
