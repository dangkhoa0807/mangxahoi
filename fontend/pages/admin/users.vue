<template>
  <div class="mx-auto w-full">
    <div class="bg-white rounded-md shadow-sm p-5">
      <div class="font-semibold text-2xl mb-4">Quản lý người dùng</div>

      <!-- tìm kiếm -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4"
      >
        <InputText
          v-model="searchQuery"
          placeholder="Tìm kiếm người dùng..."
          class="w-full"
          :showClear="true"
        />

        <Select
          v-model="filterRole"
          :options="roleOptions"
          optionLabel="name"
          optionValue="code"
          placeholder="Vai trò"
          class="w-full"
          :showClear="true"
        />

        <div class="flex gap-2">
          <Button label="Lọc" @click="fetchUsers(1)" class="w-full" />
          <Button
            label="Xóa bộ lọc"
            @click="clearFilters"
            class="w-full"
            severity="danger"
          />
        </div>
      </div>

      <!-- Users Table -->
      <DataTable
        :value="users"
        :loading="loading"
        responsiveLayout="scroll"
        class="p-datatable-sm whitespace-nowrap border rounded-md overflow-hidden"
        :rows="pageSize"
        scrollable
      >
        <Column header="Người dùng" style="min-width: 200px">
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <img
                :src="
                  data.profile?.avatarUrl ||
                  'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
                "
                class="w-10 h-10 rounded-full"
                alt=""
              />
              <div>
                <NuxtLink :to="`/user/${data.id}`" class="font-semibold">{{
                  data.profile?.name
                }}</NuxtLink>
                <div class="text-sm text-gray-500">{{ data.email }}</div>
              </div>
            </div>
          </template>
        </Column>
        <Column header="Vai trò" style="min-width: 150px">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="role in data.roles"
                :key="role"
                :value="formatRole(role)"
                severity="info"
                class="text-xs"
              />
            </div>
          </template>
        </Column>
        <Column field="createdAt" header="Ngày tham gia">
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>
        <Column field="status" header="Trạng thái">
          <template #body="{ data }">
            <Tag
              :severity="getStatusSeverity(data.status)"
              :value="getStatusLabel(data.status)"
            />
          </template>
        </Column>
        <Column header="Thao tác" style="width: 100px">
          <template #body="{ data }">
            <div class="relative">
              <div
                class="w-8 h-8 flex justify-center items-center hover:bg-gray-100 rounded-full cursor-pointer"
                @click="displayUserActions($event, data)"
                aria-haspopup="true"
                aria-controls="user_actions"
              >
                <Icon name="tabler:dots" class="text-xl text-gray-700" />
              </div>
            </div>
          </template>
        </Column>
        <template #empty>
          <div class="text-center p-2 px-4 text-gray-500">
            <div>Không tìm thấy người dùng nào</div>
          </div>
        </template>
      </DataTable>

      <PaginationVue
        class="mt-4"
        v-model="page"
        :total-items="pagination?.totalCount || 0"
        :per-page="pageSize"
        @page-change="fetchUsers"
      />

      <!-- Popover được đặt ngoài DataTable -->
      <Popover ref="popoverRef">
        <div v-if="selectedUser" class="flex flex-col w-48">
          <NuxtLink
            :to="`/user/${selectedUser.id}`"
            class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
          >
            <Icon name="fe:info" class="text-2xl text-gray-600" />
            Xem trang cá nhân
          </NuxtLink>
          <div
            class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
            @click="openEditDialog(selectedUser)"
          >
            <Icon name="tabler:edit" class="text-2xl text-gray-600" />
            Chỉnh sửa thông tin
          </div>
          <div
            class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full"
            @click="openRoleDialog(selectedUser)"
          >
            <Icon name="tabler:user-shield" class="text-2xl text-gray-600" />
            Quản lý vai trò
          </div>
        </div>
      </Popover>
    </div>
  </div>

  <Dialog
    v-model:visible="editDialog"
    header="Chỉnh sửa thông tin người dùng"
    :style="{ width: '50vw' }"
    modal
    :dismissableMask="false"
  >
    <div class="flex flex-col gap-4">
      <!-- Nhập tên người dùng -->
      <div class="flex flex-col gap-2">
        <label>Tên người dùng</label>
        <InputText v-model="editForm.name" />
      </div>

      <!-- Chọn giới tính -->
      <div class="flex flex-col gap-2">
        <label>Giới tính</label>
        <Select
          v-model="editForm.gender"
          :options="genderOptions"
          optionLabel="name"
          optionValue="code"
        />
      </div>

      <!-- Chọn ngày sinh -->
      <div class="flex flex-col gap-2">
        <label>Ngày sinh</label>
        <Calendar v-model="editForm.birthday" dateFormat="dd/mm/yy" />
      </div>

      <!-- Nhập giới thiệu -->
      <div class="flex flex-col gap-2">
        <label>Giới thiệu</label>
        <Textarea v-model="editForm.bio" rows="3" />
      </div>
    </div>

    <template #footer>
      <Button label="Huỷ" @click="closeEditDialog" class="p-button-text" />
      <Button label="Lưu" @click="saveProfile" :loading="saving" />
    </template>
  </Dialog>

  <Dialog
    v-model:visible="roleDialog"
    header="Quản lý vai trò người dùng"
    :style="{ width: '50vw' }"
    modal
    :dismissableMask="false"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label>Vai trò</label>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="role in roleOptions"
            :key="role.code"
            class="flex items-center"
          >
            <RadioButton
              v-model="selectedRole"
              :value="role.code"
              :inputId="role.code"
            />
            <label :for="role.code" class="ml-2">{{ role.name }}</label>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Huỷ" @click="closeRoleDialog" class="p-button-text" />
      <Button label="Lưu" @click="saveRoles" :loading="savingRoles" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import PaginationVue from "~/components/Pagination.vue";
import type { ApiResponse } from "~/types/api";
import type {
  Pagination as PaginationType,
  Profile,
  User,
} from "~/types/model";

definePageMeta({
  middleware: ["admin"],
});

// Khởi tạo toast để hiển thị thông báo
const toast = useToast();
const loading = ref(false);
const users = ref<User[]>([]);
const searchQuery = ref("");
const filterStatus = ref(null);
const pageSize = ref(8);
const pagination = ref<PaginationType | null>(null);
const page = ref(1);

const filterRole = ref(null);
const roleOptions = [
  { name: "Người dùng", code: "USER" },
  { name: "Quản trị viên", code: "ADMIN" },
  // { name: "Điều hành viên", code: "MODERATOR" },
];

// Các tùy chọn trạng thái người dùng
const statusOptions = [
  { name: "Hoạt động", code: "ACTIVE" },
  { name: "Chờ tạo hồ sơ", code: "PENDING" },
  { name: "Đã cấm", code: "BANNED" },
  { name: "Hạn chế", code: "RESTRICTED" },
];

// Thêm các ref và reactive mới
const editDialog = ref(false);
const saving = ref(false);
const editForm = reactive({
  userId: "",
  name: "",
  gender: "",
  birthday: null as Date | null,
  bio: "",
});

// Các tùy chọn giới tính
const genderOptions = [
  { name: "Nam", code: "male" },
  { name: "Nữ", code: "female" },
  { name: "Khác", code: "other" },
];

// Thêm các ref cho popover và người dùng được chọn
const popoverRef = ref();
const selectedUser = ref();

// Hàm lấy danh sách người dùng với tìm kiếm và lọc
async function fetchUsers(page = 1) {
  loading.value = true;
  try {
    const { data } = await useAPI<
      ApiResponse<{ list: User[]; pagination: PaginationType }>
    >("/api/admin/users", {
      params: {
        page,
        pageSize: pageSize.value,
        search: searchQuery.value,
        status: filterStatus.value,
        role: filterRole.value,
      },
    });

    if (data.value?.code === 200) {
      users.value = data.value.data.list;
      pagination.value = data.value.data.pagination;
    }
  } catch (error) {
    toast.error("Không thể tải danh sách người dùng");
  } finally {
    loading.value = false;
  }
}

// Thay thế onScroll bằng hàm loadMore
const loadMore = () => {
  if (!loading.value && pagination.value?.nextPage) {
    page.value = pagination.value.nextPage;
    fetchUsers(pagination.value.nextPage);
  }
};

// Hàm định dạng ngày tháng
function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// Theo dõi thay đổi trong tìm kiếm và lọc
// Tạo phiên bản debounced của fetchUsers
const debouncedFetch = useDebounce(() => {
  page.value = 1;
  fetchUsers(1);
}, 400); // 0.4 seconds

// Theo dõi thay đổi trong tìm kiếm và lọc
watch([searchQuery, filterStatus, filterRole], () => {
  debouncedFetch();
});

// Lấy dữ liệu ban đầu
await fetchUsers();

// Thêm hàm định dạng vai trò
function formatRole(role: string) {
  const roleMap: Record<string, string> = {
    USER: "Người dùng",
    ADMIN: "Quản trị viên",
    MODERATOR: "Điều hành viên",
  };
  return roleMap[role] || role;
}

// Thêm các hàm mới trước khi kết thúc script
function getStatusSeverity(status: string) {
  const statusMap: Record<string, string> = {
    active: "success",
    pending: "warning",
    banned: "danger",
    restricted: "warning",
  };
  return statusMap[status] || "info";
}

function getStatusLabel(status: string) {
  const labelMap: Record<string, string> = {
    active: "Hoạt động",
    pending: "Chưa tạo hồ sơ",
    banned: "Bị cấm",
    restricted: "Hạn chế",
  };
  return labelMap[status] || "Không xác định";
}

// Thêm hàm mở dialog chỉnh sửa vào menu actions
async function openEditDialog(user: User) {
  try {
    const { data } = await useAPI<ApiResponse<Profile>>(
      `/api/admin/profile/${user.id}`
    );

    if (data.value?.code === 200) {
      // Điền dữ liệu vào form với dữ liệu đã lấy
      editForm.userId = user.id;
      editForm.name = data.value.data.name || "";
      editForm.gender = data.value.data.gender || "";
      editForm.birthday = data.value.data.birthday
        ? new Date(data.value.data.birthday)
        : null;
      editForm.bio = data.value.data.bio || "";
      editDialog.value = true;
    } else {
      toast.error(data.value?.message || "Không thể tải thông tin người dùng");
    }
  } catch (error) {
    toast.error("Không thể tải thông tin người dùng");
  }
}

function closeEditDialog() {
  editDialog.value = false;
}

async function saveProfile() {
  saving.value = true;
  try {
    const { data } = await useAPI<ApiResponse>(
      `/api/admin/profile/${editForm.userId}`,
      {
        method: "PUT",
        body: editForm,
      }
    );

    if (data.value?.code === 200) {
      toast.success("Cập nhật thông tin thành công");

      // Tìm và cập nhật người dùng trong mảng users
      const userIndex = users.value.findIndex(
        (user) => user.id === editForm.userId
      );
      if (userIndex !== -1) {
        users.value[userIndex] = {
          ...users.value[userIndex],
          profile: {
            ...users.value[userIndex].profile,
            name: editForm.name,
          },
        };
      }

      closeEditDialog();
    }
  } catch (error) {
    toast.error("Không thể cập nhật thông tin người dùng");
  } finally {
    saving.value = false;
  }
}

// Hàm hiển thị các hành động của người dùng trong popover
function displayUserActions(event: Event, user: User) {
  popoverRef.value?.hide();

  if (selectedUser.value?.id === user.id) {
    selectedUser.value = null;
  } else {
    selectedUser.value = user;
    nextTick(() => {
      popoverRef.value?.show(event);
    });
  }
}

// Add this function in the script setup section
function clearFilters() {
  searchQuery.value = "";
  filterStatus.value = null;
  filterRole.value = null;
  page.value = 1;
  fetchUsers(1);
}

// Add new refs
const roleDialog = ref(false);
const selectedRole = ref("");
const savingRoles = ref(false);

// Add new functions
function openRoleDialog(user: User) {
  selectedRole.value = user.roles[0];
  selectedUser.value = user;
  roleDialog.value = true;
}

function closeRoleDialog() {
  roleDialog.value = false;
  selectedRole.value = "";
  selectedUser.value = null;
}

async function saveRoles() {
  if (!selectedUser.value) return;

  savingRoles.value = true;
  try {
    const { data } = await useAPI<ApiResponse>(
      `/api/admin/users/${selectedUser.value.id}/role`,
      {
        method: "PUT",
        body: {
          role: selectedRole.value,
        },
      }
    );

    if (data.value?.code === 200) {
      toast.success("Cập nhật vai trò thành công");

      const userIndex = users.value.findIndex(
        (user) => user.id === selectedUser.value?.id
      );
      if (userIndex !== -1) {
        users.value[userIndex] = {
          ...users.value[userIndex],
          roles: [selectedRole.value],
        } as User;
      }

      closeRoleDialog();
    } else {
      toast.error(
        data.value?.message || "Không thể cập nhật vai trò người dùng"
      );
    }
  } catch (error) {
    toast.error("Không thể cập nhật vai trò người dùng");
  } finally {
    savingRoles.value = false;
  }
}
</script>
