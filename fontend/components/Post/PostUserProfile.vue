<template>
  <Popover ref="showPopupProfile">
    <div
      class="flex flex-col gap-3"
      @mouseover="cancelHidePopupTimer"
      @mouseleave="startHidePopupTimer"
    >
      <NuxtLink
        :to="`/user/${user.id}`"
        class="grid grid-cols-10 gap-3 items-center rounded-md cursor-pointer max-w-72"
      >
        <div class="col-span-2">
          <img
            class="w-full rounded-full aspect-square"
            :src="
              user.profile.avatarUrl ??
              `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
            "
            alt="Avatar"
          />
        </div>
        <div class="col-span-8">
          <div class="text-gray-800 truncate">
            {{ user.profile.name }}
          </div>
          <div class="text-sm truncate">
            {{
              user.profile.user
                ? `@${user.profile.user}`
                : `@${user.profile.id}`
            }}
          </div>
        </div>
      </NuxtLink>

      <hr />

      <div>
        {{ user.profile.bio ?? "Không có mô tả" }}
      </div>
    </div>
  </Popover>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { User } from "~/types/model";

const props = defineProps({
  user: { type: Object as PropType<User>, required: true },
});

const emit = defineEmits(["addFriend", "hidePopup", "cancelHidePopup"]);
const auth = useAuth();
const toast = useToast();

const showPopupProfile = ref();

function startHidePopupTimer() {
  emit("hidePopup");
}

function cancelHidePopupTimer() {
  emit("cancelHidePopup");
}

defineExpose({
  show: (event: any) => showPopupProfile.value?.show(event),
  hide: () => showPopupProfile.value?.hide(),
});

// Thêm bạn bè
async function addFriend(userId: string) {
  const { data } = await useAPI<ApiResponse<{}>>(`/api/friend/add/${userId}`, {
    method: "POST",
  });

  if (data.value?.code == 200) {
    toast.success(data.value.message);
  } else {
    toast.error(data.value?.message ?? "Thêm bạn bè thất bại");
  }
}
</script>
