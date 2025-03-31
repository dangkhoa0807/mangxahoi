import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";
import { Hono } from "hono";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import prisma from "@/libs/prisma";
import { onlineUsers } from "@/websocket/services/onlineUsers";
import { revokeMessage, sendMessage } from "./services/conversations";

type user = Prisma.UserGetPayload<{
  include: {
    profile: true;
  };
}>;

const SECRET_KEY = Bun.env.SECRET_KEY ?? "";
const twokWebsocket = new Hono();

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

twokWebsocket.get(
  "/twok",
  upgradeWebSocket(async (c) => {
    let user: user;
    let token: string;

    return {
      onOpen(_event, ws) {
        ws.send(
          JSON.stringify({
            code: 101,
            message: "Vui lòng xác thực để nhận thông báo",
          })
        );
      },

      async onMessage(event, ws) {
        try {
          const message = JSON.parse(event.data.toString());

          // Xác thực user mỗi hành động
          if (token) {
            try {
              const decoded = jwt.verify(token, SECRET_KEY);
              user = decoded as any;
            } catch (error) {
              return ws.send(
                JSON.stringify({ code: 401, message: "Xác thực thất bại" })
              );
            }
          }

          // Xác thực
          if (message.action === "auth" && message.token) {
            try {
              const decoded = jwt.verify(message.token, SECRET_KEY);
              user = decoded as any;
              token = message.token;

              if (!onlineUsers.isUserOnline(user.id)) {
                onlineUsers.addConnection(user.id, {
                  ws,
                  userId: user.id,
                  token,
                });

                onlineUsers.broadcastToAll(
                  {
                    code: 205,
                    message: "Người dùng đã online",
                    data: { userId: user.id },
                  },
                  [user.id]
                );
              } else {
                setTimeout(() => {
                  if (!onlineUsers.isUserOnline(user.id)) {
                    onlineUsers.addConnection(user.id, {
                      ws,
                      userId: user.id,
                      token,
                    });

                    onlineUsers.broadcastToAll(
                      {
                        code: 205,
                        message: "Người dùng đã online",
                        data: { userId: user.id },
                      },
                      [user.id]
                    );
                  }
                }, 2000);
              }

              return ws.send(
                JSON.stringify({
                  code: 200,
                  message: "Xác thực thành công",
                })
              );
            } catch (error) {
              return ws.send(
                JSON.stringify({ code: 401, message: "Xác thực thất bại" })
              );
            }
          }

          // Kiểm tra xác thực
          if (!token) {
            return ws.send(
              JSON.stringify({
                code: 101,
                message: "Vui lòng xác thực để nhận thông tin",
              })
            );
          }

          // Gửi tin nhắn
          if (message.action === "sendMessage") {
            return await sendMessage(
              ws,
              user.id,
              message.conversationId,
              message.requestId,
              message.content
            );
          }

          // Thu hồi tin nhắn
          if (message.action === "revokeMessage") {
            return await revokeMessage(ws, user.id, message.messageId);
          }

          // Đánh dấu tin nhắn đã đọc
          if (message.action === "markAsRead") {
            const { conversationId } = message;

            if (!conversationId) {
              return ws.send(
                JSON.stringify({
                  code: -203,
                  message: "Dữ liệu không hợp lệ",
                })
              );
            }

            try {
              await prisma.unreadMessageCounter.deleteMany({
                where: {
                  userId: user.id,
                  conversationId: conversationId,
                },
              });

              // Kiểm tra xem người dùng có trong cuộc trò chuyện không
              const conversation = await prisma.conversation.findFirst({
                where: {
                  id: conversationId,
                  participants: {
                    some: {
                      userId: user.id,
                    },
                  },
                },
                include: {
                  participants: {
                    select: {
                      userId: true,
                    },
                  },
                },
              });

              if (!conversation) {
                return ws.send(
                  JSON.stringify({
                    code: -204,
                    message: "Bạn không có quyền truy cập cuộc trò chuyện này",
                  })
                );
              }

              // Cập nhật trạng thái đã đọc cho tất cả tin nhắn trong cuộc trò chuyện
              await prisma.message.updateMany({
                where: {
                  conversationId,
                  NOT: {
                    senderId: user.id,
                  },
                },
                data: {
                  isRead: true,
                },
              });

              // Thông báo cho các người dùng khác trong cuộc trò chuyện
              for (const participant of conversation.participants) {
                if (
                  participant.userId &&
                  onlineUsers.getConnections(participant.userId).length
                ) {
                  onlineUsers
                    .getConnections(participant.userId)
                    .forEach((c) => {
                      c.ws.send(
                        JSON.stringify({
                          code: 203,
                          message: "Tin nhắn đã được đọc",
                          data: {
                            conversationId,
                            userId: user.id,
                          },
                        })
                      );
                    });
                }
              }

              return;
            } catch (error) {
              return ws.send(
                JSON.stringify({
                  code: -100,
                  message: "Đánh dấu tin nhắn đã đọc thất bại",
                })
              );
            }
          }

          // Đánh dấu tin nhắn đã đọc theo ID
          if (message.action === "markAsReadByIds") {
            const { messageIds, conversationId } = message;

            if (!messageIds || !Array.isArray(messageIds)) {
              return ws.send(
                JSON.stringify({
                  code: -203,
                  message: "Dữ liệu không hợp lệ",
                })
              );
            }

            try {
              await prisma.unreadMessageCounter.deleteMany({
                where: {
                  userId: user.id,
                  conversationId: conversationId,
                },
              });

              // Cập nhật trạng thái đã đọc cho các tin nhắn được chỉ định
              await prisma.message.updateMany({
                where: {
                  id: {
                    in: messageIds,
                  },
                  NOT: {
                    senderId: user.id,
                  },
                },
                data: {
                  isRead: true,
                },
              });

              // Lấy thông tin về các cuộc trò chuyện liên quan
              const conversations = await prisma.conversation.findMany({
                where: {
                  messages: {
                    some: {
                      id: {
                        in: messageIds,
                      },
                    },
                  },
                },
                include: {
                  participants: {
                    select: {
                      userId: true,
                    },
                  },
                },
              });

              // Thông báo cho các người dùng khác trong các cuộc trò chuyện
              for (const conversation of conversations) {
                for (const participant of conversation.participants) {
                  if (
                    participant.userId &&
                    onlineUsers.getConnections(participant.userId).length
                  ) {
                    onlineUsers
                      .getConnections(participant.userId)
                      .forEach((c) => {
                        c.ws.send(
                          JSON.stringify({
                            code: 203,
                            message: "Tin nhắn đã được đọc",
                            data: {
                              conversationId,
                              messageIds,
                              userId: user.id,
                            },
                          })
                        );
                      });
                  }
                }
              }

              return;
            } catch (error) {
              return ws.send(
                JSON.stringify({
                  code: -100,
                  message: "Đánh dấu tin nhắn đã đọc thất bại",
                })
              );
            }
          }
        } catch (error) {
          ws.send(
            JSON.stringify({
              error: "Dữ liệu không hợp lệ.",
            })
          );
        }
      },

      onClose: (event, ws) => {
        // Kiểm tra nếu user tồn tại và có trong danh sách connections
        if (user?.id && onlineUsers.getConnections(user.id).length) {
          onlineUsers.removeConnection(user.id);
          onlineUsers.broadcastToAll(
            {
              code: 204,
              message: "Người dùng đã offline",
              data: { userId: user.id },
            },
            [user.id]
          );
        }
      },
    };
  })
);

export { twokWebsocket, websocket };
