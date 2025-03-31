<template>
  <div class="relative">
    <div
      v-if="images.length > 1"
      class="flex items-center justify-center w-7 h-7 bg-black/70 text-white rounded-full absolute z-10 cursor-pointer left-3"
      style="top: 50%; transform: translateY(-50%)"
      @click="goPrev"
    >
      <Icon name="tabler:chevron-left"></Icon>
    </div>
    <Swiper
      :slides-per-view="1"
      :modules="[SwiperNavigation]"
      :autoHeight="true"
      @swiper="onSwiperInit"
      @slideChange="onSlideChange"
    >
      <SwiperSlide v-for="image in images">
        <Image
          class="w-full max-h-600px object-contain rounded-sm"
          alt="Thumbs"
          format="avif"
          quality="80"
          preview
        >
          <template #image>
            <img
              :src="image.url"
              alt="image"
              class="w-full max-h-600px object-contain rounded-sm"
            />
          </template>
          <template #original="slotProps">
            <img
              class="container w-full rounded-sm"
              :src="image.url"
              alt="preview"
              :style="slotProps.style"
            />
          </template>
        </Image>
      </SwiperSlide>
    </Swiper>
    <div
      v-if="images.length > 1"
      class="flex items-center justify-center w-7 h-7 bg-black/70 text-white rounded-full absolute z-10 cursor-pointer right-3"
      style="top: 50%; transform: translateY(-50%)"
      @click="goNext"
    >
      <Icon name="tabler:chevron-right"></Icon>
    </div>

    <div
      class="custom-pagination flex justify-center mt-2 mb-1 absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 bg-black/70 p-1 rounded-md"
      v-if="images.length > 1"
    >
      <span
        v-for="(image, index) in images"
        :key="index"
        @click="goToSlide(parseInt(index))"
        :class="{ active: activeIndex === parseInt(index) }"
        class="w-2 h-2 rounded-full bg-zinc-600 cursor-pointer mx-1"
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  images: { type: Object, default: [] },
});

const mySwiper = ref();
const activeIndex = ref<number>(0);

const onSwiperInit = (swiperInstance: any) => {
  mySwiper.value = swiperInstance;

  swiperInstance.on("slideChange", () => {
    activeIndex.value = swiperInstance.realIndex;
  });
};

const onSlideChange = (swiperInstance: any) => {
  activeIndex.value = swiperInstance.realIndex;
};

const goPrev = () => {
  if (mySwiper.value) {
    mySwiper.value.slidePrev();
  }
};

const goNext = () => {
  if (mySwiper.value) {
    mySwiper.value.slideNext();
  }
};

const goToSlide = (index: number) => {
  if (mySwiper.value) {
    mySwiper.value.slideToLoop(index);
  }
};
</script>

<style scoped>
.custom-pagination span.active {
  background-color: white;
}
</style>
