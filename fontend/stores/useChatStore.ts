import { defineStore } from "pinia";
import type { ApiResponse } from "~/types/api";
import {
  type Message,
  type Conversation,
  type User,
  DEFAULT_AVATAR_URL,
} from "~/types/model";

export const useChatStore = defineStore("chat", () => {
  const isLoading = ref(false);
  const { $notificationSound } = useNuxtApp();

  const showChatMessage = computed(() => {
    return chatPartnerInfo.value ? true : false;
  });

  // Chat dialog
  const showNewChatDialog = ref(false);
  const showPersonalInfo = ref(false);

  // Chat window
  const chatMessages = ref<Message[]>([]);
  const chatPartnerInfo = ref<User | null>(null);
  const chatIsGroup = ref(false);
  const canMessage = ref(false);
  const isBlocking = ref(false);
  const chatCursor = ref<string | null>(null);
  const chatHasMore = ref(false);
  const isPartnerOnline = computed(() => {
    const conversation = conversations.value.find(
      (c) => c.otherParticipantId === chatPartnerInfo.value?.id
    );
    return conversation?.isOnline || false;
  });
  const isScrollToBottom = ref(false);

  const isLoadingMore = ref(false);

  const conversations = ref<Conversation[]>([]);

  const auth = useAuth();
  const route = useRoute();

  // WebSocket connection state
  const isAuthenticated = ref(false);
  let ws: WebSocket | null = null;

  function getMessages() {
    return chatMessages.value || [];
  }

  function getConversationName() {
    if (!chatPartnerInfo.value) return "";

    return chatPartnerInfo.value.profile.name;
  }

  function getConversationAvatar() {
    if (!chatPartnerInfo.value) return null;
    return chatPartnerInfo.value.profile.avatarUrl;
  }

  async function fetchMessages(conversationId: string) {
    isLoading.value = true;
    isLoadingMore.value = true;
    isScrollToBottom.value = true;
    try {
      const { data } = await useAPI<
        ApiResponse<{
          info: Conversation;
          list: Message[];
          partnerInfo: User;
          isGroup: boolean;
          cursor: string | null;
          hasMore: boolean;
        }>
      >(`/api/conversations/${conversationId}/messages`, {
        params: {
          cursor: chatCursor.value,
          limit: 20,
        },
      });

      if (data.value?.code == 200) {
        if (chatCursor.value) {
          isScrollToBottom.value = false;
          chatMessages.value = [...data.value.data.list, ...chatMessages.value];
        } else {
          chatMessages.value = data.value.data.list;
        }

        chatCursor.value = data.value.data.cursor;
        chatHasMore.value = data.value.data.hasMore;
      }
    } catch (error) {
      console.error(error);
    } finally {
      isLoadingMore.value = false;
      isLoading.value = false;
    }
  }

  async function resetChat() {
    chatCursor.value = null;
    chatHasMore.value = false;
    chatMessages.value = [];
  }

  async function fetchConversation(conversationId: string) {
    const { data } = await useAPI<
      ApiResponse<{
        partnerInfo: User;
        isGroup: boolean;
        canMessage: boolean;
        isBlocking: boolean;
      }>
    >(`/api/conversations/${conversationId}`);

    if (data.value?.code == 200) {
      chatIsGroup.value = data.value.data.isGroup;
      chatPartnerInfo.value = data.value.data.partnerInfo;
      canMessage.value = data.value.data.canMessage;
      isBlocking.value = data.value.data.isBlocking;
    }
  }

  function setWebSocket(socket: WebSocket) {
    ws = socket;
  }

  async function sendMessage(
    conversationId: string,
    content: string,
    requestId: string,
    stickerId?: string,
    files?: File[]
  ) {
    if (!ws) return;

    if (files) {
      const formData = new FormData();
      formData.append("conversationId", conversationId);
      formData.append("content", content);
      formData.append("requestId", requestId);
      if (stickerId) {
        formData.append("stickerId", stickerId);
      }
      files.forEach((file) => {
        formData.append(`files[]`, file);
      });
      const { data } = await useAPI<ApiResponse<Message>>(
        `/api/conversations/${conversationId}/message`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (data.value?.code == 200) {
      } else {
        handleSendMessageError(conversationId, requestId);
      }
    } else {
      ws.send(
        JSON.stringify({
          action: "sendMessage",
          conversationId: conversationId,
          content: content,
          requestId: requestId,
          stickerId: stickerId,
        })
      );
    }
  }

  async function revokeMessage(messageId: string) {
    if (!ws) return;
    ws.send(JSON.stringify({ action: "revokeMessage", messageId: messageId }));
    try {
      // Gửi yêu cầu thu hồi tới server
      ws.send(
        JSON.stringify({
          action: "revokeMessage",
          messageId: messageId,
        })
      );
      // Cập nhật UI ngay lập tức
      const msgIndex = chatMessages.value.findIndex((m) => m.id === messageId);
      if (msgIndex !== -1) {
        chatMessages.value[msgIndex] = {
          ...chatMessages.value[msgIndex],
          content: "[Tin nhắn đã bị thu hồi]",
          sticker: undefined, // Xóa sticker khi thu hồi
          isRevoked: true,
        };
      }
      // Cập nhật tin nhắn cuối cùng trong danh sách conversations
      const conversationIndex = conversations.value.findIndex(
        (c) => c.id === messageId
      );

      if (
        conversationIndex !== -1 &&
        conversations.value[conversationIndex].lastMessage.id === messageId
      ) {
        conversations.value[conversationIndex].lastMessage = {
          ...conversations.value[conversationIndex].lastMessage,
          content: "[Tin nhắn đã bị thu hồi]",
          sticker: undefined,
          isRevoked: true,
        };
      }
    } catch (error) {
      console.error("Error revoking message:", error);
    }
  }

  function handleNewMessage(message: Message, requestId: string) {
    if (!chatPartnerInfo.value) return;

    // Cập nhật tin nhắn vào danh sách tin nhắn
    const conversationIndex = conversations.value.findIndex(
      (conv) => conv.id === message.conversationId
    );

    if (conversationIndex !== -1) {
      // Xóa cuộc hội thoại khỏi vị trí hiện tại
      const conversation = conversations.value.splice(conversationIndex, 1)[0];
      // Cập nhật tin nhắn mới nhất và đẩy lên đầu danh sách
      conversation.lastMessage = message;
      conversations.value.unshift(conversation);
    }

    // Cập nhật trạng thái tin nhắn
    const msgIndex = chatMessages.value.findIndex(
      (m) => m.requestId === requestId
    );
    if (msgIndex && msgIndex !== -1) {
      chatMessages.value[msgIndex].status = "sent";
      chatMessages.value[msgIndex].id = message.id;
    } // Thêm tin nhắn vào danh sách tin nhắn
    else if (route.params.id == message.conversationId) {
      chatMessages.value.push(message);
    }

    // Phát nhạc báo thông báo nếu tin nhắn không phải từ người dùng hiện tại
    if (auth.user && auth.user.id !== message.sender.id) {
      $notificationSound.playSound("message");
    }

    useEvent("newMessage");
  }

  function handleSendMessageError(conversationId: string, requestId: string) {
    if (!chatPartnerInfo.value) return;

    const msgIndex = chatMessages.value.findIndex(
      (m) => m.requestId === requestId
    );
    if (msgIndex && msgIndex !== -1) {
      chatMessages.value[msgIndex].status = "error";
    }
  }

  function handleMarkMessageAsRead(
    conversationId: string,
    messageIds: string[]
  ) {
    if (!chatPartnerInfo.value) return;

    useEvent("setUnreadMessage", 0);

    const msgIndex = chatMessages.value.findIndex(
      (m) => m.conversationId === conversationId
    );
    if (msgIndex && msgIndex !== -1) {
      chatMessages.value[msgIndex].isRead = true;
    }

    const conversationIndex = conversations.value.findIndex(
      (c) => c.id === conversationId
    );
    if (conversationIndex !== -1) {
      conversations.value[conversationIndex].lastMessage.isRead = true;
    }
  }

  function handleRevokeMessage(conversationId: string, messageId: string) {
    if (!chatPartnerInfo.value) return;

    const msgIndex = chatMessages.value.findIndex((m) => m.id === messageId);
    if (msgIndex && msgIndex !== -1) {
      chatMessages.value[msgIndex] = {
        ...chatMessages.value[msgIndex],
        content: "[Tin nhắn đã bị thu hồi]",
        sticker: undefined, // Xóa sticker khi thu hồi
        isRevoked: true,
      };
    }
    // Cập nhật tin nhắn cuối cùng trong danh sách conversations
    const conversationIndex = conversations.value.findIndex(
      (c) => c.id === conversationId
    );

    if (
      conversationIndex !== -1 &&
      conversations.value[conversationIndex].lastMessage.id === messageId
    ) {
      conversations.value[conversationIndex].lastMessage = {
        ...conversations.value[conversationIndex].lastMessage,
        content: "[Tin nhắn đã bị thu hồi]",
        sticker: undefined,
        isRevoked: true,
      };
    }
  }

  function markMessageAsRead(conversationId: string, messageIds: string[]) {
    if (!ws) return;
    ws.send(
      JSON.stringify({
        action: "markAsReadByIds",
        conversationId: conversationId,
        messageIds: messageIds,
      })
    );
  }

  function handleConversationOnline(participantId: string, isOnline: boolean) {
    const conversationIndex = conversations.value.findIndex(
      (c) => c.otherParticipantId === participantId
    );
    if (conversationIndex !== -1) {
      conversations.value[conversationIndex].isOnline = isOnline;
    }
  }

  return {
    showChatMessage,
    showNewChatDialog,
    showPersonalInfo,
    chatPartnerInfo,
    chatMessages,
    chatCursor,
    chatHasMore,
    chatIsGroup,
    conversations,
    isAuthenticated,
    isPartnerOnline,
    isScrollToBottom,
    isBlocking,
    isLoadingMore,
    isLoading,
    canMessage,
    getMessages,
    resetChat,
    getConversationName,
    getConversationAvatar,
    markMessageAsRead,
    setWebSocket,
    fetchMessages,
    fetchConversation,
    sendMessage,
    revokeMessage,
    handleNewMessage,
    handleSendMessageError,
    handleRevokeMessage,
    handleMarkMessageAsRead,
    handleConversationOnline,
  };
});
