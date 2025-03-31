<template>
  <NoSidebarLayout>
    <div class="block md:flex h-full divide-x relative">
      <!-- Menu chat -->
      <div class="w-full lg:w-4/12 xl:w-3/12 h-full flex flex-col bg-white">
        <!-- Khung tìm kiếm -->
        <div class="p-5 flex-none sticky top-0 bg-white z-10">
          <div class="flex items-center justify-between">
            <div class="text-lg font-bold text-gray-700">Trò chuyện</div>
            <div class="flex gap-2 text-sm items-center">
              <div
                class="flex gap-1 items-center hover:text-blue-600 transition duration-300 ease-in-out cursor-pointer"
                @click="chatStore.showNewChatDialog = true"
              >
                <Icon name="tabler:plus" class="h-5 w-5"></Icon>
                Thêm
              </div>
              <!-- <HeadlessMenu as="div" class="relative inline-block text-left">
                <HeadlessMenuButton>
                  <div
                    class="flex gap-1 items-center hover:text-blue-600 transition duration-300 ease-in-out cursor-pointer"
                  >
                    <Icon name="tabler:filter" class="h-5 w-5"></Icon>
                    Bộ lọc
                  </div>
                </HeadlessMenuButton>
                <transition
                  enter-active-class="transition duration-100 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-75 ease-in"
                  leave-from-class="transform scale-100 opacity-100"
                  leave-to-class="transform scale-95 opacity-0"
                >
                  <HeadlessMenuItems
                    class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
                  >
                    <div class="p-2">
                      <HeadlessMenuItem v-slot="{ active }">
                        <NuxtLink
                          to="/messages"
                          :class="[
                            'flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full',
                          ]"
                        >
                          <Icon
                            name="fe:info"
                            class="h-6 w-6 text-gray-600"
                          ></Icon>
                          Đoạn chat
                        </NuxtLink>
                      </HeadlessMenuItem>
                      <HeadlessMenuItem v-slot="{ active }">
                        <div
                          :class="[
                            'flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full',
                          ]"
                        >
                          <Icon
                            name="material-symbols:delete-outline"
                            class="h-6 w-6 text-gray-600"
                          ></Icon>
                          Tin nhắn spam
                        </div>
                      </HeadlessMenuItem>
                    </div>
                  </HeadlessMenuItems>
                </transition>
              </HeadlessMenu> -->
            </div>
          </div>

          <InputGroup class="mt-2">
            <InputGroupAddon>
              <Icon name="tabler:search" class="w-6 h-6"></Icon>
            </InputGroupAddon>
            <InputText
              placeholder="Tìm kiếm đoạn chat"
              class="w-full border border-gray-300 rounded-3xl p-2 px-3 outline-none shadow-sm focus:border-gray-500 transition duration-300 ease-in-out"
            />
          </InputGroup>
        </div>

        <!-- Đoạn chat -->
        <div class="flex-1 overflow-auto">
          <div class="flex flex-col">
            <div class="p-2 px-5" v-if="!chatStore.conversations.length">
              Hiện chưa có hộp thoại nào.
            </div>
            <NuxtLink
              :to="`/conversations/${conversation.id}`"
              class="p-2 px-5 hover:bg-zinc-100 flex gap-4 cursor-pointer relative group justify-between"
              v-for="conversation in chatStore.conversations"
              :key="conversation.id"
              exactActiveClass="bg-zinc-100"
            >
              <div class="flex gap-4">
                <!-- AVATAR -->
                <div class="w-12 h-12 rounded-full bg-gray-300 relative">
                  <img
                    :src="conversation.iconUrl ?? DEFAULT_AVATAR_URL"
                    class="w-12 h-12 rounded-full"
                    alt="User Avatar"
                  />
                  <div
                    v-if="conversation.isOnline"
                    class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white"
                  ></div>
                </div>
                <!-- THÔNG TIN -->
                <div class="pt-1">
                  <div class="text-base text-gray-800">
                    {{ conversation.name }}
                  </div>
                  <div
                    class="text-sm text-gray-700"
                    v-if="
                      auth.user &&
                      conversation.lastMessage &&
                      conversation.lastMessage.sender.id == auth.user.id
                    "
                  >
                    Bạn:
                    {{
                      conversation.lastMessage.content
                        ? conversation.lastMessage.content
                        : conversation.lastMessage.files.length > 0
                        ? (() => {
                            const images =
                              conversation.lastMessage.files.filter(
                                (file) =>
                                  file.type === "image/png" ||
                                  file.type === "image/jpeg" ||
                                  file.type === "image/jpg"
                              );

                            // Kiểm tra loại file
                            if (images.length > 0) {
                              return `đã gửi ${conversation.lastMessage.files.length} ảnh`;
                            } else {
                              return `đã gửi ${conversation.lastMessage.files.length} file`;
                            }
                          })()
                        : conversation.lastMessage.sticker // Thêm kiểm tra sticker
                        ? "đã gửi 1 nhãn dán"
                        : conversation.lastMessage.isRevoked
                        ? "đã thu hồi tin nhắn"
                        : ""
                    }}
                  </div>
                  <div
                    class="text-sm text-gray-700"
                    v-else-if="conversation.lastMessage"
                  >
                    {{
                      conversation.lastMessage.content
                        ? conversation.lastMessage.content
                        : conversation.lastMessage.files.length > 0
                        ? (() => {
                            const images =
                              conversation.lastMessage.files.filter(
                                (file) =>
                                  file.type === "image/png" ||
                                  file.type === "image/jpeg" ||
                                  file.type === "image/jpg"
                              );

                            // Kiểm tra loại file
                            if (images.length > 0) {
                              return `đã gửi ${conversation.lastMessage.files.length} ảnh`;
                            } else {
                              return `đã gửi ${conversation.lastMessage.files.length} file`;
                            }
                          })()
                        : conversation.lastMessage.sticker // Thêm kiểm tra sticker
                        ? "đã gửi 1 nhãn dán"
                        : conversation.lastMessage.isRevoked
                        ? "đã thu hồi tin nhắn"
                        : ""
                    }}
                  </div>
                  <div class="text-sm text-gray-700" v-else>
                    Bất đầu trò chuyện
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-end">
                <!-- MENU -->
                <div class="flex items-center justify-end pr-2">
                  <HeadlessMenu
                    as="div"
                    class="relative inline-block text-left"
                  >
                    <div>
                      <HeadlessMenuButton
                        class="h-8 w-8 border hidden justify-center items-center bg-zinc-300 hover:bg-zinc-300 rounded-full group-hover:flex cursor-pointer transition duration-300 ease-in-out"
                      >
                        <Icon
                          name="ph:dots-three-vertical-bold"
                          class="text-xl text-gray-700"
                        ></Icon>
                      </HeadlessMenuButton>
                    </div>

                    <transition
                      enter-active-class="transition duration-100 ease-out"
                      enter-from-class="transform scale-95 opacity-0"
                      enter-to-class="transform scale-100 opacity-100"
                      leave-active-class="transition duration-75 ease-in"
                      leave-from-class="transform scale-100 opacity-100"
                      leave-to-class="transform scale-95 opacity-0"
                    >
                      <HeadlessMenuItems
                        class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50"
                      >
                        <div class="p-2">
                          <HeadlessMenuItem v-slot="{ active }">
                            <NuxtLink
                              :to="
                                conversation.otherParticipantId
                                  ? `/user/${conversation.otherParticipantId}`
                                  : ``
                              "
                              :class="[
                                'flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full',
                              ]"
                            >
                              <Icon
                                name="fe:info"
                                class="text-2xl text-gray-600"
                              ></Icon>
                              Xem trang cá nhân
                            </NuxtLink>
                          </HeadlessMenuItem>
                          <HeadlessMenuItem v-slot="{ active }">
                            <div
                              :class="[
                                'flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full',
                              ]"
                              @click="
                                chatStore.markMessageAsRead(conversation.id, [
                                  conversation.lastMessage?.id,
                                ])
                              "
                            >
                              <Icon
                                name="tabler:message-check"
                                class="text-2xl text-gray-600"
                              ></Icon>
                              Đánh dấu đã đọc
                            </div>
                          </HeadlessMenuItem>
                          <!-- <HeadlessMenuItem v-slot="{ active }">
                            <div
                              :class="[
                                'flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full',
                              ]"
                            >
                              <Icon
                                name="tabler:user-cancel"
                                class="text-2xl text-gray-600"
                              ></Icon>
                              Chặn
                            </div>
                          </HeadlessMenuItem> -->
                        </div>
                      </HeadlessMenuItems>
                    </transition>
                  </HeadlessMenu>
                </div>

                <div
                  v-if="
                    auth.user &&
                    conversation.lastMessage &&
                    !conversation.lastMessage.isRead &&
                    conversation.lastMessage.sender.id != auth.user.id
                  "
                  class="w-2 h-2 bg-blue-500 rounded-full self-center"
                ></div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Nội dung chat -->
      <div>
        <NuxtPage />
      </div>

      <!-- Import Component -->
      <NewChat></NewChat>
    </div>
  </NoSidebarLayout>
</template>

<script setup lang="ts">
import NewChat from "~/components/Messesage/NewChat.vue";
import { useBreakpoint } from "~/composables/useBreakpoint";
import NoSidebarLayout from "~/layouts/nosidebar.vue";

const { isMd, isLg } = useBreakpoint();

const chatStore = useChatStore();
const auth = useAuth();
const route = useRoute();

watch(
  () => route.params.id,
  async (newVal) => {
    if (newVal) {
      await chatStore.resetChat();

      await Promise.all([
        chatStore.fetchConversation(newVal as string),
        chatStore.fetchMessages(newVal as string),
      ]);
    }
  }
);

import type { ApiResponse } from "~/types/api";
import {
  DEFAULT_AVATAR_URL,
  type Conversation,
  type Message,
} from "~/types/model";

async function fetchConversations() {
  const { data } = await useAPI<
    ApiResponse<{
      list: Conversation[];
    }>
  >("/api/conversations", {
    method: "GET",
  });

  if (data.value?.code == 200) {
    // if (data.value.data.list.length > 0) {
    //   chatStore.currentConversationId = data.value.data.list[0].id;
    //   router.push(`/conversations/${data.value.data.list[0].id}`);
    // }
    chatStore.conversations = data.value.data.list;
  }
}

onMounted(() => {
  if (!route.params.id) {
    // chatStore.showChatMessage = false;
  }
});

await fetchConversations();
if (route.params.id) {
  if (import.meta.server) {
    await Promise.all([
      chatStore.fetchConversation(route.params.id as string),
      chatStore.fetchMessages(route.params.id as string),
    ]);
  }
} else {
  chatStore.chatPartnerInfo = null;
}
</script>

<style scoped></style>
