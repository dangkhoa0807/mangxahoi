<template>
  <div class="flex h-full bg-gray-100 relative divide-x" v-if="auth.user">
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <header class="bg-white shadow p-4 flex items-center justify-between">
        <div class="flex gap-2 items-center">
          <div
            class="w-8 h-8 hover:bg-zinc-200 justify-center items-center rounded-full cursor-pointer flex lg:hidden"
            @click="chatStore.chatPartnerInfo = null"
          >
            <Icon name="tabler:arrow-left" class="text-xl"></Icon>
          </div>
          <div
            class="flex items-center hover:bg-zinc-200 p-1 px-2 cursor-pointer rounded-md transition duration-150 ease-in-out"
          >
            <img
              class="w-10 h-10 rounded-full"
              :src="chatStore.getConversationAvatar() ?? DEFAULT_AVATAR_URL"
              alt="User Avatar"
            />
            <NuxtLink
              :to="`/user/${chatStore.chatPartnerInfo?.id}`"
              class="ml-2"
            >
              <h1 class="text-lg font-semibold">
                {{ chatStore.getConversationName() }}
              </h1>
              <p class="text-sm text-gray-500">
                {{
                  chatStore.isPartnerOnline ? "Đang hoạt động" : "Đang offline"
                }}
              </p>
            </NuxtLink>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <div
            class="cursor-pointer border rounded-lg p-2 hover:bg-blue-500/30 hover:text-blue-700 hover:border-blue-100 transition duration-300 ease-in-out"
            aria-label="Xem thêm"
            @click="togglePersonalInfo"
          >
            <div class="w-5 h-5">
              <Icon name="tabler:info-hexagon" class="text-xl"></Icon>
            </div>
          </div>
        </div>
      </header>

      <!-- Nội dung chính -->
      <div class="flex-1 overflow-auto p-4" ref="messageContainer">
        <!-- Nút tải thêm tin nhắn -->
        <div v-if="chatStore.chatHasMore" class="flex justify-center mb-4">
          <button
            @click="chatStore.fetchMessages(route.params.id as string)"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-150 ease-in-out"
            :disabled="chatStore.isLoadingMore"
          >
            {{ chatStore.isLoadingMore ? "Đang tải..." : "Tải thêm tin nhắn" }}
          </button>
        </div>

        <!-- Nội dung chat -->
        <div class="space-y-4">
          <div v-if="chatStore.chatMessages.length == 0" class="text-center">
            <div>
              {{
                chatStore.isLoading
                  ? "Đang tải tin nhắn..."
                  : "Không có tin nhắn nào."
              }}
            </div>
          </div>

          <!-- Tin nhắn -->
          <div
            v-for="(message, index) in chatStore.chatMessages"
            :key="index"
            class="flex items-start group"
            :class="message.sender.id == auth.user.id ? 'justify-end' : ''"
          >
            <div
              class="mr-2 flex flex-col gap-1"
              :class="
                message.sender.id == auth.user.id ? 'items-end' : 'items-start'
              "
            >
              <div class="flex gap-2 items-end">
                <img
                  v-if="message.sender.id != auth.user.id"
                  class="w-10 h-10 rounded-full"
                  :src="chatStore.getConversationAvatar() ?? DEFAULT_AVATAR_URL"
                  alt="User Avatar"
                />

                <div>
                  <div
                    class="flex items-center gap-2"
                    :class="
                      message.sender.id == auth.user.id
                        ? 'flex-row-reverse'
                        : ''
                    "
                  >
                    <div>
                      <!-- Nội dung tin nhắn -->
                      <div
                        v-if="message.content"
                        class="flex flex-col"
                        :class="
                          message.sender.id == auth.user.id
                            ? 'items-end'
                            : 'items-start'
                        "
                      >
                        <div
                          class="p-2 px-3 rounded-xl w-fit max-w-5xl"
                          style="white-space: pre-wrap; word-break: break-word"
                          :class="
                            message.sender.id == auth.user.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-zinc-300 text-gray-700'
                          "
                        >
                          {{ message.content }}
                        </div>
                      </div>

                      <!-- Hiển thị ảnh nếu có -->
                      <div
                        v-if="message.content !== '[Tin nhắn đã bị thu hồi]'"
                      >
                        <div
                          v-if="message.files && message.files.length"
                          class="flex flex-col gap-2 mt-2"
                        >
                          <!-- Hiển thị từng file -->
                          <div v-for="file in message.files" :key="file.url">
                            <!-- Hiển thị ảnh -->
                            <img
                              v-if="file.type.includes('image')"
                              :src="file.url"
                              alt="Uploaded Image"
                              class="max-w-xs max-h-64 rounded-lg shadow-md"
                            />

                            <!-- Hiển thị documents -->
                            <a
                              v-else
                              :href="file.url"
                              target="_blank"
                              class="flex items-center p-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              <!-- Icon dựa vào loại file -->
                              <Icon
                                :name="getFileIcon(file.name)"
                                class="text-xl mr-2"
                              />

                              <!-- Thông tin file -->
                              <div class="flex flex-col">
                                <span class="text-sm font-medium">{{
                                  file.name
                                }}</span>
                                <span class="text-xs text-gray-500">{{
                                  formatFileSize(file.size)
                                }}</span>
                              </div>
                            </a>
                          </div>
                        </div>
                      </div>

                      <div v-if="message.sticker && !message.isRevoked">
                        <img
                          :src="message.sticker.url"
                          alt="Sticker"
                          class="w-24 h-fit object-cover"
                        />
                      </div>
                    </div>

                    <!-- Menu thao tác -->
                    <div
                      v-if="
                        message.sender.id == auth.user.id && !message.isRevoked
                      "
                      @click="showMenuMessage($event, message)"
                      class="h-6 w-6 justify-center items-center hover:bg-zinc-200 rounded-full flex opacity-0 group-hover:opacity-100 cursor-pointer transition duration-150 ease-in-out"
                      :class="{
                        'opacity-100 bg-zinc-200':
                          selectedMessage?.id == message.id,
                      }"
                    >
                      <Icon
                        name="ph:dots-three-vertical-bold"
                        class="text-xl text-gray-700"
                      ></Icon>
                    </div>
                  </div>
                  <div
                    v-if="message.status == 'pending'"
                    class="flex items-center gap-2 justify-end mt-2"
                  >
                    <div class="text-sm text-gray-500">Đang gửi...</div>
                  </div>
                  <div v-else-if="message.status == 'error'">
                    <div class="text-sm text-red-500">
                      Gửi tin nhắn thất bại
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Message Input -->
      <div
        class="bg-white p-4 flex flex-col gap-2"
        v-if="chatStore.canMessage && !chatStore.isBlocking"
      >
        <!-- Hiển thị ảnh đã chọn  -->
        <div v-if="imagePreviews.length" class="flex space-x-2">
          <div
            v-for="(image, index) in imagePreviews"
            :key="index"
            class="relative w-10 h-10 border rounded-md"
          >
            <img
              :src="image.preview"
              alt="Image Preview"
              class="w-full h-full object-cover rounded-md"
            />
            <!-- Nút xoá ảnh -->
            <button
              class="absolute top-0 right-0 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center"
              @click="removeImage(index)"
            >
              <Icon name="tabler:x" class="text-xs"></Icon>
            </button>
          </div>
        </div>

        <!-- Hiển thị file đã chọn -->
        <div v-if="filePreviews.length" class="flex space-x-2">
          <div
            v-for="(preview, index) in filePreviews"
            :key="index"
            class="relative flex items-center p-2 bg-gray-100 rounded-md"
          >
            <!-- Hiển thị icon tùy theo loại file -->
            <Icon
              :name="
                preview.type.includes('pdf')
                  ? 'mdi:file-pdf-box'
                  : 'mdi:file-document-outline'
              "
              class="text-xl mr-2"
            />

            <!-- Tên file -->
            <span class="text-sm truncate max-w-[150px]">
              {{ preview.preview }}
            </span>

            <!-- Nút xóa -->
            <button
              class="ml-2 text-red-500 hover:text-red-700"
              @click="removeFile(index)"
            >
              <Icon name="tabler:x" class="text-xs"></Icon>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="relative">
            <div
              class="cursor-pointer border rounded-lg p-2 text-gray-700 hover:bg-blue-500/30 hover:text-blue-700 hover:border-blue-100 transition duration-300 ease-in-out"
              @click="documentInput.click()"
            >
              <div class="w-5 h-5">
                <Icon
                  name="material-symbols:attach-file"
                  class="text-xl"
                ></Icon>
              </div>
            </div>
          </div>
          <div class="relative">
            <div
              class="cursor-pointer border rounded-lg p-2 text-gray-700 hover:bg-blue-500/30 hover:text-blue-700 hover:border-blue-100 transition duration-300 ease-in-out"
              @click="fileInput.click()"
            >
              <div class="w-5 h-5">
                <Icon name="la:image" class="text-xl"></Icon>
              </div>
            </div>
          </div>
          <HeadlessPopover class="relative">
            <HeadlessPopoverButton
              class="cursor-pointer border rounded-lg p-2 outline-none text-gray-700 hover:bg-blue-500/30 hover:text-blue-700 hover:border-blue-100 transition duration-300 ease-in-out"
              aria-label="Chọn biểu tượng cảm xúc"
            >
              <div class="w-5 h-5">
                <Icon name="tabler:sticker-2" class="text-xl"></Icon>
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
                class="absolute bottom-full mb-2 left-0 z-10 w-80 bg-white rounded-lg shadow-sm border"
              >
                <KeepAlive>
                  <StickerComponent
                    @select="(sticker) => sendMessage(sticker)"
                  />
                </KeepAlive>
              </HeadlessPopoverPanel>
            </transition>
          </HeadlessPopover>
          <HeadlessPopover class="relative">
            <HeadlessPopoverButton
              class="cursor-pointer border rounded-lg p-2 outline-none text-gray-700 hover:bg-blue-500/30 hover:text-blue-700 hover:border-blue-100 transition duration-300 ease-in-out"
              aria-label="Chọn biểu tượng cảm xúc"
            >
              <div class="w-5 h-5">
                <Icon name="tabler:mood-smile" class="text-xl"></Icon>
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
                class="absolute bottom-full mb-2 left-0 z-10"
              >
                <EmojiPicker :native="true" @select="onSelectEmoji" />
              </HeadlessPopoverPanel>
            </transition>
          </HeadlessPopover>
          <div class="flex-1 border rounded-lg">
            <div class="flex flex-col">
              <div>
                <!-- Input ẩn để chọn file ảnh -->
                <input
                  type="file"
                  accept="image/*"
                  @change="onFileChange"
                  class="hidden"
                  ref="fileInput"
                />

                <!-- Input file ẩn -->
                <input
                  type="file"
                  ref="documentInput"
                  @change="onDocumentChange"
                  multiple
                  class="hidden"
                  accept=".doc,.docx,.pdf,.txt,.xls,.xlsx"
                />
              </div>
            </div>
            <!-- Input tin nhắn -->
            <input
              type="text"
              v-model="newMessage"
              @keyup.enter="sendMessage()"
              placeholder="Nhập tin nhắn..."
              class="flex-1 outline-none w-full p-2"
            />
          </div>

          <div class="relative">
            <div
              class="border rounded-lg p-2 text-gray-400 hover:border-blue-100 transition duration-300 ease-in-out"
              :class="{
                'text-gray-700 cursor-pointer':
                  newMessage.trim() || selectedFiles.length,
              }"
              @click="sendMessage()"
            >
              <div class="w-5 h-5">
                <Icon name="tabler:send" class="text-xl"></Icon>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else-if="chatStore.isBlocking"
        class="bg-white p-4 flex flex-col gap-2"
      >
        <div class="text-center mt-2">Hiện bạn đã chặn người dùng này.</div>
        <button
          @click="unblockUser(chatStore.chatPartnerInfo?.id ?? '')"
          class="bg-blue-500 text-white p-2 rounded-md"
        >
          Bỏ chặn
        </button>
      </div>
      <div v-else class="bg-white p-4 flex flex-col gap-2">
        <div class="text-center mt-2">
          Hiện bạn không thể trò chuyện với người dùng này.
        </div>
      </div>
    </div>

    <!-- Sidebar for Personal Info -->
    <div
      v-if="chatStore.showPersonalInfo"
      class="fixed lg:relative lg:w-96 lg:h-full lg:right-0 inset-0 bg-white p-4 z-50 transition-transform transform lg:translate-x-0 pt-[75px] lg:pt-0"
      :class="{
        'translate-x-0': chatStore.showPersonalInfo,
        'translate-x-full lg:translate-x-0': !chatStore.showPersonalInfo,
      }"
    >
      <div class="relative h-full">
        <!-- Nút đóng Sidebar -->
        <button
          @click="togglePersonalInfo"
          class="absolute left-0 top-4 lg:left-auto lg:right-0"
        >
          <div
            class="w-8 h-8 hover:bg-zinc-200 lg:flex justify-center items-center rounded-full cursor-pointer hidden"
          >
            <Icon name="tabler:x" class="text-xl"></Icon>
          </div>
          <div
            class="w-8 h-8 hover:bg-zinc-200 lg:hidden flex justify-center items-center rounded-full cursor-pointer"
          >
            <Icon name="tabler:arrow-left" class="text-xl"></Icon>
          </div>
        </button>

        <div class="flex items-center justify-center pt-12">
          <img
            class="w-20 h-20 rounded-full"
            :src="chatStore.getConversationAvatar() ?? DEFAULT_AVATAR_URL"
            alt="User Avatar"
          />
        </div>
        <p class="text-center mt-2">
          <strong>{{ chatStore.getConversationName() }}</strong>
        </p>
        <!-- <p class="text-center text-sm text-gray-500">Đang hoạt động</p> -->

        <div class="flex flex-col items-center mt-3">
          <HeadlessRadioGroup
            v-model="selectedOption"
            class="grid grid-cols-3 gap-3 w-full mt-3"
          >
            <!-- <div
              class="bg-zinc-400/30 text-zinc-700 flex flex-col items-center p-2 pt-3 rounded-md gap-1 cursor-pointer hover:bg-blue-500 hover:text-white"
            >
              <Icon name="tabler:bell-cog" class="text-2xl"></Icon>
              <span class="truncate">Thông báo</span>
            </div> -->
            <HeadlessRadioGroupOption
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              class="focus:outline-none"
            >
              <template #default="{ checked }">
                <div
                  :class="[
                    checked
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-400/30 text-zinc-700',
                    'flex flex-col items-center p-2 pt-3 rounded-md cursor-pointer gap-1',
                  ]"
                >
                  <Icon :name="option.icon" class="text-2xl" />
                  <span class="truncate">{{ option.label }}</span>
                </div>
              </template>
            </HeadlessRadioGroupOption>
          </HeadlessRadioGroup>

          <div v-if="selectedOption == 'media'" class="w-full">
            <Tabs value="0" class="mt-2 text-base" style="font-size: 0.9rem">
              <TabList>
                <Tab value="0" style="padding: 10px">Hình ảnh</Tab>
                <Tab value="1" style="padding: 10px">Tệp tin</Tab>
              </TabList>
              <TabPanels style="padding: 0" class="mt-4">
                <TabPanel value="0">
                  <div class="grid grid-cols-3 gap-3" v-if="files.length">
                    <div
                      v-for="image in images"
                      :key="image.id"
                      class="overflow-hidden aspect-square cursor-pointer hover:opacity-80"
                    >
                      <ImageVue
                        class="w-full aspect-square object-cover rounded-md"
                        alt="Thumbs"
                        format="avif"
                        quality="80"
                        preview
                      >
                        <template #image>
                          <img
                            :src="image.url"
                            alt="image"
                            class="w-full max-h-600px object-cover rounded-sm"
                          />
                        </template>
                        <template #preview="slotProps">
                          <img
                            class="container w-full rounded-sm"
                            :src="image.url"
                            alt="preview"
                            :style="slotProps.style"
                          />
                        </template>
                      </ImageVue>
                    </div>
                  </div>
                  <div v-else class="text-center">
                    Hiện chưa có hình ảnh nào.
                  </div>
                </TabPanel>
                <TabPanel value="1">
                  <div v-if="files.length === 0">Hiện chưa có tệp tin nào.</div>
                  <div v-else>
                    <div v-for="file in files" :key="file.url" class="mt-2">
                      <!-- Hiển thị ảnh -->
                      <img
                        v-if="file.type.includes('image')"
                        :src="file.url"
                        alt="Uploaded Image"
                        class="max-w-xs max-h-64 rounded-lg shadow-md"
                      />

                      <!-- Hiển thị documents -->
                      <a
                        v-else
                        :href="file.url"
                        target="_blank"
                        class="flex items-center p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <!-- Icon dựa vào loại file -->
                        <Icon
                          :name="getFileIcon(file.name)"
                          class="text-xl mr-2"
                        />

                        <!-- Thông tin file -->
                        <div class="flex flex-col">
                          <span class="text-sm font-medium">{{
                            file.name
                          }}</span>
                          <span class="text-xs text-gray-500">{{
                            formatFileSize(file.size)
                          }}</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </div>
          <div v-else-if="selectedOption == 'settings'" class="w-full">
            <div class="w-full mt-3">
              <hr />

              <div class="flex flex-col mt-3">
                <div
                  class="flex gap-3 cursor-pointer"
                  @click="blockUser(chatStore.chatPartnerInfo?.id ?? '')"
                  v-if="!chatStore.isBlocking"
                >
                  <div
                    class="w-11 h-11 rounded-lg bg-zinc-200 flex justify-center items-center"
                  >
                    <Icon name="tabler:user-cancel" class="text-lg"></Icon>
                  </div>
                  <div>
                    <div>Chặn người dùng</div>
                    <div class="text-sm text-zinc-600">
                      Ngừng liên lạc với người dùng này
                    </div>
                  </div>
                </div>
                <div
                  class="flex gap-3 cursor-pointer"
                  @click="unblockUser(chatStore.chatPartnerInfo?.id ?? '')"
                  v-else
                >
                  <div
                    class="w-11 h-11 rounded-lg bg-zinc-200 flex justify-center items-center"
                  >
                    <Icon name="tabler:user-check" class="text-lg"></Icon>
                  </div>
                  <div>
                    <div>Bỏ chặn người dùng</div>
                    <div class="text-sm text-zinc-600">
                      Bạn có thể trò chuyện với người dùng này
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Popover ref="menuMessage" @hide="selectedMessage = null">
      <div class="w-48" v-if="selectedMessage">
        <!-- <NuxtLink
          :class="[
            'flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full',
          ]"
        >
          <Icon name="fe:info" class="text-2xl text-gray-600"></Icon>
          Chỉnh sửa
        </NuxtLink> -->
        <div
          :class="[
            'flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer w-full',
          ]"
          @click="chatStore.revokeMessage(selectedMessage?.id ?? '')"
        >
          <Icon
            name="material-symbols:delete-outline"
            class="text-2xl text-gray-600"
          ></Icon>
          Thu hồi
        </div>
      </div>
      <div class="w-48" v-else>
        <div>Không có tin nhắn nào để chỉnh sửa</div>
      </div>
    </Popover>
  </div>
  <div v-else>
    <div class="text-center mt-3">Không tìm thấy hộp thoại</div>
  </div>
</template>

<script setup lang="ts">
import ImageVue from "primevue/image";
import type { ApiResponse } from "~/types/api";
import {
  type Conversation,
  type Message,
  type User,
  type FileImage,
  DEFAULT_AVATAR_URL,
  type Sticker,
} from "~/types/model";
import EmojiPicker from "vue3-emoji-picker";
import "vue3-emoji-picker/css";
import { v4 as uuidv4 } from "uuid";
import StickerComponent from "~/components/Sticker.vue";
import { userBlockService } from "~/services/userBlock";

interface ImagePreview {
  preview: string;
  type: string;
}

const emit = defineEmits(["lastMessage"]);

const chatStore = useChatStore();
const route = useRoute();
const auth = useAuth();

const conversationId = ref(route.params.id as string);
const newMessage = ref("");

const selectedFiles: Ref<File[]> = ref([]);
const imagePreviews: Ref<ImagePreview[]> = ref([]);
const filePreviews: Ref<ImagePreview[]> = ref([]);

const fileInput = ref();
const documentInput = ref();

const messageContainer = ref<HTMLElement | null>(null);

const files = ref<FileImage[]>([]);
const images = ref<FileImage[]>([]);
const currentFilePage = ref(1);

const unreadMessages = computed(() =>
  chatStore.chatMessages.filter(
    (m) =>
      !m.isRead &&
      m.sender.id !== auth.user?.id &&
      m.conversationId === conversationId.value
  )
);

watch(
  () => unreadMessages.value,
  (messages) => {
    if (
      messages.length &&
      conversationId.value &&
      messages[0].senderId != auth.user?.id
    ) {
      const messageIds = messages.map((m) => m.id);
      chatStore.markMessageAsRead(conversationId.value, messageIds);
    }
  },
  { immediate: true }
);

watch(
  () => chatStore.chatMessages,
  (newVal) => {
    if (chatStore.isScrollToBottom) {
      nextTick(() => {
        scrollToBottomWithDelay();
        chatStore.isScrollToBottom = false;
      });
    }
  },
  { deep: true }
);

const toast = useToast();

async function blockUser(userId: string) {
  try {
    const { data } = await userBlockService.block(userId);

    if (data.value?.code === 200) {
      chatStore.isBlocking = true;
      chatStore.canMessage = false;
      toast.success(data.value.message);
    } else {
      toast.error(data.value?.message ?? "Không thể chặn người dùng");
    }
  } catch (error) {
    console.error("Error blocking user:", error);
  }
}

async function unblockUser(userId: string) {
  try {
    const { data } = await userBlockService.unblock(userId);

    if (data.value?.code === 200) {
      chatStore.isBlocking = false;
      chatStore.canMessage = true;
      toast.success(data.value.message);
    } else {
      toast.error(data.value?.message ?? "Không thể bỏ chặn người dùng");
    }
  } catch (error) {
    console.error("Error unblocking user:", error);
  }
}

function onSelectEmoji(emoji: any) {
  newMessage.value += emoji.i;
}

const scrollToBottomWithDelay = (delay = 100) => {
  setTimeout(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  }, delay);
};

const onFileChange = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (files && files.length) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileUrl = URL.createObjectURL(file);
      const fileType = file.type;

      if (!selectedFiles.value.some((f) => f.name === file.name)) {
        imagePreviews.value.push({
          preview: fileUrl,
          type: fileType,
        });
        selectedFiles.value.push(file);
      }
    }
  }
};

const onDocumentChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  try {
    // Duyệt qua tất cả các files được chọn
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Kiểm tra kích thước từng file
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        const toast = useToast();
        toast.error(`File ${file.name} không được vượt quá 10MB`);
        continue; // Bỏ qua file này, tiếp tục với file khác
      }

      // Kiểm tra xem file đã tồn tại trong danh sách chưa
      if (!selectedFiles.value.some((f) => f.name === file.name)) {
        // Thêm file vào danh sách files để gửi
        selectedFiles.value.push(file);

        // Hiển thị tên file trong UI
        const filePreview = {
          preview: file.name,
          type: file.type,
        };
        filePreviews.value.push(filePreview);
      }
    }

    // Reset input để có thể chọn lại file cũ
    target.value = "";
  } catch (error) {
    console.error("Error handling files:", error);
    const toast = useToast();
    toast.error("Không thể xử lý file");
  }
};

const removeImage = (index: number): void => {
  imagePreviews.value.splice(index, 1);
  selectedFiles.value.splice(index, 1);
};
const removeFile = (index: number): void => {
  filePreviews.value.splice(index, 1);
  selectedFiles.value.splice(index, 1);
};

function togglePersonalInfo() {
  chatStore.showPersonalInfo = !chatStore.showPersonalInfo;
}

async function sendMessage(sticker?: Sticker) {
  if (
    !auth.user ||
    (!newMessage.value.trim() && !selectedFiles.value.length && !sticker)
  )
    return;

  const requestId = uuidv4();

  try {
    const pendingMessage: Message = {
      id: requestId,
      content: newMessage.value,
      sender: auth.user,
      status: "pending",
      requestId: requestId,
      files: [],
      senderId: auth.user.id,
      conversationId: route.params.id as string,
      isRevoked: false,
      sentAt: new Date(),
      stickerId: sticker?.id,
      sticker: sticker,
    };

    if (selectedFiles.value.length) {
      pendingMessage.files = selectedFiles.value.map((file) => ({
        id: uuidv4(),
        url: URL.createObjectURL(file),
        messageId: requestId,
        type: file.type,
        name: file.name,
        size: file.size,
      }));
    }

    // Thêm tin nhắn chờ vào UI
    chatStore.chatMessages.push(pendingMessage);

    // Cuộn xuống
    nextTick(() => {
      scrollToBottomWithDelay();
    });

    // Gửi tin nhắn
    chatStore.sendMessage(
      route.params.id as string,
      newMessage.value,
      requestId,
      sticker?.id,
      selectedFiles.value
    );

    scrollToBottomWithDelay();

    // Xóa input
    newMessage.value = "";
    selectedFiles.value = [];
    imagePreviews.value = [];
    filePreviews.value = [];
  } catch (error) {
    console.error("Error sending message:", error);
    const toast = useToast();
    toast.error("Không thể gửi tin nhắn");

    // Cập nhật trạng thái tin nhắn thành lỗi
    const msgIndex = chatStore.chatMessages.findIndex(
      (m) => m.requestId === requestId
    );
    if (msgIndex !== -1) {
      chatStore.chatMessages[msgIndex].status = "error";
    }
  }
}

onMounted(() => {
  scrollToBottomWithDelay(0);
  scrollToBottomWithDelay(100);
  scrollToBottomWithDelay(500);

  useListen("newMessage", () => {
    nextTick(() => {
      scrollToBottomWithDelay();
    });
  });
});

onUnmounted(() => {
  removeListen("newMessage");
});

// Thay đổi watch để theo dõi sâu hơn và đảm bảo chạy sau khi DOM cập nhật
watch(
  () => chatStore.chatMessages,
  () => {},
  { deep: true }
);

function getFileIcon(type: string | undefined) {
  if (!type) return "mdi:file-outline";
  if (type.includes("pdf")) return "mdi:file-pdf-box";
  if (type.includes("msword") || type.includes("wordprocessingml"))
    return "mdi:file-word-box";
  if (type.includes("spreadsheetml") || type.includes("excel"))
    return "mdi:file-excel-box";
  if (type.includes("text/plain")) return "mdi:file-document-outline";
  return "mdi:file-outline";
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

const fetchImages = async () => {
  if (!route.params.id) return;
  const { data } = await useAPI<
    ApiResponse<{
      images: FileImage[];
      hasMore: boolean;
    }>
  >(`/api/conversations/${route.params.id}/images`, {
    method: "GET",
    query: {
      page: currentFilePage.value,
    },
  });
  if (data.value?.code == 200) {
    images.value = data.value.data.images;
  }
};

const fetchFiles = async () => {
  if (!route.params.id) return;
  const { data } = await useAPI<
    ApiResponse<{
      files: FileImage[];
      hasMore: boolean;
    }>
  >(`/api/conversations/${route.params.id}/files`, {
    method: "GET",
    query: {
      page: currentFilePage.value,
    },
  });
  if (data.value?.code == 200) {
    files.value = data.value.data.files;
  }
};

await Promise.all([fetchFiles(), fetchImages()]);

// Options
const options = [
  { value: "media", label: "Phương tiện", icon: "tabler:photo" },
  { value: "settings", label: "Cài đặt", icon: "tabler:adjustments" },
];

const selectedOption = ref(options[0].value);

// Menu message
const menuMessage = ref();
const selectedMessage = ref<Message | null>(null);

async function showMenuMessage(event: MouseEvent, message: Message) {
  await menuMessage.value?.hide();
  selectedMessage.value = message;
  menuMessage.value?.show(event);
}

const isLoadingMore = ref(false);
const currentPage = ref(1);
</script>

<style scoped></style>
