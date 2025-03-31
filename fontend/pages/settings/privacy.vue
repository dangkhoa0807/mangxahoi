<template>
  <div class="mx-auto w-full">
    <div class="bg-white rounded-md shadow-sm p-5">
      <div class="font-semibold text-2xl mb-1">Quyền riêng tư</div>
      <hr />
      <div class="w-full mt-4">
        <div class="flex flex-col gap-3 w-full">
          <!-- Allow Follow Toggle -->
          <div class="flex justify-between group hover:cursor-pointer">
            <span>Cho phép người khác theo dõi</span>
            <div class="flex gap-1">
              <ToggleSwitch
                v-model="settings.allowFollow"
                @update:model-value="updateSettings"
              />
            </div>
          </div>

          <!-- Message Privacy -->
          <div
            class="flex justify-between group hover:cursor-pointer"
            @click="showMessageDialog = true"
          >
            <span>Ai có thể nhắn tin với bạn</span>
            <div class="flex items-center gap-2">
              <span class="text-gray-600">{{
                messageOptions[settings.allowMessage]
              }}</span>
              <Icon name="tabler:edit" />
            </div>
          </div>

          <!-- Online Status -->
          <!-- <div class="flex justify-between group hover:cursor-pointer">
            <span>Hiển thị trạng thái trực tuyến</span>
            <div class="flex gap-1">
              <ToggleSwitch
                v-model="settings.showOnlineStatus"
                @update:model-value="updateSettings"
              />
            </div>
          </div> -->

          <!-- Last Seen -->
          <!-- <div class="flex justify-between group hover:cursor-pointer">
            <span>Hiển thị lần cuối truy cập</span>
            <div class="flex gap-1">
              <ToggleSwitch
                v-model="settings.showLastSeen"
                @update:model-value="updateSettings"
              />
            </div>
          </div> -->

          <!-- Profile Visibility -->
          <div
            class="flex justify-between group hover:cursor-pointer"
            @click="
              profileDialogMode = 'profile';
              showProfileDialog = true;
            "
          >
            <span>Ai có thể xem trang cá nhân</span>
            <div class="flex items-center gap-2">
              <span class="text-gray-600">{{
                profileOptions[settings.showProfileTo]
              }}</span>
              <Icon name="tabler:edit" />
            </div>
          </div>

          <!-- Show Following -->
          <div class="flex justify-between group hover:cursor-pointer">
            <span>Hiển thị danh sách theo dõi</span>
            <div class="flex gap-1">
              <ToggleSwitch
                v-model="settings.showFollowing"
                @update:model-value="updateSettings"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Message Privacy Dialog -->
    <Dialog
      v-model:visible="showMessageDialog"
      modal
      header="Ai có thể nhắn tin với bạn"
      class="w-full max-w-lg"
    >
      <div class="flex flex-col gap-3">
        <div
          v-for="(label, value) in messageOptions"
          :key="value"
          @click="selectMessageOption(value)"
          :class="[
            'flex items-center justify-between p-3 cursor-pointer rounded',
            settings.allowMessage === value
              ? 'bg-blue-400/20 text-blue-600'
              : 'hover:bg-gray-100',
          ]"
        >
          <span>{{ label }}</span>
          <i
            v-if="settings.allowMessage === value"
            class="pi pi-check text-blue-500"
          ></i>
        </div>
      </div>
    </Dialog>

    <!-- Profile Visibility Dialog -->
    <Dialog
      v-model:visible="showProfileDialog"
      modal
      :header="
        profileDialogMode === 'profile'
          ? 'Ai có thể xem trang cá nhân'
          : 'Ai có thể xem danh sách đang theo dõi'
      "
      class="w-full max-w-lg"
    >
      <div class="flex flex-col gap-3">
        <div
          v-for="(label, value) in profileOptions"
          :key="value"
          @click="selectProfileOption(value, profileDialogMode)"
          :class="[
            'flex items-center justify-between p-3 cursor-pointer rounded',
            (profileDialogMode === 'profile'
              ? settings.showProfileTo
              : settings.showFollowing) === value
              ? 'bg-blue-400/20 text-blue-600'
              : 'hover:bg-gray-100',
          ]"
        >
          <span>{{ label }}</span>
          <i
            v-if="
              (profileDialogMode === 'profile'
                ? settings.showProfileTo
                : settings.showFollowing) === value
            "
            class="pi pi-check text-blue-500"
          ></i>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";

type MessageOptionKey = keyof typeof messageOptions;

const settings = ref<{
  allowFollow: boolean;
  allowMessage: MessageOptionKey;
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showProfileTo: keyof typeof profileOptions;
  showFollowing: boolean;
}>({
  allowFollow: true,
  allowMessage: "EVERYONE",
  showOnlineStatus: true,
  showLastSeen: true,
  showProfileTo: "EVERYONE",
  showFollowing: true,
});

const showMessageDialog = ref(false);
const showProfileDialog = ref(false);

const messageOptions = {
  EVERYONE: "Mọi người",
  FRIENDS: "Bạn bè",
  NOBODY: "Không ai",
};

const profileOptions = {
  EVERYONE: "Mọi người",
  FRIENDS: "Bạn bè",
  PRIVATE: "Chỉ mình tôi",
};

const profileDialogMode = ref<"profile" | "following">("profile");

const selectMessageOption = (value: MessageOptionKey) => {
  settings.value.allowMessage = value;
  showMessageDialog.value = false;
  updateSettings();
};

const selectProfileOption = (
  value: keyof typeof profileOptions,
  mode: "profile" | "following"
) => {
  if (mode === "profile") {
    settings.value.showProfileTo = value;
  }
  showProfileDialog.value = false;
  updateSettings();
};

// Fetch initial settings
const fetchSettings = async () => {
  const { data: response } = await useAPI<ApiResponse<any>>(
    "/api/settings/privacy",
    {
      method: "GET",
    }
  );

  if (response.value?.code === 200) {
    settings.value = response.value.data;
  }
};

// Update settings when values change
const updateSettings = async () => {
  const { data: response } = await useAPI<ApiResponse<any>>(
    "/api/settings/privacy",
    {
      method: "PUT",
      body: settings.value,
    }
  );
};

await fetchSettings();
</script>

<style scoped></style>
