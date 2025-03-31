<template>
  <div>
    <Dialog
      v-model:visible="store.isActive"
      modal
      :show-header="false"
      :pt="{
        root: 'pt-4',
        content: 'pb-4',
      }"
      :style="{ width: '46rem' }"
      dismissableMask
    >
      <div class="flex justify-between items-center sticky top-0 bg-white pb-3">
        <div class="text-xl text-gray-800">Tạo bài viết</div>
        <div class="flex items-center gap-4">
          <div
            class="hover:bg-gray-100 rounded-full transition duration-150 ease-in-out cursor-pointer w-7 h-7 flex items-center justify-center"
            @click="store.isActive = false"
          >
            <Icon name="tabler:x" class="text-2xl"></Icon>
          </div>
        </div>
      </div>
      <hr />

      <div class="flex flex-col gap-5" v-if="auth.user">
        <div
          class="flex justify-between items-center sticky top-0 bg-white mt-4"
        >
          <div class="flex items-center gap-3">
            <img
              class="h-12 w-12 object-cover rounded-full border"
              :src="
                auth.user.profile.avatarUrl ??
                'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
              "
              alt=""
            />
            <div>
              <div class="font-bold">{{ auth.user.profile.name }}</div>
              <Select
                v-model="store.privacy"
                :disabled="store.groupId != null"
                :options="[
                  {
                    name: 'Công khai',
                    icon: 'tabler:user-group',
                    code: 'PUBLIC',
                  },
                  {
                    name: 'Bạn bè',
                    icon: 'tabler:user-group',
                    code: 'FRIENDS',
                  },
                  {
                    name: 'Riêng tư',
                    icon: 'tabler:lock',
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
        </div>

        <input
          name="title"
          v-model="title"
          placeholder="Tựa đề"
          class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-gray-500 transition duration-300 ease-in-out"
        />

        <Editor
          editorStyle="height: 150px"
          v-model="content"
          placeholder="Nhập nội dung bài viết"
        />

        <Tagify v-model="store.hashtag" placeholder="Nhập hashtag"></Tagify>

        <div v-if="imagePreviews.length" class="grid grid-cols-12 gap-3">
          <div
            v-for="(image, index) in imagePreviews"
            :key="index"
            class="col-span-3 relative border rounded-md p-1"
          >
            <img
              :src="image.preview"
              alt="Image Preview"
              width="100%"
              class="aspect-video object-cover"
            />

            <!-- Nút xoá ảnh -->
            <div
              class="absolute top-2 right-2 bg-blue-500 text-white w-5 h-5 flex items-center justify-center rounded-md cursor-pointer"
              @click="removeImage(index)"
            >
              <Icon name="tabler:x" class="text-md"></Icon>
            </div>
          </div>
        </div>

        <div class="flex justify-between">
          <div
            class="border p-1 rounded-md h-fit cursor-pointer flex"
            @click="fileInput.click()"
          >
            <Icon name="tabler:photo" class="text-xl"></Icon>
          </div>
          <input
            type="file"
            ref="fileInput"
            accept="image/*"
            class="hidden"
            multiple
            @change="onFileChange"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <Button
          type="button"
          label="Thôi"
          severity="secondary"
          outlined
          @click="store.isActive = false"
        ></Button>
        <Button type="button" label="Đăng bài" @click="create"></Button>
      </div>
    </Dialog>

    <Loading v-model="isLoading" />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import Tagify from "./Tagify.vue";
import Loading from "./Dialog/Loading.vue";

const store = useCreatePost();
const auth = useAuth();
const toast = useToast();

interface ImagePreview {
  preview: string;
  type: string;
}

const isLoading = ref(false);
const imagePreviews: Ref<ImagePreview[]> = ref([]);
const selectedFiles: Ref<File[]> = ref([]);
const fileInput = ref();

const onFileChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (files && files.length) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileUrl = URL.createObjectURL(file);
      const fileType = file.type;

      if (!selectedFiles.value.some((f) => f.name === file.name)) {
        imagePreviews.value.push({
          preview: fileUrl,
          type: fileType,
        });
        selectedFiles.value.push(file);
      }
    }
  }
};

const removeImage = (index: number): void => {
  imagePreviews.value.splice(index, 1);
  selectedFiles.value.splice(index, 1);
};

const title = ref("");
const content = ref("");

async function create() {
  isLoading.value = true;
  const formData = new FormData();
  formData.append("title", title.value);
  formData.append("content", content.value);
  formData.append("visibility", store.privacy);
  formData.append(
    "hashtag",
    store.hashtag && store.hashtag != "" ? store.hashtag : "[]"
  );
  if (store.groupId) {
    formData.append("groupId", store.groupId);
  }

  selectedFiles.value.forEach((file) => {
    formData.append("images[]", file);
  });

  const { data: response } = await useAPI<ApiResponse>("/api/post", {
    method: "POST",
    body: formData,
  });

  if (response.value?.code == 200) {
    toast.success(response.value.message);
    store.isActive = false;
    onClear();
    useEvent("user:update-post-list");
    useEvent("new-post", response.value.data);
  } else {
    toast.error(response.value?.message ?? "Lấy dữ liệu thất bại");
  }
  isLoading.value = false;
}

function onClear() {
  title.value = "";
  content.value = "";
  store.privacy = "PUBLIC";
  imagePreviews.value = [];
  selectedFiles.value = [];
  store.hashtag = [];
}
</script>

<style lang="scss">
.create-post {
  .p-select-label {
    padding: 1px 10px;
    padding-right: 0px;
  }
}
</style>
