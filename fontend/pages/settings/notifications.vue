<template>
  <div class="mx-auto w-full">
    <div class="bg-white rounded-md shadow-sm p-5">
      <div class="font-semibold text-2xl mb-1">Thông báo</div>
      <hr />
      <div class="w-full mt-4">
        <div class="flex flex-col gap-3 w-full">
          <div class="flex justify-between group hover:cursor-pointer">
            <span>Bình luận bài viết</span>
            <div class="flex gap-1">
              <ToggleSwitch
                v-model="settings.postComments"
                @update:model-value="updateSettings"
              />
            </div>
          </div>
          <div class="flex justify-between group hover:cursor-pointer">
            <span>Like bình luận</span>
            <div class="flex gap-1">
              <ToggleSwitch
                v-model="settings.commentLikes"
                @update:model-value="updateSettings"
              />
            </div>
          </div>
          <div class="flex justify-between group hover:cursor-pointer">
            <span>Like bài viết</span>
            <div class="flex gap-1">
              <ToggleSwitch
                v-model="settings.postLikes"
                @update:model-value="updateSettings"
              />
            </div>
          </div>
          <div class="flex justify-between group hover:cursor-pointer">
            <span>Theo dõi trang cá nhân</span>
            <div class="flex gap-1">
              <ToggleSwitch
                v-model="settings.newFollower"
                @update:model-value="updateSettings"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";

const auth = useAuth();
const settings = ref({
  postComments: false,
  postLikes: false,
  commentLikes: false,
  newFollower: false,
  friendRequests: false,
  groupInvites: false,
  directMessages: false,
  emailNotifications: false,
});

// Fetch initial settings
const fetchSettings = async () => {
  const { data: response } = await useAPI<ApiResponse<any>>(
    "/api/settings/notifications",
    {
      method: "GET",
    }
  );

  if (response.value?.code === 200) {
    settings.value = response.value.data;
  }
};

// Update settings when toggles change
const updateSettings = async () => {
  const { data: response } = await useAPI<ApiResponse<any>>(
    "/api/settings/notifications",
    {
      method: "PUT",
      body: settings.value,
    }
  );
};

// Fetch settings on component mount
await fetchSettings();
</script>

<style scoped></style>
