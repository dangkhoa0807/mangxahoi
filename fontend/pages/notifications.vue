<template>
  <div>
    <div class="mx-auto w-full xl:w-8/12">
      <div class="flex justify-between items-center mb-4">
        <div class="font-semibold text-xl">Thông báo</div>
        <button
          v-if="notifications.length && notifications.some((n) => !n.read)"
          @click="markAllAsRead"
          class="text-blue-500 hover:text-blue-600 text-sm"
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>
      <Tabs
        v-model:value="activeTab"
        class="rounded-md overflow-hidden shadow-sm"
        @update:value="handleTabChange"
      >
        <TabList>
          <Tab value="0">Tất cả</Tab>
          <Tab value="1">Chưa đọc</Tab>
        </TabList>
        <TabPanels
          :pt="{
            root: 'custom-panel',
          }"
        >
          <TabPanel value="0">
            <div class="flex flex-col gap-2 my-2 px-2">
              <div v-if="!notifications.length">
                <div class="text-center text-gray-500">
                  Không có thông báo nào
                </div>
              </div>

              <div
                v-if="notifications.length"
                v-for="notification in notifications"
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                class="flex gap-3 p-2 hover:bg-zinc-100 rounded-md cursor-pointer border relative group"
              >
                <!-- Avatar người gửi -->
                <div class="w-12 h-12">
                  <img
                    class="w-full h-full object-cover rounded-full"
                    :src="
                      notification.sender.profile.avatarUrl ??
                      `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
                    "
                    alt="Avatar"
                  />
                </div>

                <!-- Nội dung thông báo -->
                <div class="flex-grow">
                  <div>
                    <span class="font-semibold">{{
                      notification.sender.profile.name
                    }}</span>
                    <span v-if="notification.message" class="ms-1">
                      {{ notification.message }}
                    </span>
                    <span v-else-if="notification.type == 'comment'">
                      đã bình luận bài viết của bạn</span
                    >
                    <span v-else-if="notification.type == 'like'">
                      đã thích bài viết của bạn</span
                    >
                    <span v-else-if="notification.type == 'follow'">
                      đã theo dõi bạn</span
                    >
                    <span
                      v-else-if="notification.type == 'group_join_accepted'"
                    >
                      đã chấp nhận yêu cầu tham gia nhóm của bạn
                    </span>
                    <span
                      v-else-if="notification.type == 'group_join_rejected'"
                    >
                      đã từ chối yêu cầu tham gia nhóm của bạn
                    </span>
                    <span v-else-if="notification.type == 'new_post'">
                      đã đăng bài viết mới
                    </span>
                    <span v-else-if="notification.type == 'comment_like'">
                      đã thích bình luận của bạn
                    </span>
                  </div>
                  <div class="text-blue-500">
                    <FromNow :datetime="notification.createdAt" />
                  </div>
                </div>

                <!-- Menu  -->
                <div
                  class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  :class="{
                    'opacity-100': selectedNotification?.id === notification.id,
                  }"
                >
                  <button
                    class="w-8 h-8 hover:bg-gray-200 rounded-full flex items-center justify-center"
                    @click.stop="showMenu($event, notification)"
                  >
                    <Icon name="tabler:dots" class="text-xl text-gray-600" />
                  </button>
                </div>

                <!-- Icon đã đọc hay chưa -->
                <div
                  v-if="!notification.read"
                  class="w-2 h-2 bg-blue-500 rounded-full self-center"
                ></div>
              </div>

              <button
                v-if="hasMore"
                @click="loadMore"
                :disabled="isLoadMoreLoading"
                class="w-full px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  v-if="isLoadMoreLoading"
                  class="flex items-center justify-center gap-2"
                >
                  <Icon name="eos-icons:loading" class="animate-spin" />
                  Đang tải...
                </span>
                <span v-else>Tải thêm</span>
              </button>
            </div>
          </TabPanel>
          <TabPanel value="1">
            <div class="flex flex-col gap-2 my-2 px-2">
              <div v-if="!notifications.length">
                <div class="text-center text-gray-500">
                  Không có thông báo nào
                </div>
              </div>

              <div
                v-if="notifications.length"
                v-for="notification in notifications"
                :key="notification.id"
                class="flex gap-3 p-2 hover:bg-zinc-100 rounded-md cursor-pointer border relative group"
                @click="handleNotificationClick(notification)"
              >
                <!-- Avatar người gửi -->
                <div class="w-12 h-12">
                  <img
                    class="w-full h-full object-cover rounded-full"
                    :src="
                      notification.sender.profile.avatarUrl ??
                      `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
                    "
                    alt="Avatar"
                  />
                </div>

                <!-- Nội dung thông báo -->
                <div class="flex-grow">
                  <div>
                    <span class="font-semibold">{{
                      notification.sender.profile.name
                    }}</span>
                    <span v-if="notification.message" class="ms-1">
                      {{ notification.message }}
                    </span>
                    <span v-else-if="notification.type == 'comment'">
                      đã bình luận bài viết của bạn</span
                    >
                    <span v-else-if="notification.type == 'like'">
                      đã thích bài viết của bạn</span
                    >
                    <span v-else-if="notification.type == 'follow'">
                      đã theo dõi bạn</span
                    >
                    <span
                      v-else-if="notification.type == 'group_join_accepted'"
                    >
                      đã chấp nhận yêu cầu tham gia nhóm của bạn
                    </span>
                    <span
                      v-else-if="notification.type == 'group_join_rejected'"
                    >
                      đã từ chối yêu cầu tham gia nhóm của bạn
                    </span>
                  </div>
                  <div class="text-blue-500">
                    <FromNow :datetime="notification.createdAt" />
                  </div>
                </div>

                <!-- Menu  -->
                <div
                  class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  :class="{
                    'opacity-100': selectedNotification?.id === notification.id,
                  }"
                >
                  <button
                    class="w-8 h-8 hover:bg-gray-200 rounded-full flex items-center justify-center"
                    @click.stop="showMenu($event, notification)"
                  >
                    <Icon name="tabler:dots" class="text-xl text-gray-600" />
                  </button>
                </div>

                <!-- Icon đã đọc hay chưa -->
                <div
                  v-if="!notification.read"
                  class="w-2 h-2 bg-blue-500 rounded-full self-center"
                ></div>
              </div>

              <button
                v-if="hasMore"
                @click="loadMore"
                :disabled="isLoadMoreLoading"
                class="w-full px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  v-if="isLoadMoreLoading"
                  class="flex items-center justify-center gap-2"
                >
                  <Icon name="eos-icons:loading" class="animate-spin" />
                  Đang tải...
                </span>
                <span v-else>Tải thêm</span>
              </button>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <!-- Add Popover for menu -->
    <Popover ref="notificationMenu" @hide="selectedNotification = null">
      <div class="w-48">
        <div class="flex flex-col gap-1">
          <div
            v-if="!selectedNotification?.read && selectedNotification?.id"
            class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
            @click="markAsRead([selectedNotification?.id])"
          >
            <Icon name="tabler:check" class="text-xl text-gray-600" />
            Đánh dấu đã đọc
          </div>
          <div
            class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
            @click="deleteNotification(selectedNotification?.id)"
          >
            <Icon name="tabler:trash" class="text-xl text-gray-600" />
            Xóa thông báo
          </div>
        </div>
      </div>
    </Popover>

    <Loading v-model="isLoading" />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import FromNow from "~/components/FromNow.vue";
import Loading from "~/components/Dialog/Loading.vue";
import { notificationService } from "~/services/notification";

definePageMeta({
  layout: "default",
});

interface Notification {
  id: string;
  type: string;
  message: string | null;
  redirectUrl: string;
  read: boolean;
  createdAt: string;
  sender: {
    profile: {
      name: string;
      avatarUrl: string | null;
    };
  };
}

interface NotificationResponse {
  list: Notification[];
  hasMore: boolean;
}

const isLoading = ref(false);
const limit = 10;
const cursor = ref<string | null>(null);
const isLoadMoreLoading = ref(false);
const hasMore = ref(false);
const notifications = ref<Notification[]>([]);
const activeTab = ref("0");

const toast = useToast();

// Initial load
const loadNotifications = async () => {
  isLoadMoreLoading.value = true;
  try {
    const unreadOnly = activeTab.value === "1";
    const { data: response } = await useAPI<
      ApiResponse<{
        list: Notification[];
        hasMore: boolean;
        cursor: string | null;
      }>
    >(`/api/user/notification`, {
      method: "GET",
      params: {
        cursor: cursor.value,
        limit: limit,
        unreadOnly: unreadOnly,
      },
    });

    if (response.value?.data) {
      if (cursor.value === "") {
        notifications.value = response.value.data.list;
      } else {
        notifications.value = [
          ...notifications.value,
          ...response.value.data.list,
        ];
      }
      hasMore.value = response.value.data.hasMore;
      cursor.value = response.value.data.cursor;
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
  } finally {
    isLoadMoreLoading.value = false;
  }
};

// Load more function
const loadMore = async () => {
  if (!isLoadMoreLoading.value && hasMore.value) {
    await loadNotifications();
  }
};

// Initial load
await loadNotifications();

const handleNotificationClick = async (notification: Notification) => {
  if (!notification.read) {
    await markAsRead([notification.id]);
  }
  navigateTo(notification.redirectUrl);
};

const handleTabChange = async () => {
  cursor.value = "";
  await loadNotifications(); // Reload notifications with new filter
};

const markAsRead = async (notificationIds: string[]) => {
  try {
    isLoading.value = true;
    const { data: response } = await notificationService.markAsRead(
      notificationIds
    );

    if (response.value?.code === 200) {
      // Cập nhật trạng thái đã đọc cho các thông báo
      notifications.value = notifications.value.map((notification) => {
        if (notificationIds.includes(notification.id)) {
          return {
            ...notification,
            read: true,
          };
        }
        return notification;
      });

      toast.success("Đã đánh dấu thông báo đã đọc");
    }
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    toast.error("Không thể đánh dấu thông báo đã đọc");
  } finally {
    isLoading.value = false;
  }
};

const markAllAsRead = async () => {
  const unreadNotifications = notifications.value
    .filter((n) => !n.read)
    .map((n) => n.id);

  if (unreadNotifications.length > 0) {
    await markAsRead(unreadNotifications);
  }
};

const notificationMenu = ref();
const selectedNotification = ref<Notification | null>(null);

// Show menu popover
const showMenu = async (event: MouseEvent, notification: Notification) => {
  await notificationMenu.value?.hide();
  selectedNotification.value = notification;
  await notificationMenu.value?.show(event);
};

// Delete notification
const deleteNotification = async (notificationId?: string) => {
  if (!notificationId) return;

  try {
    isLoading.value = true;
    const { data: response } = await useAPI<ApiResponse>(
      `/api/user/notification`,
      {
        method: "DELETE",
        body: {
          notificationIds: [notificationId],
        },
      }
    );

    if (response.value?.code === 200) {
      notifications.value = notifications.value.filter(
        (n) => n.id !== notificationId
      );
      selectedNotification.value = null;
      await notificationMenu.value?.hide();
      toast.success("Đã xóa thông báo");
    } else {
      toast.error(response.value?.message ?? "Không thể xóa thông báo");
    }
  } catch (error) {
    toast.error("Không thể xóa thông báo");
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.custom-panel {
  padding: 0.5rem !important;
}
</style>
