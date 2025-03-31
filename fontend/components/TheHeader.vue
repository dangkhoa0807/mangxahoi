<template>
  <div>
    <header
      class="bg-white border-b border-gray-300 w-full h-16 flex items-center"
    >
      <div class="flex justify-between items-center px-8 gap-3 w-full">
        <!-- Logo or Brand Name -->
        <div class="flex items-center gap-3">
          <div
            class="md:hidden flex items-center cursor-pointer"
            @click="visible = true"
          >
            <Icon name="tabler:menu-2" class="text-2xl"></Icon>
          </div>
          <NuxtLink
            to="/"
            class="text-xl font-bold text-gray-700 sm:block hidden"
            >TWOK</NuxtLink
          >
        </div>
        <SearchTablet></SearchTablet>

        <!-- Nav Links (hidden on mobile, visible on desktop) -->
        <nav class="flex items-center gap-3 text-gray-800" v-if="auth.user">
          <div
            class="cursor-pointer h-9 w-9 sm:h-10 sm:w-10 bg-gray-100 hover:bg-gray-200 rounded-full flex justify-center items-center md:hidden"
            @click="visibleSearch = true"
          >
            <Icon
              name="tabler:search"
              class="text-lg sm:text-2xl text-gray-600"
            ></Icon>
          </div>

          <searchMobile v-model="visibleSearch"></searchMobile>

          <NuxtLink
            class="cursor-pointer h-9 w-9 sm:h-10 sm:w-10 bg-gray-100 hover:bg-gray-200 rounded-full flex justify-center items-center"
            @click="createPost.showDialog()"
          >
            <Icon name="tabler:pencil-plus" class="text-lg sm:text-2xl"></Icon>
          </NuxtLink>
          <div class="relative">
            <NuxtLink
              to="/conversations"
              class="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 bg-gray-100 hover:bg-gray-200 rounded-full flex justify-center items-center"
            >
              <Icon
                name="tabler:message"
                class="text-lg sm:text-2xl text-gray-600"
              ></Icon>
            </NuxtLink>
            <div
              v-if="unReadMessageCount > 0"
              class="absolute top-[-0.2rem] right-[-0.2rem] w-4 h-4 bg-red-500 rounded-full text-xs flex justify-center items-center text-white"
            >
              {{ unReadMessageCount }}
            </div>
          </div>
          <HeadlessPopover v-slot="{ open }" class="relative">
            <HeadlessPopoverButton
              class="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 bg-gray-100 hover:bg-gray-200 rounded-full flex justify-center items-center relative outline-none"
            >
              <Icon
                name="tabler:bell"
                class="text-lg sm:text-2xl text-gray-600"
              ></Icon>
              <div
                v-if="unreadNotificationCount > 0"
                class="absolute top-[-0.2rem] right-[-0.2rem] w-4 h-4 bg-red-500 rounded-full text-xs flex justify-center items-center text-white"
              >
                {{ unreadNotificationCount }}
              </div>
            </HeadlessPopoverButton>

            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <HeadlessPopoverPanel
                class="absolute right-0 mt-2 w-80 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50"
              >
                <div class="flex flex-col p-2 px-3">
                  <div class="font-semibold">Thông báo</div>
                  <div class="max-h-[31rem] overflow-y-auto">
                    <div class="flex flex-col my-2 gap-2">
                      <div v-if="!notifications.length">
                        <div class="text-center text-sm text-gray-500">
                          Không có thông báo nào
                        </div>
                      </div>
                      <div
                        v-if="notifications.length > 0"
                        v-for="notification in notifications"
                        @click="handleNotificationClick(notification)"
                        class="grid grid-cols-10 gap-3 p-2 hover:bg-zinc-100 rounded-md cursor-pointer border"
                      >
                        <div class="col-span-2">
                          <img
                            class="w-full border rounded-full"
                            :src="
                              notification.sender.profile.avatarUrl ??
                              `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
                            "
                            alt="Avatar"
                          />
                        </div>
                        <div class="col-span-8 line-clamp-3 flex gap-2">
                          <div>
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
                                v-else-if="
                                  notification.type == 'group_join_accepted'
                                "
                              >
                                đã chấp nhận yêu cầu tham gia nhóm của bạn
                              </span>
                              <span
                                v-else-if="
                                  notification.type == 'group_join_rejected'
                                "
                              >
                                đã từ chối yêu cầu tham gia nhóm của bạn
                              </span>
                              <span v-else-if="notification.type == 'new_post'">
                                đã đăng bài viết mới
                              </span>
                              <span
                                v-else-if="notification.type == 'comment_like'"
                              >
                                đã thích bình luận của bạn
                              </span>
                            </div>
                            <FromNow
                              class="text-xs text-gray-500"
                              :datetime="notification.createdAt"
                            ></FromNow>
                          </div>

                          <div
                            v-if="!notification.read"
                            class="w-2 h-2 shrink-0 bg-blue-500 rounded-full self-center"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <NuxtLink
                    v-if="notifications.length"
                    to="/notifications"
                    class="hover:text-blue-500 cursor-pointer w-fit"
                  >
                    Xem tất cả
                  </NuxtLink>
                </div>
              </HeadlessPopoverPanel>
            </transition>
          </HeadlessPopover>
          <HeadlessPopover v-slot="{ open }" class="relative">
            <HeadlessPopoverButton class="w-8 h-8 cursor-pointer rounded-full">
              <img
                class="w-full h-full rounded-full"
                :src="auth.user.profile.avatarUrl ?? DEFAULT_AVATAR_URL"
                alt="Avatar"
              />
            </HeadlessPopoverButton>

            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <HeadlessPopoverPanel
                class="absolute right-0 mt-2 w-[15rem] origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50"
              >
                <div class="flex flex-col p-3">
                  <NuxtLink
                    :to="`/user/${auth.user.id}`"
                    class="grid grid-cols-12 gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                  >
                    <img
                      class="w-full col-span-3 rounded-full"
                      :src="
                        auth.user.profile.avatarUrl ??
                        `https://s3.cloudfly.vn/shoperis/2024/11/7600f42b44f0f1498afdae15fe2a8a84.avif`
                      "
                      alt="Avatar"
                    />
                    <div class="col-span-9">
                      <div class="text-gray-800 truncate">
                        {{ auth.user.profile.name }}
                      </div>
                      <div class="text-sm truncate">
                        {{
                          auth.user.profile.user
                            ? `@${auth.user.profile.user}`
                            : `@${auth.user.id}`
                        }}
                      </div>
                    </div>
                  </NuxtLink>

                  <hr class="my-2" />

                  <NuxtLink
                    to="/settings/account"
                    class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                  >
                    <Icon name="tabler:settings" class="text-2xl"></Icon>
                    Cài đặt
                  </NuxtLink>

                  <div
                    class="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                    @click="auth.signOut()"
                  >
                    <Icon name="tabler:logout" class="text-2xl"></Icon>
                    Đăng xuất
                  </div>
                </div>
              </HeadlessPopoverPanel>
            </transition>
          </HeadlessPopover>
        </nav>
        <nav class="flex items-center space-x-4" v-else>
          <Button label="Đăng nhâp" @click="isVisibleLogin = true"></Button>
        </nav>
      </div>

      <!-- Dialog -->
      <Login
        v-model="isVisibleLogin"
        @show-register="isVisibleRegister = true"
        @show-forget-password="isVisibleForgetPassword = true"
      ></Login>
      <Register
        v-model="isVisibleRegister"
        @show-login="isVisibleLogin = true"
      ></Register>
      <ForgetPassword
        v-model="isVisibleForgetPassword"
        @show-login="isVisibleLogin = true"
      ></ForgetPassword>
      <PostDialog></PostDialog>
    </header>

    <Drawer v-model:visible="visible" header="TWOK">
      <Sidebar class="w-full"></Sidebar>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from "~/types/api";
import Login from "./Dialog/Login.vue";
import Register from "./Dialog/Register.vue";
import ForgetPassword from "./Dialog/ForgetPassword.vue";
import SearchTablet from "./search/SearchTablet.vue";
import { DEFAULT_AVATAR_URL, type Notification } from "~/types/model";
import Sidebar from "./Sidebar.vue";
import searchMobile from "./search/searchMobile.vue";
import FromNow from "./FromNow.vue";
import { notificationService } from "~/services/notification";
import PostDialog from "./Post/Dialog.vue";
const createPost = useCreatePost();
const auth = useAuth();
const visibleSearch = ref(false);
const { $notificationSound } = useNuxtApp();

const visible = ref(false);

onMounted(() => {
  $notificationSound.preloadSound("message", "/assets/sound/message.mp3");
  $notificationSound.preloadSound(
    "notification",
    "/assets/sound/notification.mp3"
  );

  useListen("setUnreadMessage", (data) => {
    console.log(data);
    unReadMessageCount.value = data as number;
  });
});

onUnmounted(() => {
  removeListen("setUnreadMessage");
});

const router = useRouter();

// Thông báo
const notifications = ref<Notification[]>([]);
const unreadNotificationCount = ref(0);
const unReadMessageCount = ref(0);
const limit = ref(8);

// Tải thông báo
async function fetchNotifications() {
  const { data: responseNotification } = await useAPI<
    ApiResponse<{
      list: Notification[];
      unreadCount: number;
      hasMore: boolean;
    }>
  >("/api/user/notification", {
    method: "get",
    params: { limit: limit.value },
  });
  if (responseNotification.value?.code == 200) {
    notifications.value = responseNotification.value.data.list;
    unreadNotificationCount.value = responseNotification.value.data.unreadCount;
  }
}

async function fetchCounterUnread() {
  const { data } = await useAPI<
    ApiResponse<{
      unreadConversations: number;
      unreadNotifications: number;
    }>
  >("/api/counter/unread", {
    method: "get",
  });

  if (data.value?.code == 200) {
    unReadMessageCount.value = data.value.data.unreadConversations;
    unreadNotificationCount.value = data.value.data.unreadNotifications;
  }
}

// Xử lý click thông báo
async function handleNotificationClick(notification: Notification) {
  // Đánh dấu đã đọc trước
  const { data: response } = await notificationService.markAsRead([
    notification.id,
  ]);

  if (response.value?.code == 200) {
    notifications.value = notifications.value.map((n) => {
      if (n.id === notification.id) {
        return { ...n, read: true };
      }
      return n;
    });
    unreadNotificationCount.value = unreadNotificationCount.value - 1;

    // Kiểm tra nếu là thông báo bình luận với ID bài viết và ID bình luận
    if (notification.type === "comment" && notification.redirectUrl) {
      const match = notification.redirectUrl.match(/\/post\/([^?]+)\?id=(.+)/);
      if (match) {
        const postId = match[1];
        const commentId = match[2];
        useEvent("openPostModal", { postId, commentId });
        return;
      }
    } else if (notification.type == "like" && notification.redirectUrl) {
      const match = notification.redirectUrl.match(/\/post\/([^?]+)/);

      if (match) {
        const postId = match[1];
        useEvent("openPostModal", { postId });
        return;
      }
    } else if (notification.type == "new_post" && notification.redirectUrl) {
      const match = notification.redirectUrl.match(/\/post\/([^?]+)/);
      if (match) {
        const postId = match[1];
        useEvent("openPostModal", { postId });
        return;
      }
    } else if (notification.type == "comment_like") {
      const match = notification.redirectUrl.match(/\/post\/([^?]+)/);
      if (match) {
        const postId = match[1];
        useEvent("openPostModal", { postId });
        return;
      }
    }

    // For other notifications, redirect as usual
    router.push(notification.redirectUrl);
  } else {
    toast.error("Đánh dấu thông báo thất bại");
  }
}

await Promise.all([fetchNotifications(), fetchCounterUnread()]);

const isVisibleLogin = ref(false);
const isVisibleRegister = ref(false);
const isVisibleForgetPassword = ref(false);

const chatStore = useChatStore();
const toast = useToast();

let isAuthenticated = false;

const config = useRuntimeConfig();

const isAuthenticating = ref(false);

const webSocket = useWebSocket(`${config.public.WS_DOMAIN}/api/ws/twok`, {
  onConnected(ws) {
    ws.onmessage = async (event) => {
      chatStore.setWebSocket(ws);
      try {
        const response = JSON.parse(event.data);

        // Xử lý yêu cầu xác thực
        if (response.code == 101 || response.code == 401) {
          if (isAuthenticating.value) {
            return;
          }

          try {
            isAuthenticating.value = true;

            if (isAuthenticated) {
              await auth.refreshTokens();
            }

            const token = auth.getAccessToken();
            if (token) {
              webSocket.send(JSON.stringify({ action: "auth", token }));
            }

            isAuthenticated = false;
          } finally {
            isAuthenticating.value = false;
          }
        }

        // Xử lý khi xác thực thành công
        if (response.code == 200) {
          console.log("WebSocket authenticated successfully");
        }

        // Nhận tin nhắn mới
        if (response.code == 201) {
          chatStore.handleNewMessage(response.data, response.requestId);
        }

        // Thu hồi tin nhắn
        if (response.code == 202) {
          chatStore.handleRevokeMessage(
            response.data.conversationId,
            response.data.messageId
          );
        }

        // Cập nhật trạng thái online của cuộc trò chuyện
        if (response.code == 204) {
          chatStore.handleConversationOnline(response.data.userId, false);
        }

        if (response.code == 205) {
          chatStore.handleConversationOnline(response.data.userId, true);
        }

        // Đánh dấu tin nhắn đã đọc
        if (response.code == 203) {
          chatStore.handleMarkMessageAsRead(
            response.data.conversationId,
            response.data.messageIds
          );
        }

        // Gửi tin nhắn thất bại
        if (response.code == -204) {
          toast.error(response.message);
          chatStore.handleSendMessageError(
            response.data.conversationId,
            response.data.messageId
          );
        }

        // Xử lý thông báo
        if (response.type == "notification") {
          // Thông báo mới
          if (response.code == 200) {
            const newNotification = [
              response.data,
              ...notifications.value.slice(0, limit.value - 1),
            ];
            notifications.value = newNotification;
            unreadNotificationCount.value = unreadNotificationCount.value + 1;
            $notificationSound.playSound("notification");
          }
        }

        // Xử lý realtime bình luận
        if (response.type == "comment") {
          // Xử lý bình luận mới
          if (response.code == 200) {
            useEvent("newComment", response.data);
          }

          // Xử lý chỉnh sửa bình luận
          if (response.code == 202) {
            useEvent("updateComment", response.data);
          }

          // Xử lý xoá bình luận
          if (response.code == 204) {
            useEvent("deleteComment", response.data);
          }
        }

        // Xử lý tin nhắn chưa đọc
        if (response.type == "unreadMessageCounter") {
          unReadMessageCount.value = response.data;
        }
      } catch (error) {
        console.error("WebSocket message parsing error:", error);
      }
    };
  },
});
</script>

<style scoped></style>
