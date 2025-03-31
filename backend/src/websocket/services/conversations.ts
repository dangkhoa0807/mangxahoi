import prisma from "@/libs/prisma";
import { onlineUsers } from "@/websocket/services/onlineUsers";
import { ServerWebSocket } from "bun";
import { ObjectId } from "mongodb";
import { WSContext } from "hono/ws";

async function canSendMessage(userId: string, conversationId: string) {
  try {
    // Kiểm tra xem hộp thoại có tồn tại không
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              include: {
                privacySettings: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return {
        allowed: false,
        message: "Hộp thoại không tồn tại",
      };
    }

    // Kiểm tra xem user có phải là thành viên của hộp thoại không
    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId
    );

    if (!isParticipant) {
      return {
        allowed: false,
        message: "Bạn không phải là thành viên của hộp thoại này",
      };
    }

    // Nếu hộp thoại là 1-1
    if (!conversation.isGroup) {
      // Lấy người nhận khác
      const otherParticipant = conversation.participants.find(
        (p) => p.userId !== userId
      );

      if (!otherParticipant) {
        return {
          allowed: false,
          message: "Không tìm thấy người nhận",
        };
      }

      const receiverSettings = otherParticipant.user.privacySettings;

      // Kiểm tra xem hai người có là bạn bè không
      const areFriends = await prisma.friend.findFirst({
        where: {
          OR: [
            { userId: userId, friendId: otherParticipant.userId },
            { userId: otherParticipant.userId, friendId: userId },
          ],
        },
      });

      // Kiểm tra cài đặt riêng tư
      if (receiverSettings) {
        const canMessage =
          receiverSettings.allowMessage === "EVERYONE" ||
          (receiverSettings.allowMessage === "FRIENDS" && areFriends);

        if (!canMessage) {
          return {
            allowed: false,
            message: "Người dùng không cho phép nhắn tin",
          };
        }
      }
    }

    return {
      allowed: true,
      message: "Có thể gửi tin nhắn",
      conversation,
    };
  } catch (error) {
    return {
      allowed: false,
      message: "Có lỗi xảy ra khi kiểm tra quyền nhắn tin",
    };
  }
}

// Gửi tin nhắn
async function sendMessage(
  ws: WSContext<ServerWebSocket>,
  senderId: string,
  conversationId: string,
  requestId: string,
  content: string
) {
  if (!conversationId || !requestId || !content) {
    return ws.send(
      JSON.stringify({
        code: -203,
        message: "Dữ liệu không hợp lệ",
        requestId,
      })
    );
  }

  // Kiểm tra xem có thể gửi tin nhắn không
  const canSend = await canSendMessage(senderId, conversationId);

  if (!canSend.allowed) {
    return ws.send(
      JSON.stringify({
        code: -204,
        message: canSend.message,
        requestId,
      })
    );
  }

  try {
    const newMessage = await prisma.message.create({
      data: {
        content,
        sentAt: new Date(),
        conversation: {
          connect: {
            id: conversationId,
          },
        },
        sender: {
          connect: {
            id: senderId,
          },
        },
      },
      select: {
        id: true,
        content: true,
        conversationId: true,
        isRead: true,
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        sentAt: true,
      },
    });

    // Cập nhật thời gian cập nhật cuộc trò chuyện
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Gửi tin nhắn đến tất cả người tham gia hộp thoại đang online
    const conversation = canSend.conversation;
    if (conversation) {
      for (const participant of conversation.participants) {
        onlineUsers.broadcastToUser(participant.userId, {
          code: 201,
          message: "Tin nhắn gửi thành công",
          data: newMessage,
          requestId,
        });
      }
    }

    return;
  } catch (error) {
    console.error("Error sending message:", error);
    return ws.send(
      JSON.stringify({
        code: -100,
        message: "Gửi tin nhắn thất bại",
        requestId,
      })
    );
  }
}

// Thu hồi tin nhắn
async function revokeMessage(
  ws: WSContext<ServerWebSocket>,
  userId: string,
  messageId: string
) {
  if (!messageId) {
    return ws.send(
      JSON.stringify({
        code: -203,
        message: "Dữ liệu không hợp lệ",
      })
    );
  }

  if (!ObjectId.isValid(messageId)) {
    return ws.send(
      JSON.stringify({
        code: -203,
        message: "Dữ liệu không hợp lệ",
      })
    );
  }

  try {
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId, senderId: userId },
      select: {
        id: true,
        senderId: true,
        stickerId: true,
        conversation: {
          select: {
            id: true,
            participants: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!existingMessage) {
      return ws.send(
        JSON.stringify({
          code: 403,
          message: "Bạn không có quyền thu hồi tin nhắn này",
        })
      );
    }
    
    // Cập nhật trạng thái `isRevoked`
    if(existingMessage.stickerId){
      await prisma.message.update({
        where:{ id: messageId},
        data :{
          stickerId : null,
          isRevoked:true
        },
      })
    }
    else{
      
      await prisma.message.update({
        where: { id: messageId },
        data: { isRevoked: true },
      });
    }

    

    

    await prisma.file.deleteMany({
      where: {
        messageId: messageId,
      },
    });

    // Thông báo cho các người dùng khác trong cuộc trò chuyện
    const conversation = existingMessage.conversation;
    if (conversation) {
      for (const participant of conversation.participants) {
        onlineUsers.getConnections(participant.userId).forEach((c) => {
          c.ws.send(
            JSON.stringify({
              code: 202,
              message: "Tin nhắn đã được thu hồi",
              data: { conversationId: conversation.id, messageId },
            })
          );
        });
      }
    }

    return;
  } catch (error) {
    console.error("Error revoking message:", error);
    return ws.send(
      JSON.stringify({
        code: -100,
        message: "Hủy tin nhắn thất bại",
      })
    );
  }
}

export { canSendMessage, sendMessage, revokeMessage };
