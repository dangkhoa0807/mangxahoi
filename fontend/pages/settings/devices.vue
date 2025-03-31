<template>
  <div class="mx-auto w-full">
    <div class="bg-white rounded-md shadow-sm p-5">
      <div class="font-semibold text-2xl mb-1">Thiết bị đăng nhập</div>
      <hr />
      <div class="w-full mt-4">
        <div class="flex flex-col gap-3">
          <!-- No devices message -->
          <div v-if="devices.length === 0" class="text-center text-zinc-500">
            Không có thiết bị nào
          </div>

          <!-- Device list -->
          <div
            v-for="device in devices"
            :key="device.id"
            class="flex justify-between items-start p-3 hover:bg-zinc-50 rounded-md"
          >
            <div class="flex items-center justify-between gap-3 w-full">
              <div class="flex items-center gap-3 truncate">
                <div
                  class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0"
                >
                  <Icon
                    name="tabler:device-laptop"
                    class="text-xl text-blue-600"
                  />
                </div>
                <div class="truncate">
                  <div class="font-medium">
                    {{ device.deviceName }}
                    {{
                      device.deviceId == currentDeviceId
                        ? " ( thiết bị hiện tại )"
                        : ""
                    }}
                  </div>
                  <div class="text-sm text-zinc-500">
                    Hoạt động lần cuối:
                    {{ formatDate(device.lastLoginAt) }}
                  </div>
                </div>
              </div>

              <!-- Delete button -->
              <button
                @click="deleteDevice(device.id)"
                class="text-red-600 hover:bg-red-50 p-2 rounded-md hover:border hover:border-red-600"
              >
                Xóa
              </button>
            </div>
          </div>

          <!-- Load more button -->
          <button
            v-if="hasMore"
            @click="loadMore"
            :disabled="loading"
            class="text-blue-600 hover:bg-blue-50 p-2 rounded-md text-center"
          >
            <span v-if="loading">Đang tải...</span>
            <span v-else>Tải thêm</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Add confirmation dialog -->
    <Dialog
      v-model:visible="showDeleteConfirm"
      modal
      :showHeader="false"
      :style="{ width: '32rem' }"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col items-center w-full gap-4 my-5">
          <Icon
            name="fluent:info-32-regular"
            class="!text-6xl text-primary-500"
          ></Icon>
          <p class="text-center font-medium text-lg">
            Xóa Thiết Bị Đáng Tin Cậy
          </p>
          <p class="text-center text-gray-600">
            Nếu bạn xóa thiết bị này ({{ selectedDevice?.deviceName }}), lần sau
            khi đăng nhập bằng cùng một thiết bị sẽ cần tiến hành xác nhận thiết
            bị mới.
          </p>
        </div>

        <div class="flex justify-center gap-2">
          <Button
            type="button"
            label="Huỷ"
            severity="secondary"
            :outlined="true"
            @click="showDeleteConfirm = false"
          ></Button>
          <Button
            type="button"
            severity="danger"
            label="Xóa"
            @click="confirmDelete"
          ></Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";

interface Device {
  id: string;
  deviceId: string;
  deviceName: string;
  lastLoginAt: string;
  createdAt: string;
}

const devices = ref<Device[]>([]);
const hasMore = ref(false);
const cursor = ref<string | null>(null);
const currentDeviceId = useDevice().getDeviceId();
const loading = ref(false);
const limit = ref(5);
const toast = useToast();
const showDeleteConfirm = ref(false);
const selectedDevice = ref<Device | null>(null);

// Fetch devices
async function fetchDevices() {
  try {
    loading.value = true; // Start loading
    const { data } = await useAPI<
      ApiResponse<{
        list: Device[];
        hasMore: boolean;
        cursor?: string;
      }>
    >("/api/user/devices", {
      method: "GET",
      params: {
        cursor: cursor.value,
        limit: limit.value,
      },
    });

    if (data.value?.code === 200) {
      if (cursor.value) {
        devices.value.push(...data.value.data.list);
      } else {
        devices.value = data.value.data.list;
      }
      hasMore.value = data.value.data.hasMore;
      cursor.value = data.value.data.cursor || null;
    }
  } catch (error) {
    loading.value = false;
    console.error("Error fetching devices:", error);
  } finally {
    loading.value = false;
  }
}

// Tải thêm thiết bị
function loadMore() {
  if (hasMore.value) {
    fetchDevices();
  }
}

// Format date
function formatDate(date: string) {
  return new Date(date).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Xoá thiết bị
async function deleteDevice(deviceId: string) {
  const device = devices.value.find((d) => d.id === deviceId);
  if (device) {
    selectedDevice.value = device;
    showDeleteConfirm.value = true;
  }
}

// Add new confirmDelete function
async function confirmDelete() {
  try {
    const { data } = await useAPI<ApiResponse>(
      `/api/user/devices/${selectedDevice.value?.id}`,
      {
        method: "DELETE",
      }
    );

    if (data.value?.code === 200) {
      devices.value = devices.value.filter(
        (device) => device.id !== selectedDevice.value?.id
      );
      showDeleteConfirm.value = false;
      selectedDevice.value = null;
    } else {
      toast.error(data.value?.message || "Có lỗi xảy ra");
    }
  } catch (error) {
    console.error("Error deleting device:", error);
  }
}

// Tải danh sách thiết bị khi trang được mở
await fetchDevices();
</script>
