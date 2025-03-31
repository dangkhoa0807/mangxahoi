<template>
  <div class="mx-auto w-full">
    <div class="bg-white rounded-md shadow-sm p-5 overflow-hidden">
      <div class="font-semibold text-2xl mb-4">Quản lý bộ sticker</div>

      <!-- Thanh công cụ -->
      <div class="flex gap-4 mb-4">
        <InputText
          v-model="searchQuery"
          placeholder="Tìm kiếm danh mục..."
          class="w-full md:w-80"
          :showClear="true"
        />

        <Button label="Thêm mới" @click="openCreateDialog" severity="success" />
      </div>

      <!-- Bảng danh mục -->

      <div class="overflow-auto w-full">
        <DataTable
          :value="packs"
          class="p-datatable-sm whitespace-nowrap border rounded-md"
          :rows="limit"
          scrollable
        >
          <Column field="image" header="Hình ảnh">
            <template #body="{ data }">
              <img
                :src="data.coverUrl"
                class="w-12 h-12 object-cover rounded-md"
                alt="Category Image"
              />
            </template>
          </Column>

          <Column field="name" header="Tên bộ sticker">
            <template #body="{ data }">
              <div class="font-semibold">{{ data.name }}</div>
            </template>
          </Column>

          <Column field="_count.stickers" header="Số lượng">
            <template #body="{ data }">
              <div class="font-semibold">{{ data._count.stickers }}</div>
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
                  aria-controls="category_actions"
                >
                  <Icon name="tabler:dots" class="text-xl text-gray-700" />
                </div>
              </div>
            </template>
          </Column>

          <template #empty>
            <div class="text-center p-2 px-4 text-gray-500">
              <div>Không tìm thấy danh mục nào</div>
            </div>
          </template>
        </DataTable>
      </div>

      <PaginationVue
        class="mt-4"
        v-model="page"
        :total-items="totalItems"
        :per-page="limit"
        @page-change="fetchPacks"
      />

      <!-- Popover menu -->
      <Popover ref="popoverRef">
        <div v-if="selectedPack" class="flex flex-col w-48">
          <div
            class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
            @click="openEditDialog(selectedPack)"
          >
            <Icon name="tabler:edit" class="text-2xl text-gray-600" />
            Chỉnh sửa
          </div>
          <div
            class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full text-red-500"
            @click="deletePack(selectedPack)"
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
      :header="dialog.isEdit ? 'Chỉnh sửa bộ sticker' : 'Thêm bộ sticker mới'"
      modal
      :draggable="false"
      :style="{ width: '32rem' }"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label>Tên bộ sticker</label>
          <InputText v-model="form.name" placeholder="Nhập tên bộ sticker" />
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
            v-if="!form.coverUrl"
          />
          <div v-if="form.coverUrl" class="relative">
            <button
              class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
              @click="removeImage"
            >
              <Icon name="tabler:x" class="text-gray-600 text-xl" />
            </button>
            <img
              :src="form.coverUrl"
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
          @click="savePack"
          :loading="saving"
        />
      </template>
    </Dialog>

    <ConfirmDialog></ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import {
  StickerStatus,
  type Pagination,
  type StickerPack,
} from "~/types/model";
import PaginationVue from "~/components/Pagination.vue";

// State
const toast = useToast();
const loading = ref(false);
const packs = ref<StickerPack[]>([]);
const searchQuery = ref("");

const limit = ref(8);
const page = ref(1);
const totalItems = ref(0);

const popoverRef = ref();
const selectedPack = ref();

const confirm = useConfirm();

const dialog = reactive({
  visible: false,
  isEdit: false,
});

const form = reactive({
  id: "",
  name: "",
  coverFile: null as File | null,
  coverUrl: "",
  active: true,
});

const saving = ref(false);

// Methods
function formatDate(date: string) {
  return new Date(date).toLocaleString("vi-VN");
}

async function fetchPacks() {
  loading.value = true;

  try {
    const { data } = await useAPI<
      ApiResponse<{
        list: StickerPack[];
        pagination: Pagination;
      }>
    >("/api/admin/sticker/packs", {
      query: {
        limit: limit.value,
        page: page.value,
        search: searchQuery.value,
      },
    });

    if (data.value?.code === 200) {
      packs.value = data.value.data.list;
      totalItems.value = data.value.data.pagination.pageCount;
      closeDialog();
    }
  } catch (error) {
    toast.error("Không thể tải danh sách bộ sticker");
  } finally {
    loading.value = false;
  }
}

async function displayActions(event: Event, pack: any) {
  await popoverRef.value?.hide(event);
  selectedPack.value = pack;
  popoverRef.value?.show(event);
}

function openCreateDialog() {
  dialog.isEdit = false;
  dialog.visible = true;
  Object.assign(form, {
    id: "",
    name: "",
    coverUrl: "",
    active: true,
  });
}

function openEditDialog(pack: StickerPack) {
  dialog.isEdit = true;
  dialog.visible = true;
  form.active = pack.status === StickerStatus.ACTIVE;
  Object.assign(form, pack);
  popoverRef.value?.hide();
}

function closeDialog() {
  dialog.visible = false;
}

function savePack() {
  if (dialog.isEdit) {
    return editPack();
  } else {
    return createPack();
  }
}

async function editPack() {
  try {
    saving.value = true;

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("cover", form.coverFile ? form.coverFile : "");
    formData.append(
      "status",
      form.active ? StickerStatus.ACTIVE : StickerStatus.INACTIVE
    );

    const { data } = await useAPI<ApiResponse<StickerPack>>(
      `/api/admin/sticker/packs/${form.id}`,
      {
        method: "PUT",
        body: formData,
      }
    );

    if (data.value?.code === 200) {
      packs.value = packs.value.map((pack) =>
        pack.id === form.id && data.value?.data ? data.value.data : pack
      );
      dialog.visible = false;
      toast.success("Cập nhật bộ sticker thành công");
    } else {
      toast.error(data.value?.message || "Không thể cập nhật bộ sticker");
    }
  } catch (error) {
    toast.error("Không thể cập nhật bộ sticker");
  } finally {
    saving.value = false;
  }
}

async function createPack() {
  try {
    saving.value = true;

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("cover", form.coverFile ? form.coverFile : "");
    formData.append("active", form.active.toString());

    const { data } = await useAPI<ApiResponse<StickerPack>>(
      "/api/admin/sticker/packs",
      {
        method: "POST",
        body: formData,
      }
    );

    if (data.value?.code === 200) {
      packs.value.unshift(data.value.data);
      dialog.visible = false;
      toast.success("Tạo bộ sticker thành công");
    } else {
      toast.error(data.value?.message || "Không thể tạo bộ sticker");
    }
  } catch (error) {
    toast.error("Không thể tạo bộ sticker");
  } finally {
    saving.value = false;
  }
}

async function deletePack(pack: any) {
  const confirmed = confirm.require({
    message: "Bạn có chắc chắn muốn xóa bộ sticker này?",
    header: "Xác nhận xóa",
    acceptLabel: "Xóa",
    rejectProps: {
      label: "Hủy",
      severity: "secondary",
      outlined: true,
    },
    accept: async () => {
      try {
        const { data } = await useAPI<ApiResponse<StickerPack>>(
          `/api/admin/sticker/packs/${pack.id}`,
          {
            method: "DELETE",
          }
        );

        if (data.value?.code === 200) {
          packs.value = packs.value.filter((c) => c.id !== pack.id);
          toast.success("Xóa bộ sticker thành công");
        } else {
          toast.error(data.value?.message || "Không thể xóa bộ sticker");
        }
      } catch (error) {
        toast.error("Không thể xóa bộ sticker");
      }

      popoverRef.value?.hide();
    },
  });
}

const debouncedSearch = useDebounce(() => {
  page.value = 1;
  fetchPacks();
}, 500);

// Watch changes
watch(searchQuery, () => {
  debouncedSearch();
});

// Initial fetch
await fetchPacks();

// Add image upload handler
function handleImageUpload(event: any) {
  const file = event.files[0];
  if (file) {
    form.coverFile = file;
    form.coverUrl = URL.createObjectURL(file);
  }
}

function handlePageChange(_page: number) {
  page.value = _page;
  fetchPacks();
}

function removeImage() {
  form.coverUrl = "";
}
</script>
