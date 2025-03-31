<template>
  <Dialog
    v-model:visible="model"
    modal
    header="Chỉnh sửa giới thiệu"
    :pt="{
      content: 'pb-4',
    }"
    :draggable="false"
    :style="{ width: '32rem' }"
    @hide="clear"
  >
    <Form @submit="updateBio" :validation-schema="schema">
      <div class="mb-4">
        <label for="bio">Giới thiệu</label>
        <Field
          v-model="bio"
          name="bio"
          as="textarea"
          rows="4"
          placeholder="Giới thiệu bản thân"
          class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-blue-500 transition duration-300 ease-in-out"
        />
        <ErrorMessage name="bio" class="block mt-1 text-red-500" />
      </div>

      <Button
        type="submit"
        label="Lưu thay đổi"
        class="w-full"
        :loading="isLoading"
      ></Button>
    </Form>
  </Dialog>
</template>

<script setup lang="ts">
import * as yup from "yup";
import type { ApiResponse } from "~/types/api";

const model = defineModel<boolean>({ required: true });
const props = defineProps({
  currentBio: { type: String, required: true, default: "" },
});
const emit = defineEmits(["changed"]);

const auth = useAuth();
const toast = useToast();
const isLoading = ref(false);
const bio = ref(props.currentBio);

const schema = yup.object({
  bio: yup.string().max(500, "Giới thiệu không được quá 500 ký tự"),
});

async function updateBio() {
  try {
    isLoading.value = true;
    const { data: response } = await useAPI<ApiResponse>("/api/profile/bio", {
      method: "PUT",
      body: {
        bio: bio.value,
      },
      watch: false,
    });

    if (response.value?.code === 200) {
      toast.success(response.value?.message);
      auth.user.profile.bio = bio.value;
      model.value = false;
      emit("changed");
    } else {
      toast.error(response.value?.message || "Đã xảy ra lỗi");
    }
  } catch (error) {
    toast.error("Đã xảy ra lỗi khi cập nhật giới thiệu");
  } finally {
    isLoading.value = false;
  }
}

function clear() {
  bio.value = props.currentBio;
}
</script>
