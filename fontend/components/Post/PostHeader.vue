<template>
  <div class="flex justify-between items-start bg-white">
    <div
      class="flex gap-3"
      @mouseover="showPopup"
      @mouseleave="startHidePopupTimer"
    >
      <img
        class="h-11 w-11 object-cover rounded-full border cursor-pointer"
        :src="
          post.user.profile.avatarUrl ??
          `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
        "
        alt=""
      />
      <div class="flex-1">
        <div class="flex gap-[2px] items-center flex-wrap">
          <div
            class="font-bold cursor-pointer line-clamp-2"
            :title="post.user.profile.name"
          >
            {{ post.user.profile.name }}
          </div>
          <Icon name="mdi:dot" v-if="post.group"></Icon>
          <NuxtLink
            v-if="post.group"
            :to="`/groups/${post.group.id}`"
            class="cursor-pointer hover:underline line-clamp-2"
            :title="post.group.name"
          >
            {{ post.group.name }}
          </NuxtLink>
        </div>
        <div class="flex items-center">
          <NuxtLink
            :to="`/post/${post.id}`"
            class="text-sm cursor-pointer hover:underline"
          >
            <FromNow :datetime="post.createdAt"></FromNow>
          </NuxtLink>
          <Icon name="mdi:dot" v-if="post.visibility"></Icon>

          <div v-if="post.group?.privacy">
            <Icon
              name="tabler:lock"
              v-if="post.group?.privacy == Visibility.PRIVATE"
              class="text-xs text-gray-700"
            ></Icon>
            <Icon
              name="tabler:world"
              v-else-if="post.group?.privacy == Visibility.PUBLIC"
              class="text-xs text-gray-700"
            ></Icon>
          </div>

          <div v-else-if="post.visibility">
            <Icon
              name="tabler:world"
              v-if="post.visibility == Visibility.PUBLIC"
              class="text-xs text-gray-700"
            ></Icon>
            <Icon
              name="tabler:lock"
              v-else-if="post.visibility == Visibility.PRIVATE"
              class="text-xs text-gray-700"
            >
            </Icon>
            <Icon
              name="tabler:user"
              v-else-if="post.visibility == Visibility.FRIENDS"
              class="text-xs text-gray-700"
            >
            </Icon>
          </div>
        </div>
      </div>
    </div>

    <PostUserProfile
      ref="showPopupProfile"
      :user="post.user"
      @hide-popup="startHidePopupTimer"
      @cancel-hide-popup="cancelHidePopupTimer"
    />
    <div class="flex items-center gap-4">
      <HeadlessPopover class="relative" v-if="auth.user">
        <HeadlessPopoverButton
          v-if="showActionMenu"
          class="hover:bg-gray-100 rounded-full transition duration-150 ease-in-out cursor-pointer h-8 w-8 flex justify-center items-center"
        >
          <Icon
            name="entypo:dots-three-horizontal"
            class="text-2xl text-gray-700"
          />
        </HeadlessPopoverButton>

        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <HeadlessPopoverPanel
            class="absolute right-0 mt-2 w-[15rem] bg-white border border-gray-200 rounded-lg shadow-md p-2 z-40"
          >
            <div class="flex flex-col gap-1">
              <div
                class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                @click="savePost"
              >
                <Icon name="stash:save-ribbon" class="text-2xl text-zinc-600" />
                {{ isSaved ? "Bỏ lưu bài viết" : "Lưu bài viết" }}
              </div>

              <div
                v-if="auth.user && post.user.id != auth.user.id"
                class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                @click="hidePost"
              >
                <Icon name="tabler:eye-off" class="text-2xl text-zinc-600" />
                Ẩn bài viết
              </div>

              <div
                v-if="post.user.id != auth.user.id"
                class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                @click="emit('onReport')"
              >
                <Icon
                  name="tabler:alert-circle"
                  class="text-2xl text-zinc-600"
                />
                Báo cáo
              </div>

              <div
                v-if="auth.user && post.user.id == auth.user.id"
                class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                @click="visibleEditPost = true"
              >
                <Icon name="tabler:edit" class="text-2xl text-gray-600" />
                Chỉnh sửa
              </div>

              <hr
                v-if="auth.user && post.user.profile.id == auth.user.profile.id"
              />

              <div
                v-if="auth.user && post.user.id == auth.user.id"
                class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                @click="visibleConfirmDelete = true"
              >
                <Icon name="tabler:trash" class="text-2xl text-gray-600" />
                Gỡ bài viết
              </div>
            </div>
          </HeadlessPopoverPanel>
        </transition>
      </HeadlessPopover>
      <div
        v-if="showClose"
        class="hover:bg-gray-100 rounded-full transition duration-150 ease-in-out cursor-pointer h-8 w-8 flex justify-center items-center"
        @click="onClose()"
      >
        <Icon name="tabler:x" class="text-2xl text-gray-700"></Icon>
      </div>
    </div>

    <Dialog
      v-model:visible="visibleConfirmDelete"
      modal
      :showHeader="false"
      :style="{ width: '25rem' }"
    >
      <div class="flex flex-col items-center w-full gap-4 my-5">
        <Icon
          name="fluent:info-32-regular"
          class="!text-6xl text-primary-500"
        ></Icon>
        <p>Bạn có chắc muốn xoá bài viết này.</p>
      </div>
      <div class="flex justify-center gap-2">
        <Button
          type="button"
          label="Thôi"
          severity="secondary"
          :outlined="true"
          @click="visibleConfirmDelete = false"
        ></Button>
        <Button
          type="button"
          severity="danger"
          label="Xoá"
          @click="deletePost()"
        ></Button>
      </div>
    </Dialog>

    <EditPost
      v-model="visibleEditPost"
      :post="post"
      @close="visibleEditPost = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import FromNow from "../FromNow.vue";
import type { Post } from "~/types/model";
import EditPost from "./Dialog/EditPost.vue";
import { Visibility } from "~/types/model";
import PostUserProfile from "./PostUserProfile.vue";

const props = defineProps({
  post: { type: Object as PropType<Post>, required: true },
  showClose: { type: Boolean, default: true },
  showActionMenu: { type: Boolean, default: true },
  isSaved: { type: Boolean, default: false },
});
const emit = defineEmits(["close", "onReport", "onSave", "edit"]);

const auth = useAuth();

const onClose = () => {
  emit("close");
};

const showPopupProfile = ref();
let hidePopupTimer: NodeJS.Timeout | null = null;

const showPopup = (event: any) => {
  showPopupProfile.value?.show(event);
};

const startHidePopupTimer = () => {
  hidePopupTimer = setTimeout(() => {
    showPopupProfile.value?.hide();
  }, 300);
};

const cancelHidePopupTimer = () => {
  if (hidePopupTimer) {
    clearTimeout(hidePopupTimer);
    hidePopupTimer = null;
  }
};

const visibleConfirmDelete = ref(false);
const toast = useToast();

const visibleEditPost = ref(false);

// Gỡ bài viết
async function deletePost() {
  const { data: response } = await useAPI<ApiResponse>(
    `/api/post/${props.post.id}`,
    {
      method: "DELETE",
      watch: false,
    }
  );

  if (response.value?.code == 200) {
    toast.success(response.value.message);
    visibleConfirmDelete.value = false;
    useEvent("user:delete-post", props.post.id);
  } else {
    toast.error(response.value?.message ?? "Lấy dữ liệu thất bại");
  }
}

// Ẩn bài viết
async function hidePost() {
  const { data: response } = await useAPI<ApiResponse>(
    `/api/post/${props.post.id}/hide`,
    {
      method: "GET",
      watch: false,
    }
  );

  if (response.value?.code == 200) {
    toast.success(response.value.message);
    useEvent("user:delete-post", props.post.id);
  } else {
    toast.error(response.value?.message ?? "Ẩn bài viết thất bại");
  }
}

// Lưu bài viết
async function savePost() {
  const { data: response } = await useAPI<ApiResponse>(
    `/api/post/${props.post.id}/save`,
    {
      method: props.isSaved ? "DELETE" : "GET",
      watch: false,
    }
  );

  if (response.value?.code == 200) {
    toast.success(response.value.message);
    emit("onSave", !props.isSaved);
  } else {
    toast.error(response.value?.message ?? "Lưu bài viết thất bại");
  }
}
</script>

<style scoped></style>
