<template>
  <div v-if="groupStore.currentGroup">
    <div class="mx-auto w-full">
      <div class="bg-white rounded-md shadow-sm p-5">
        <div class="font-semibold text-2xl mb-1">Thông tin nhóm</div>
        <hr />
        <div class="w-full mt-4">
          <div class="flex flex-col gap-3 w-full">
            <!-- Group Name -->
            <div
              class="flex justify-between group hover:cursor-pointer"
              @click="showNameDialog = true"
            >
              <span>Tên nhóm</span>
              <div class="flex gap-1">
                <div>{{ groupStore.currentGroup.name }}</div>
                <span
                  class="group-hover:bg-gray-200 size-6 rounded-full inline-flex items-center justify-center"
                >
                  <Icon name="tabler:edit" />
                </span>
              </div>
            </div>

            <!-- Group Description -->
            <div
              class="flex justify-between group hover:cursor-pointer"
              @click="showDescriptionDialog = true"
            >
              <span>Mô tả</span>
              <div class="flex gap-1 items-center">
                <span
                  class="group-hover:bg-gray-200 size-6 rounded-full inline-flex items-center justify-center"
                >
                  <Icon name="tabler:edit" />
                </span>
              </div>
            </div>

            <!-- Group Icon -->
            <div
              class="flex justify-between group hover:cursor-pointer"
              @click="showIconDialog = true"
            >
              <span>Ảnh nhóm</span>
              <div class="flex gap-1 items-center">
                <span
                  class="group-hover:bg-gray-200 size-6 rounded-full inline-flex items-center justify-center"
                >
                  <Icon name="tabler:edit" />
                </span>
              </div>
            </div>

            <!-- Group Banner -->
            <div
              class="flex justify-between group hover:cursor-pointer"
              @click="showBannerDialog = true"
            >
              <span>Ảnh bìa</span>
              <div class="flex gap-1 items-center">
                <span
                  class="group-hover:bg-gray-200 size-6 rounded-full inline-flex items-center justify-center"
                >
                  <Icon name="tabler:edit" />
                </span>
              </div>
            </div>

            <!-- Group Privacy -->
            <div
              class="flex justify-between group hover:cursor-pointer"
              @click="showPrivacyDialog = true"
            >
              <span>Quyền riêng tư</span>
              <div class="flex gap-1 items-center">
                <div>
                  {{
                    privacyOptions[
                      groupStore.currentGroup
                        .privacy as keyof typeof privacyOptions
                    ]
                  }}
                </div>
                <span
                  class="group-hover:bg-gray-200 size-6 rounded-full inline-flex items-center justify-center"
                >
                  <Icon name="tabler:edit" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <ChangeName
      v-model="showNameDialog"
      :group-id="groupStore.currentGroup.id"
      :current-name="groupStore.currentGroup.name"
      @updated="groupStore.fetchGroup(route.params.slug as string)"
    />

    <ChangeDescription
      v-model="showDescriptionDialog"
      :group-id="groupStore.currentGroup.id"
      :current-description="groupStore.currentGroup.description || ''"
      @updated="groupStore.fetchGroup(route.params.slug as string)"
    />

    <ChangePrivacy
      v-model="showPrivacyDialog"
      :group-id="groupStore.currentGroup.id"
      :current-privacy="groupStore.currentGroup.privacy"
      @updated="groupStore.fetchGroup(route.params.slug as string)"
    />

    <ChangeIcon
      v-model="showIconDialog"
      :group-id="groupStore.currentGroup.id"
      @updated="groupStore.fetchGroup(route.params.slug as string)"
    />
    <ChangeBanner
      v-model="showBannerDialog"
      :group-id="groupStore.currentGroup.id"
      @updated="groupStore.fetchGroup(route.params.slug as string)"
    />
  </div>
  <div v-else>Loading...</div>
</template>

<script setup lang="ts">
import ChangeName from "~/components/Dialog/Group/ChangeName.vue";
import ChangeDescription from "~/components/Dialog/Group/ChangeDescription.vue";
import ChangePrivacy from "~/components/Dialog/Group/ChangePrivacy.vue";
import ChangeIcon from "~/components/Dialog/Group/ChangeIcon.vue";
import ChangeBanner from "~/components/Dialog/Group/ChangeBanner.vue";

const route = useRoute();
const groupStore = useGroupStore();

const showNameDialog = ref(false);
const showDescriptionDialog = ref(false);
const showIconDialog = ref(false);
const showBannerDialog = ref(false);
const showPrivacyDialog = ref(false);

const privacyOptions = {
  PUBLIC: "Công khai",
  PRIVATE: "Riêng tư",
} as const;

definePageMeta({
  layout: "group-admin",
});
</script>
