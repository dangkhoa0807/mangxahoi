<template>
  <Dialog
    v-model:visible="model"
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
      <div class="text-xl text-gray-800">Chỉnh sửa bài viết</div>
      <div class="flex items-center gap-4">
        <div
          class="hover:bg-gray-100 rounded-full transition duration-150 ease-in-out cursor-pointer w-7 h-7 flex items-center justify-center"
          @click="model = false"
        >
          <Icon name="tabler:x" class="text-2xl"></Icon>
        </div>
      </div>
    </div>
    <hr />

    <div v-if="auth.user">
      <div class="flex flex-col gap-5 mt-4">
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
                v-model="editForm.visibility"
                :disabled="editForm.groupId != null"
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
          v-model="editForm.title"
          placeholder="Tựa đề"
          class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-gray-500 transition duration-300 ease-in-out"
        />

        <Editor
          editorStyle="height: 150px"
          v-model="editForm.content"
          placeholder="Nhập nội dung bài viết"
        />

        <Tagify v-model="editForm.hashtag" placeholder="Nhập hashtag"></Tagify>

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
          label="Huỷ"
          severity="secondary"
          @click="model = false"
        ></Button>
        <Button type="button" label="Lưu thay đổi" @click="updatePost"></Button>
      </div>
    </div>

    <div v-else>
      <div>Vui lòng đăng nhập để sửa bài viết</div>
    </div>

    <Loading v-model="isLoading" />
  </Dialog>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { Post } from "~/types/model";
import Tagify from "../../Tagify.vue";
import Loading from "~/components/Dialog/Loading.vue";

const model = defineModel<boolean>({ required: true });
const props = defineProps({
  post: { type: Object as PropType<Post>, required: true },
});

const emit = defineEmits(["update:modelValue", "updated"]);
const toast = useToast();
const auth = useAuth();

interface ImagePreview {
  preview: string;
  type: string;
  id?: string;
}

const imagePreviews: Ref<ImagePreview[]> = ref([]);
const selectedFiles: Ref<File[]> = ref([]);
const deletedImageIds: Ref<string[]> = ref([]);
const fileInput = ref();
const isLoading = ref(false);

const getVisibility = () => {
  if (props.post.group) {
    return props.post.group.privacy;
  }
  return props.post.visibility || "PUBLIC";
};

const editForm = ref({
  title: props.post.title || "",
  content: props.post.content || "",
  visibility: getVisibility(),
  groupId: props.post.group?.id || null,
  hashtag: JSON.stringify(
    props.post.hashTags?.map((tag) => ({ value: tag.hashtag.name })) || []
  ),
});

// Load existing images
onMounted(() => {
  if (props.post.images) {
    imagePreviews.value = props.post.images.map((image) => ({
      preview: image.url,
      type: "image",
      id: image.id,
    }));
  }
});

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
  const removedImage = imagePreviews.value[index];

  if (removedImage.id) {
    deletedImageIds.value.push(removedImage.id);
  }
  imagePreviews.value.splice(index, 1);
  selectedFiles.value.splice(index, 1);
};

async function updatePost() {
  try {
    isLoading.value = true;
    const formData = new FormData();
    formData.append("title", editForm.value.title);
    formData.append("content", editForm.value.content);
    formData.append(
      "hashtag",
      editForm.value.hashtag.length ? editForm.value.hashtag.toString() : "[]"
    );
    formData.append("visibility", editForm.value.visibility);

    formData.append("deleted_images", JSON.stringify(deletedImageIds.value));

    selectedFiles.value.forEach((file) => {
      formData.append("images[]", file);
    });

    const { data: response } = await useAPI<ApiResponse>(
      `/api/post/${props.post.id}`,
      {
        method: "PUT",
        body: formData,
      }
    );

    if (response.value?.code === 200) {
      toast.success("Cập nhật bài viết thành công");
      useEvent("user:update-post", response.value.data);
      model.value = false;
    } else {
      toast.error(response.value?.message ?? "Cập nhật bài viết thất bại");
    }
  } catch (error) {
    toast.error("Đã xảy ra lỗi khi cập nhật bài viết");
  } finally {
    isLoading.value = false;
  }
}
</script>
