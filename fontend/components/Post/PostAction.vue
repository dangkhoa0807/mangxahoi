<template>
  <div>
    <div class="flex gap-3">
      <!-- Like -->
      <div class="relative w-full">
        <div
          class="w-full md:text-base bg-gray-100 hover:bg-gray-200 transition duration-150 ease-in-out rounded-md p-1 px-2 flex gap-1 border border-gray-200 hover:border-gray-300 cursor-pointer text-sm items-center justify-center truncate"
          :class="isLiked ? 'text-blue-500 bg-gray-100' : 'text-zinc-800'"
          @click="selectReaction(reaction ?? 'LIKE')"
          @mouseenter="showReactions = true"
          @mouseleave="hideReactions"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
        >
          <img :src="getReactionImage(reaction)" alt="" class="w-5 h-5" />
          <span class="select-none" :class="getReactionClass(reaction)">{{
            getReactionText(reaction)
          }}</span>
        </div>

        <!-- Reactions Popover -->
        <transition
          enter-active-class="transition duration-200 ease-out delay-300"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div
            v-if="showReactions"
            class="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border p-2 flex gap-2 z-50"
            @mouseenter="cancelHideReactions"
            @mouseleave="hideReactions"
          >
            <div
              v-for="reaction in reactions"
              :key="reaction.type"
              class="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-transform hover:scale-110 w-11 h-11 flex items-center justify-center"
              @click="selectReaction(reaction.type)"
            >
              <img :src="reaction.image" alt="" />
            </div>
          </div>
        </transition>
      </div>

      <!-- Comment -->
      <div
        class="w-full md:text-base bg-gray-100 hover:bg-gray-200 transition duration-150 ease-in-out rounded-md p-1 px-2 flex gap-1 border border-gray-200 hover:border-gray-300 cursor-pointer text-sm items-center justify-center truncate"
        @click="emit('onComment')"
      >
        <Icon
          name="tabler:message-circle"
          class="text-lg md:text-xl text-gray-600"
        ></Icon>
        Bình luận
      </div>

      <!-- Share -->
      <div
        v-if="!post.originalPost && !post.group"
        class="w-full md:text-base bg-gray-100 hover:bg-gray-200 transition duration-150 ease-in-out rounded-md p-1 px-2 flex gap-1 border border-gray-200 hover:border-gray-300 cursor-pointer text-sm items-center justify-center truncate"
        @click="emit('onShare')"
      >
        <Icon
          name="tabler:share"
          class="text-lg md:text-xl text-gray-600"
        ></Icon>
        Chia sẻ
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from "~/types/model";

const auth = useAuth();

const props = defineProps({
  post: { type: Object as PropType<Post>, required: true },
  isLiked: { type: Boolean, default: false },
});

const reaction = computed(() => {
  return props.post?.reactions?.length > 0
    ? props.post.reactions[0].type
    : null;
});

const emit = defineEmits(["onShare", "onComment", "onLike", "onReaction"]);

const showReactions = ref(false);
let hideTimeout: NodeJS.Timeout | null = null;

const reactions = [
  {
    type: "LIKE",
    image:
      "https://s3.cloudfly.vn/shoperis/2024/12/61cd374ade627f125b88073c04c2b5e5.avif",
  },
  {
    type: "LOVE",
    image:
      "https://s3.cloudfly.vn/shoperis/2024/12/c9ddf4feaef1236318ecec9351818e96.avif",
  },
  {
    type: "HAHA",
    image:
      "https://s3.cloudfly.vn/shoperis/2024/12/10676dfd6334ab2f6d2355166e6ae31b.avif",
  },
  {
    type: "WOW",
    image:
      "https://s3.cloudfly.vn/shoperis/2024/12/0038ee1bb2a9e1cad5462d191cc1f865.avif",
  },
  {
    type: "SAD",
    image:
      "https://s3.cloudfly.vn/shoperis/2024/12/9b67e1f2fb1ec9ea0cbaa48939ba7f58.avif",
  },
  {
    type: "ANGRY",
    image:
      "https://s3.cloudfly.vn/shoperis/2024/12/7419aeeccc4b58b97feb1af50a0f2425.avif",
  },
];

const longPressTimeout = ref<NodeJS.Timeout | null>(null);
const longPressDuration = 500; // 500ms for long press
const isMoved = ref(false);

function hideReactions() {
  hideTimeout = setTimeout(() => {
    showReactions.value = false;
  }, 300);
}

function cancelHideReactions() {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
}

function selectReaction(type: string) {
  emit("onReaction", type);
  showReactions.value = false;
}

function getReactionClass(type: string | null) {
  switch (type) {
    case "LIKE":
      return "text-blue-500";
    case "LOVE":
      return "text-red-500";
    case "HAHA":
    case "WOW":
    case "SAD":
    case "ANGRY":
      return "text-yellow-500";
    default:
      return "text-zinc-800";
  }
}

function getReactionImage(type: string | null) {
  switch (type) {
    case "LIKE":
      return "https://s3.cloudfly.vn/shoperis/2024/12/61cd374ade627f125b88073c04c2b5e5.avif";
    case "LOVE":
      return "https://s3.cloudfly.vn/shoperis/2024/12/c9ddf4feaef1236318ecec9351818e96.avif";
    case "HAHA":
      return "https://s3.cloudfly.vn/shoperis/2024/12/10676dfd6334ab2f6d2355166e6ae31b.avif";
    case "SAD":
      return "https://s3.cloudfly.vn/shoperis/2024/12/9b67e1f2fb1ec9ea0cbaa48939ba7f58.avif";
    case "WOW":
      return "https://s3.cloudfly.vn/shoperis/2024/12/0038ee1bb2a9e1cad5462d191cc1f865.avif";
    case "ANGRY":
      return "https://s3.cloudfly.vn/shoperis/2024/12/7419aeeccc4b58b97feb1af50a0f2425.avif";
    default:
      return "https://s3.cloudfly.vn/shoperis/2024/12/8b76a2a1425f6e10ed7dd20f0402b052.avif";
  }
}

function getReactionText(type: string | null) {
  switch (type) {
    case "LIKE":
      return "Thích";
    case "LOVE":
      return "Yêu thích";
    case "HAHA":
      return "Haha";
    case "WOW":
      return "Wow";
    case "SAD":
      return "Buồn";
    case "ANGRY":
      return "Phẫn nộ";
    default:
      return "Thích";
  }
}

function handleTouchStart(event: TouchEvent) {
  isMoved.value = false;
  longPressTimeout.value = setTimeout(() => {
    if (!isMoved.value) {
      showReactions.value = true;
    }
  }, longPressDuration);
}

function handleTouchEnd() {
  if (longPressTimeout.value) {
    clearTimeout(longPressTimeout.value);
  }
  // Only hide reactions after a delay to allow for interaction
  setTimeout(() => {
    if (!showReactions.value) return;
    hideReactions();
  }, 100);
}

function handleTouchMove() {
  isMoved.value = true;
  if (longPressTimeout.value) {
    clearTimeout(longPressTimeout.value);
  }
}

onBeforeUnmount(() => {
  if (longPressTimeout.value) {
    clearTimeout(longPressTimeout.value);
  }
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
});
</script>

<style scoped></style>
