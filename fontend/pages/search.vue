<template>
  <div class="mx-auto w-full xl:w-9/12">
    <div class="grid grid-cols-12 gap-4 mb-5">
      <!-- Tabs chính -->
      <div class="col-span-12">
        <Tabs
          :value="router.currentRoute.value.path"
          class="rounded-md overflow-hidden"
        >
          <TabList class="bg-white border-b">
            <Tab :value="`/search/posts`" class="tab-item text-gray-700 p-0">
              <router-link
                v-slot="{ href, navigate }"
                :to="`/search/posts?q=${search}`"
                custom
              >
                <a
                  v-ripple
                  :href="href"
                  @click="navigate"
                  class="flex items-center gap-2 text-inherit p-4"
                  >Bài viết</a
                >
              </router-link>
            </Tab>
            <Tab :value="`/search/groups`" class="tab-item text-gray-700 p-0">
              <router-link
                v-slot="{ href, navigate }"
                :to="`/search/groups?q=${search}`"
                custom
              >
                <a
                  v-ripple
                  :href="href"
                  @click="navigate"
                  class="flex items-center gap-2 text-inherit p-4"
                  >Nhóm</a
                >
              </router-link>
            </Tab>
            <Tab :value="`/search/users`" class="tab-item text-gray-700 p-0">
              <router-link
                v-slot="{ href, navigate }"
                :to="`/search/users?q=${search}`"
                custom
              >
                <a
                  v-ripple
                  :href="href"
                  @click="navigate"
                  class="flex items-center gap-2 text-inherit p-4"
                  >Mọi người</a
                >
              </router-link>
            </Tab>
          </TabList>
        </Tabs>
      </div>
    </div>
    <div class="grid grid-cols-12 gap-4">
      <div class="text-md text-gray-700 col-span-12">
        Kết quả tìm kiếm cho "{{ search }}"
      </div>
      <NuxtPage class="col-span-12"></NuxtPage>
    </div>
  </div>
</template>

<script lang="ts" setup>
const router = useRouter();
const route = useRoute();

const search = computed(() => route.query.q);
</script>

<style scoped>
.tab-item {
  padding: 0 !important; /* Override any default padding */
}
</style>
