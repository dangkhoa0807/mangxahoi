<template>
  <div class="mx-auto w-full">
    <div class="bg-white rounded-md shadow-sm p-5">
      <div class="flex justify-between items-center">
        <div class="font-semibold text-2xl mb-4">Quản lý tài khoản vi phạm</div>
        <Button
          label="Tạo lệnh cấm"
          icon="pi pi-plus"
          @click="openCreateDialog"
        />
      </div>

      <!-- Search and Filter Section -->
      <div class="grid grid-cols-4 gap-4 mb-4">
        <InputText
          v-model="searchQuery"
          placeholder="Tìm kiếm người dùng..."
          class="w-full"
        />
      </div>

      <!-- Users Table -->
      <DataTable
        :value="bannedUsers"
        :loading="loading"
        responsiveLayout="scroll"
        class="p-datatable-sm whitespace-nowrap border rounded-md overflow-hidden"
        :rows="pageSize"
        scrollable
      >
        <Column header="Người dùng" style="min-width: 250px">
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <img
                :src="
                  data.user.profile?.avatarUrl ||
                  'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
                "
                class="w-10 h-10 rounded-full"
                alt=""
              />
              <div>
                <div class="font-semibold">{{ data.user.profile?.name }}</div>
                <div class="text-sm text-gray-500">{{ data.user.email }}</div>
              </div>
            </div>
          </template>
        </Column>

        <Column header="Lý do" style="min-width: 80px">
          <template #body="{ data }">
            {{ data.reason }}
          </template>
        </Column>

        <Column header="Hình thức" style="min-width: 150px">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-1">
              <Tag
                :value="formatRestriction(data.restriction)"
                :severity="getRestrictionSeverity(data.restriction)"
                class="text-xs"
              />
            </div>
          </template>
        </Column>

        <Column header="Thời gian" style="min-width: 200px">
          <template #body="{ data }">
            <div class="flex flex-col">
              <div class="text-sm">Bắt đầu: {{ formatDate(data.startAt) }}</div>
              <div class="text-sm" v-if="data.endAt">
                Kết thúc: {{ formatDate(data.endAt) }}
              </div>
              <div v-else class="text-sm text-red-500">Vĩnh viễn</div>
            </div>
          </template>
        </Column>

        <Column header="Thao tác" style="width: 100px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <div
                @click="openEditDialog(data)"
                class="w-8 h-8 flex justify-center items-center hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <Icon name="tabler:pencil" class="text-xl" />
              </div>
              <div
                @click="unbanUser(data.user.id, data.restriction)"
                class="w-8 h-8 flex justify-center items-center hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <Icon name="tabler:lock-open" class="text-xl" />
              </div>
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="text-center p-2 px-4 text-gray-500">
            <div>Chưa có người dùng nào bị vi phạm</div>
          </div>
        </template>
      </DataTable>

      <!-- Pagination -->
      <PaginationVue
        class="mt-4"
        v-model="page"
        :total-items="pagination?.totalCount || 0"
        :per-page="pageSize"
        @page-change="fetchBannedUsers"
      />

      <!-- Ban Dialog -->
      <Dialog
        v-model:visible="banDialog"
        :header="isEditing ? 'Chỉnh sửa lệnh cấm' : 'Thêm lệnh cấm mới'"
        modal
        class="p-fluid"
        :draggable="false"
      >
        <div class="flex flex-col gap-4">
          <!-- User Search -->
          <div v-if="!isEditing">
            <label class="block mb-2">Người dùng</label>
            <HeadlessCombobox v-model="selectedUser" nullable>
              <div class="relative">
                <div
                  class="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2"
                >
                  <HeadlessComboboxInput
                    class="w-full border border-gray-300 rounded-md p-2 px-3 outline-none shadow-sm focus:border-gray-500 transition duration-300 ease-in-out"
                    :displayValue="(user: unknown) => 
                      (user as User)?.profile?.name && (user as User)?.email 
                        ? `${(user as User)?.profile?.name} - ${(user as User)?.email}`
                        : ''"
                    @change="searchUsers"
                    placeholder="Tìm kiếm người dùng..."
                  />
                  <HeadlessComboboxButton
                    class="absolute inset-y-0 right-0 flex items-center pr-2"
                  >
                    <i
                      class="pi pi-chevron-down h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </HeadlessComboboxButton>
                </div>
                <Transition
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                  @after-leave="query = ''"
                >
                  <HeadlessComboboxOptions
                    class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
                    hold
                  >
                    <div
                      v-if="userSuggestions.length === 0"
                      class="relative cursor-default select-none px-4 py-2 text-gray-700"
                    >
                      Không tìm thấy người dùng.
                    </div>
                    <HeadlessComboboxOption
                      v-for="user in userSuggestions"
                      :key="user.id"
                      :value="user"
                      v-slot="{ selected, active }"
                      as="template"
                    >
                      <li
                        class="relative cursor-default select-none p-2"
                        :class="{
                          'bg-primary-50 text-primary-900': active,
                          'text-gray-900': !active,
                        }"
                      >
                        <div
                          class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-md"
                        >
                          <img
                            :src="
                              user.profile?.avatarUrl ||
                              'https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif'
                            "
                            class="w-8 h-8 rounded-full"
                          />
                          <div>
                            <div
                              :class="{
                                'font-medium': selected,
                                'font-normal': !selected,
                              }"
                            >
                              {{ user.profile?.name }}
                            </div>
                            <div class="text-sm text-gray-500">
                              {{ user.email }}
                            </div>
                          </div>
                        </div>

                        <span
                          v-if="selected"
                          class="absolute inset-y-0 right-0 flex items-center pr-4"
                          :class="{ 'text-primary-600': active }"
                        >
                          <i class="pi pi-check h-5 w-5" aria-hidden="true" />
                        </span>
                      </li>
                    </HeadlessComboboxOption>
                  </HeadlessComboboxOptions>
                </Transition>
              </div>
            </HeadlessCombobox>
          </div>

          <!-- Reason -->
          <div>
            <label class="block mb-2">Lý do</label>
            <InputText
              v-model="banForm.reason"
              placeholder="Nhập lý do..."
              class="w-full"
            />
          </div>

          <!-- Restrictions -->
          <div>
            <label class="block mb-2">Hình thức</label>
            <div class="flex flex-wrap gap-3">
              <div
                v-for="type in restrictionTypes"
                :key="type.value"
                class="flex items-center"
              >
                <RadioButton
                  v-model="banForm.restriction"
                  :value="type.value"
                  :inputId="type.value"
                />
                <label :for="type.value" class="ml-2">{{ type.label }}</label>
              </div>
            </div>
          </div>

          <!-- Duration -->
          <div>
            <label class="block mb-2">Thời hạn</label>
            <Calendar
              v-model="banForm.endAt"
              :showTime="true"
              placeholder="Để trống nếu cấm vĩnh viễn"
              class="w-full"
            />
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Huỷ" :outlined="true" @click="banDialog = false" />
            <Button
              :label="isEditing ? 'Cập nhật' : 'Thêm mới'"
              @click="saveBan(banForm.id)"
            />
          </div>
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import type { Pagination as PaginationType, User } from "~/types/model";
import PaginationVue from "~/components/Pagination.vue";

const toast = useToast();
const loading = ref(false);
const bannedUsers = ref([]);
const searchQuery = ref("");
const filterRestriction = ref(null);
const pageSize = ref(10);
const banDialog = ref(false);
const isEditing = ref(false);
const selectedUser = ref<User | null>(null);
const userSuggestions = ref<User[]>([]);
const query = ref("");
const pagination = ref<PaginationType | null>(null);
const page = ref(1);

definePageMeta({
  middleware: ["admin"],
});

const restrictionTypes = [
  { value: "FULL_BAN", label: "Cấm hoàn toàn" },
  { value: "COMMENT_BAN", label: "Cấm bình luận" },
  { value: "POST_BAN", label: "Cấm đăng bài" },
  { value: "REACTION_BAN", label: "Cấm tương tác" },
];

const banForm = reactive({
  id: "",
  userId: "",
  reason: "",
  restriction: "",
  endAt: null as Date | null,
});

// Format functions
function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRestriction(
  restriction: "FULL_BAN" | "COMMENT_BAN" | "POST_BAN" | "REACTION_BAN"
) {
  const map = {
    FULL_BAN: "Cấm hoàn toàn",
    COMMENT_BAN: "Cấm bình luận",
    POST_BAN: "Cấm đăng bài",
    REACTION_BAN: "Cấm tương tác",
  };
  return map[restriction] || restriction;
}

function getRestrictionSeverity(
  restriction: "FULL_BAN" | "COMMENT_BAN" | "POST_BAN" | "REACTION_BAN"
) {
  const map = {
    FULL_BAN: "danger",
    COMMENT_BAN: "warning",
    POST_BAN: "warning",
    REACTION_BAN: "info",
  } as const;
  return map[restriction] || "info";
}

// API calls
async function fetchBannedUsers(currentPage = 1, reset = false) {
  loading.value = true;
  try {
    const { data } = await useAPI<
      ApiResponse<{
        list: any;
        pagination: PaginationType;
      }>
    >("/api/admin/ban", {
      params: {
        page: currentPage,
        pageSize: pageSize.value,
        search: searchQuery.value,
        restriction: filterRestriction.value,
      },
    });

    if (data.value?.code === 200) {
      bannedUsers.value = data.value.data.list;
      pagination.value = data.value.data.pagination;
    }
  } finally {
    loading.value = false;
  }
}

const debouncedSearch = useDebounce(async (searchQuery: string) => {
  const { data } = await useAPI<
    ApiResponse<{
      list: User[];
      hasMore: boolean;
    }>
  >("/api/admin/users", {
    params: { search: searchQuery, pageSize: 10 },
  });

  if (data.value?.code === 200) {
    userSuggestions.value = data.value.data.list;
  }
}, 300);

async function searchUsers(event: Event) {
  const searchQuery = (event.target as HTMLInputElement).value;
  query.value = searchQuery;
  await debouncedSearch(searchQuery);
}

async function saveBan(banId?: string) {
  const endpoint = `/api/admin/ban`;

  const { data } = await useAPI<ApiResponse>(endpoint, {
    method: isEditing.value ? "PUT" : "POST",
    body: {
      ...banForm,
    },
  });

  if (data.value?.code === 200) {
    toast.success(data.value.message);
    banDialog.value = false;
    fetchBannedUsers();
  } else {
    toast.error(data.value?.message || "Có lỗi xảy ra");
  }
}

async function unbanUser(userId: string, restriction: string) {
  const { data } = await useAPI<ApiResponse>(
    `/api/admin/ban/${userId}/${restriction}`,
    {
      method: "DELETE",
    }
  );

  if (data.value?.code === 200) {
    toast.success(data.value.message);
    fetchBannedUsers();
  } else {
    toast.error(data.value?.message || "Có lỗi xảy ra");
  }
}

// Watch for search/filter changes
watch([searchQuery, filterRestriction], () => {
  page.value = 1;
  fetchBannedUsers(1, true);
});

watch(selectedUser, () => {
  banForm.userId = selectedUser.value?.id ?? "";
});

await fetchBannedUsers();

function openEditDialog(data: any) {
  isEditing.value = true;
  banForm.userId = data.id;
  banForm.reason = data.reason;
  banForm.restriction = data.restriction;
  banForm.endAt = data.endAt ? new Date(data.endAt) : null;
  banForm.id = data.id;
  banDialog.value = true;
}

function openCreateDialog() {
  isEditing.value = false;
  banForm.userId = "";
  banForm.reason = "";
  banForm.restriction = "";
  banForm.endAt = null;
  banForm.id = "";
  selectedUser.value = null;
  banDialog.value = true;
}
</script>
