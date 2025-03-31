<template>
  <div class="mx-auto w-full">
    <div class="bg-white rounded-md shadow-sm p-5">
      <div class="font-semibold text-2xl mb-4">Quản lý sticker</div>

      <!-- Thanh công cụ -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4"
      >
        <InputText
          v-model="searchQuery"
          placeholder="Tìm kiếm sticker..."
          class="w-full"
          :showClear="true"
        />

        <Select
          v-model="filterpack"
          :options="packOptions"
          optionLabel="name"
          optionValue="code"
          placeholder="Bộ sticker"
          class="w-full"
          :showClear="true"
        />

        <div class="flex gap-2">
          <Button
            label="Thêm mới"
            @click="openCreateDialog"
            class="w-full"
            severity="success"
          />
          <Button
            label="Xóa bộ lọc"
            @click="clearFilters"
            class="w-full"
            severity="danger"
          />
        </div>
      </div>

      <!-- Bảng sticker -->
      <DataTable
        :value="stickers"
        responsiveLayout="scroll"
        class="p-datatable-sm whitespace-nowrap border rounded-md overflow-hidden"
        :rows="limit"
        scrollable
      >
        <Column header="Sticker">
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <img
                :src="data.url"
                class="w-12 h-12 object-cover rounded-md"
                alt=""
              />
            </div>
          </template>
        </Column>

        <Column field="keywords" header="Từ khoá">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-2">
              <Tag
                v-if="data.keywords.length > 0"
                v-for="keyword in data.keywords"
                :key="keyword"
                :value="keyword"
                class="text-sm"
              />
              <div v-else>
                <div class="text-gray-500">Không</div>
              </div>
            </div>
          </template>
        </Column>

        <Column field="pack" header="Bộ sticker">
          <template #body="{ data }">
            <img
              :src="data.pack.coverUrl"
              class="w-12 h-12 object-cover rounded-md"
              alt=""
            />
            <div class="text-sm text-gray-500">
              {{ data.pack.name }}
            </div>
          </template>
        </Column>

        <Column field="createdAt" header="Ngày tạo">
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>

        <Column field="status" header="Trạng thái">
          <template #body="{ data }">
            <Tag
              :severity="
                data.status === StickerStatus.ACTIVE ? 'success' : 'danger'
              "
              :value="
                data.status === StickerStatus.ACTIVE ? 'Hoạt động' : 'Vô hiệu'
              "
            />
          </template>
        </Column>

        <Column header="Thao tác" style="width: 100px">
          <template #body="{ data }">
            <div class="relative">
              <div
                class="w-8 h-8 flex justify-center items-center hover:bg-gray-100 rounded-full cursor-pointer"
                @click="displayActions($event, data)"
                aria-haspopup="true"
                aria-controls="sticker_actions"
              >
                <Icon name="tabler:dots" class="text-xl text-gray-700" />
              </div>
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="text-center p-2 px-4 text-gray-500">
            <div>Không tìm thấy sticker nào</div>
          </div>
        </template>
      </DataTable>

      <PaginationVue
        class="mt-4"
        v-model="page"
        :total-items="totalItems"
        :per-page="limit"
        @page-change="fetchStickers"
      />

      <!-- Popover menu -->
      <Popover ref="popoverRef">
        <div v-if="selectedSticker" class="flex flex-col w-48">
          <div
            class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
            @click="openEditDialog(selectedSticker)"
          >
            <Icon name="tabler:edit" class="text-2xl text-gray-600" />
            Chỉnh sửa
          </div>
          <div
            class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full text-red-500"
            @click="deleteSticker(selectedSticker)"
          >
            <Icon name="tabler:trash" class="text-2xl" />
            Xóa
          </div>
        </div>
      </Popover>
    </div>

    <!-- Dialog thêm/sửa -->
    <Dialog
      v-model:visible="dialog.visible"
      :header="dialog.isEdit ? 'Chỉnh sửa sticker' : 'Thêm sticker mới'"
      :style="{ width: '50vw' }"
      modal
      :draggable="false"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label>Từ khoá</label>
          <Tagify v-model="form.keywords" placeholder="Từ khoá" />
        </div>

        <div class="flex flex-col gap-2">
          <label>Danh mục</label>
          <Select
            v-model="form.packId"
            :options="packOptions"
            optionLabel="name"
            optionValue="code"
            placeholder="Bộ sticker"
            :showClear="true"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label>Hình ảnh</label>
          <FileUpload
            mode="basic"
            :auto="true"
            accept="image/*"
            :maxFileSize="10000000"
            @select="handleImageUpload"
            chooseLabel="Chọn ảnh"
            class="w-full"
            v-if="!form.url"
          />
          <div v-if="form.url" class="relative">
            <button
              class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
              @click="removeImage"
            >
              <Icon name="tabler:x" class="text-gray-600 text-xl" />
            </button>
            <img
              :src="form.url"
              class="w-full object-cover rounded-md border"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Checkbox v-model="form.active" :binary="true" />
          <label>Kích hoạt</label>
        </div>
      </div>

      <template #footer>
        <Button label="Huỷ" @click="closeDialog" class="p-button-text" />
        <Button
          :label="dialog.isEdit ? 'Cập nhật' : 'Thêm mới'"
          @click="saveSticker"
          :loading="saving"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import PaginationVue from "~/components/Pagination.vue";
import type { ApiResponse } from "~/types/api";
import { StickerStatus, type Sticker } from "~/types/model";
import Tagify from "~/components/Tagify.vue";

const packOptions = ref<{ name: string; code: string }[]>([]);

// State
const toast = useToast();
const loading = ref(false);
const stickers = ref<Sticker[]>([]);
const searchQuery = ref("");
const filterpack = ref(null);
const limit = ref(8);
const page = ref(1);
const totalItems = ref(0);

const popoverRef = ref();
const selectedSticker = ref();

const dialog = reactive({
  visible: false,
  isEdit: false,
});

const form = reactive({
  id: "",
  name: "",
  packId: "",
  url: "",
  active: true,
  keywords: [],
  image: null as File | null,
});

const saving = ref(false);

// Methods
function formatDate(date: string) {
  return new Date(date).toLocaleString("vi-VN");
}

function clearFilters() {
  searchQuery.value = "";
  filterpack.value = null;
  page.value = 1;
  fetchStickers();
}

async function fetchStickers() {
  loading.value = true;
  try {
    const { data } = await useAPI<
      ApiResponse<{
        list: Sticker[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    >(`/api/admin/sticker`, {
      method: "GET",
      params: {
        page,
        limit: limit.value,
        search: searchQuery.value,
        packId: filterpack.value,
      },
    });

    if (data.value?.code === 200) {
      stickers.value = data.value.data.list;
      totalItems.value = data.value.data.pagination.total;
      page.value = data.value.data.pagination.page;
    }
  } catch (error) {}
}

async function fetchAllPacks() {
  const { data } = await useAPI<
    ApiResponse<
      {
        name: string;
        code: string;
      }[]
    >
  >("/api/admin/sticker/all-packs");

  if (data.value?.code === 200) {
    packOptions.value = data.value.data;
  }
}

function displayActions(event: Event, sticker: any) {
  selectedSticker.value = sticker;
  popoverRef.value?.show(event);
}

function openCreateDialog() {
  dialog.isEdit = false;
  dialog.visible = true;
  Object.assign(form, {
    id: "",
    name: "",
    packId: "",
    url: "",
    image: null,
    keywords: [],
    active: true,
  });
}

function openEditDialog(sticker: any) {
  dialog.isEdit = true;
  dialog.visible = true;
  form.active = sticker.status === StickerStatus.ACTIVE;
  Object.assign(form, sticker);
  popoverRef.value?.hide();
}

function closeDialog() {
  dialog.visible = false;
}

function handleImageUpload(event: any) {
  const file = event.files[0];
  if (file) {
    form.image = file;
    form.url = URL.createObjectURL(file);
  }
}

function removeImage() {
  form.image = null;
  form.url = "";
}

function saveSticker() {
  saving.value = true;
  // Simulate API call
  if (dialog.isEdit) {
    return updateSticker();
  } else {
    return createSticker();
  }
}

async function createSticker() {
  try {
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("packId", form.packId);
    formData.append("active", form.active.toString());
    formData.append("keywords", form.keywords.toString());
    formData.append("image", form.image as Blob);

    const { data } = await useAPI<ApiResponse<Sticker>>(`/api/admin/sticker`, {
      method: "POST",
      body: formData,
    });

    if (data.value?.code === 200) {
      closeDialog();
      stickers.value.unshift(data.value.data);
      toast.success("Thêm sticker mới thành công");
    } else {
      toast.error(data.value?.message || "Thêm sticker mới thất bại");
    }
  } catch (error) {
    console.log(error);
  } finally {
    saving.value = false;
  }
}

async function updateSticker() {
  try {
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("packId", form.packId);
    formData.append("active", form.active.toString());
    formData.append("keywords", form.keywords.toString());
    formData.append("image", form.image as Blob);
    formData.append(
      "status",
      form.active ? StickerStatus.ACTIVE : StickerStatus.INACTIVE
    );

    const { data } = await useAPI<ApiResponse<Sticker>>(
      `/api/admin/sticker/${form.id}`,
      {
        method: "PUT",
        body: formData,
      }
    );

    if (data.value?.code === 200) {
      closeDialog();
      stickers.value = stickers.value.map((s) =>
        s.id === form.id && data.value?.data ? data.value.data : s
      );
      toast.success("Cập nhật sticker thành công");
    } else {
      toast.error(data.value?.message || "Cập nhật sticker thất bại");
    }
  } catch (error) {
  } finally {
    saving.value = false;
  }
}

async function deleteSticker(sticker: any) {
  try {
    const { data } = await useAPI<ApiResponse<Sticker>>(
      `/api/admin/sticker/${sticker.id}`,
      {
        method: "DELETE",
      }
    );

    if (data.value?.code === 200) {
      stickers.value = stickers.value.filter((s) => s.id !== sticker.id);
      toast.success("Xóa sticker thành công");
      popoverRef.value?.hide();
    } else {
      toast.error(data.value?.message || "Không thể xóa sticker");
    }
  } catch (error) {
    toast.error("Không thể xóa sticker");
  }
}

// Watch changes
watch([searchQuery, filterpack], () => {
  page.value = 1;
  fetchStickers();
});

// Initial fetch
await Promise.all([fetchStickers(), fetchAllPacks()]);
</script>
