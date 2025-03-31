<template>
  <div>
    <div class="mx-auto w-full">
      <div class="bg-white rounded-md shadow-sm p-5">
        <div class="font-semibold text-2xl mb-1">Trang cá nhân</div>
        <hr />
        <div class="w-full mt-4">
          <div class="flex flex-col gap-3 w-full">
            <div
              class="flex justify-between group hover:cursor-pointer"
              @click="showNameDialog = true"
            >
              <span>Tên hiển thị</span>
              <div class="flex gap-1">
                <div>{{ auth.user.profile.name }}</div>
                <span
                  class="group-hover:bg-gray-200 size-6 rounded-full inline-flex items-center justify-center"
                >
                  <Icon name="tabler:edit" />
                </span>
              </div>
            </div>
            <div
              class="flex justify-between group hover:cursor-pointer"
              @click="showBioDialog = true"
            >
              <span>Giới thiệu</span>
              <div class="flex gap-1 items-center">
                <span
                  class="group-hover:bg-gray-200 size-6 rounded-full inline-flex items-center justify-center"
                >
                  <Icon name="tabler:edit" />
                </span>
              </div>
            </div>
            <div
              class="flex justify-between group hover:cursor-pointer"
              @click="showAvatarDialog = true"
            >
              <span>Ảnh đại diện</span>
              <div class="flex gap-1 items-center">
                <span
                  class="group-hover:bg-gray-200 size-6 rounded-full inline-flex items-center justify-center"
                >
                  <Icon name="tabler:edit" />
                </span>
              </div>
            </div>
            <div class="flex justify-between group hover:cursor-pointer">
              <span>Ảnh bìa</span>
              <div class="flex gap-1 items-center">
                <span
                  class="group-hover:bg-gray-200 size-6 rounded-full inline-flex items-center justify-center"
                  @click="showBannerDialog = true"
                >
                  <Icon name="tabler:edit" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ChangeName
      v-model="showNameDialog"
      :current-name="auth.user.profile.name"
    />
    <ChangeBio v-model="showBioDialog" :current-bio="auth.user.profile.bio" />
    <ChangeAvatar v-model="showAvatarDialog" />
    <ChangeBanner v-model="showBannerDialog" />
  </div>
</template>

<script lang="ts" setup>
import ChangeName from "~/components/Dialog/ChangeName.vue";
import ChangeBio from "~/components/Dialog/ChangeBio.vue";
import ChangeAvatar from "~/components/Dialog/ChangeAvatar.vue";
import ChangeBanner from "~/components/Dialog/ChangeBanner.vue";
const auth = useAuth();

const showNameDialog = ref(false);
const showBioDialog = ref(false);
const showAvatarDialog = ref(false);
const showBannerDialog = ref(false);

// Thêm xử lý query parameter
const route = useRoute();
watchEffect(() => {
  if (route.query.action === "bio") {
    showBioDialog.value = true;
  } else if (route.query.action === "name") {
    showNameDialog.value = true;
  } else if (route.query.action === "banner") {
    showBannerDialog.value = true;
  }
});
</script>

<style>
/* Add any custom styles here */
</style>
