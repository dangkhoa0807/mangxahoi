<template>
  <div>
    <Dialog
      v-model:visible="visible"
      modal
      :show-header="false"
      :pt="{
        root: 'pt-4',
        content: 'pb-4',
      }"
      :style="{ width: '32rem' }"
    >
      <div class="flex justify-between items-center sticky top-0 bg-white pb-3">
        <div class="text-xl text-gray-800">Tạo hồ sơ</div>
        <div class="flex items-center gap-4">
          <div
            class="hover:bg-gray-100 rounded-full transition duration-150 ease-in-out cursor-pointer w-7 h-7 flex items-center justify-center"
            @click="visible = false"
          >
            <Icon name="tabler:x" class="text-2xl"></Icon>
          </div>
        </div>
      </div>
      <hr />

      <Form class="mt-4">
        <!-- Email -->
        <div class="mb-4">
          <label for="name">Họ và tên</label>
          <Field
            v-model="formData.name"
            name="name"
            placeholder="Họ và tên"
            class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-blue-500 transition duration-300 ease-in-out"
          />
          <ErrorMessage name="name" class="block mt-1 text-red-500" />
        </div>

        <div class="mb-4">
          <label for="name">Sinh nhật</label>
          <DatePicker
            v-model="formData.birthday"
            dateFormat="dd/mm/yy"
            class="w-full"
            placeholder="Sinh nhật"
            name="birthday"
          />
          <ErrorMessage name="birthday" class="block mt-1 text-red-500" />
        </div>

        <div class="mb-4">
          <label for="gender">Giới tính</label>

          <div class="card">
            <div class="grid grid-cols-3 gap-4">
              <div class="flex items-center border rounded-md p-3 w-full">
                <RadioButton
                  v-model="formData.gender"
                  inputId="ingredient1"
                  name="gender"
                  value="male"
                />
                <label for="ingredient1" class="ml-2">Nam</label>
              </div>
              <div class="flex items-center border rounded-md p-3 w-full">
                <RadioButton
                  v-model="formData.gender"
                  inputId="ingredient2"
                  name="gender"
                  value="female"
                />
                <label for="ingredient2" class="ml-2">Nữ</label>
              </div>
              <div class="flex items-center border rounded-md p-3 w-full">
                <RadioButton
                  v-model="formData.gender"
                  inputId="ingredient3"
                  name="gender"
                  value="other"
                />
                <label for="ingredient3" class="ml-2">Khác</label>
              </div>
            </div>
          </div>
          <ErrorMessage name="gender" class="block mt-1 text-red-500" />
        </div>

        <Button
          label="Tạo hồ sơ"
          class="w-full"
          @click="createProfile"
        ></Button>
      </Form>
    </Dialog>

    <Loading v-model="isLoading" />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import Loading from "./Dialog/Loading.vue";

const visible = defineModel({ required: true, default: false });
const props = defineProps({
  action_ticket: { type: String },
});

const toast = useToast();
const auth = useAuth();

const formData = reactive({
  name: "",
  birthday: null,
  gender: null,
});

const isLoading = ref(false);

async function createProfile() {
  try {
    isLoading.value = true;

    const { data: response } = await useAPI<
      ApiResponse<{
        access_token: string;
        refresh_token: string;
      }>
    >("/api/user/create", {
      method: "POST",
      body: {
        ...formData,
        action_ticket: props.action_ticket,
      },
      watch: false,
    });

    if (response.value?.code == 200) {
      toast.success(response.value.message);
      await auth.setTokens(
        response.value.data.access_token,
        response.value.data.refresh_token
      );
      visible.value = false;
    } else {
      toast.error(response.value?.message ?? "Lấy dữ liệu thất bại");
    }
  } catch (error) {
    toast.error("Lấy dữ liệu thất bại");
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped></style>
