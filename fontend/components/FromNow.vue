<template>
  <span>{{ fromNowText }}</span>
</template>

<script setup>
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const props = defineProps({
  datetime: {
    type: [String, Date],
    required: true,
  },
});

const fromNowText = ref("");

const updateFromNow = () => {
  fromNowText.value = dayjs(props.datetime).fromNow();
};

// Kiểm tra nếu đang ở phía client
if (import.meta.client) {
  let interval;
  onMounted(() => {
    updateFromNow();
    interval = setInterval(updateFromNow, 60000);
  });

  onUnmounted(() => {
    clearInterval(interval);
  });
} else {
  // Nếu đang ở phía server, chỉ cập nhật một lần
  updateFromNow();
}
</script>
