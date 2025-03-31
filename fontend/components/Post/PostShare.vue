<template>
  <div>
    <Dialog
      v-model:visible="visibleDialog"
      modal
      :show-header="false"
      :pt="{
        root: 'pt-4',
        content: 'h-full',
      }"
      :style="{ width: '38rem' }"
      dismissableMask
      blockScroll
    >
      <div class="flex justify-between items-center sticky top-0 bg-white pb-3">
        <div class="text-xl text-gray-800">Chia sẻ bài viết</div>
        <div class="flex items-center gap-4">
          <div
            class="hover:bg-gray-100 rounded-full transition duration-150 ease-in-out cursor-pointer w-7 h-7 flex items-center justify-center"
            @click="visibleDialog = false"
          >
            <Icon name="tabler:x" class="text-2xl"></Icon>
          </div>
        </div>
      </div>
      <hr />

      <div v-if="auth.user">
        <div class="flex gap-3 mt-4">
          <img
            class="h-14 w-14 object-cover rounded-full border"
            :src="auth.user.profile.avatarUrl ?? DEFAULT_AVATAR_URL"
            alt=""
          />
          <div>
            <div class="font-bold">{{ auth.user.profile.name }}</div>
            <Select
              v-model="visibility"
              :options="[
                {
                  name: 'Công khai',
                  code: 'PUBLIC',
                },
                {
                  name: 'Bạn bè',
                  code: 'FRIENDS',
                },
                {
                  name: 'Riêng tư',
                  code: 'PRIVATE',
                },
              ]"
              optionLabel="name"
              optionValue="code"
              placeholder="Công khai"
              class="w-full"
              :pt="{
                root: 'create-post',
              }"
            >
            </Select>
          </div>
        </div>

        <div class="flex flex-col gap-4 mt-4">
          <Editor editorStyle="height: 150px" v-model="content" />

          <div class="flex justify-end gap-2">
            <Button
              type="button"
              label="Chia sẻ ngay"
              class="w-full"
              @click="onShare"
            ></Button>
          </div>

          <hr />

          <div class="flex gap-3">
            <input
              name="email"
              placeholder="Liên kết"
              class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-gray-400 transition duration-300 ease-in-out"
              :value="postUrl"
            />
            <div
              class="bg-blue-500 text-white whitespace-nowrap flex items-center shadow-sm rounded-md px-4 cursor-pointer"
              @click="onCopy()"
            >
              Sao chép
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div class="text-center text-gray-500 mt-4">
          Vui lòng đăng nhập để chia sẻ bài viết
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import { DEFAULT_AVATAR_URL } from "~/types/model";

const visibleDialog = defineModel({
  default: true,
});
const props = defineProps({
  postId: { type: String },
});

const url = useRequestURL();
const toast = useToast();
const auth = useAuth();

const content = ref();
const visibility = ref("PUBLIC");
const postUrl = `${url.protocol}//${url.host}/post/${props.postId}`;

async function onCopy() {
  navigator.clipboard.writeText(postUrl);
  toast.success("Copy thành công");
}

async function onShare() {
  const { data } = await useAPI<ApiResponse>(
    `/api/post/${props.postId}/share`,
    {
      method: "POST",
      body: {
        content: content,
      },
    }
  );

  if (data.value?.code == 200) {
    toast.success(data.value.message);
    visibleDialog.value = false;
  } else {
    toast.error(data.value?.message ?? "Lấy dữ liệu thất bại");
  }
}
</script>

<style scoped></style>
