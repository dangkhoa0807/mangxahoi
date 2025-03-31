import prisma from "@/libs/prisma";
import { validate, yup } from "@/libs/validate";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { Prisma } from "@prisma/client";
import { Hono } from "hono";
import { ObjectId } from "bson";
import { onlineUsers } from "@/websocket/services/onlineUsers";
import { uploadFile, uploadImage } from "@/libs/uploadImage";
import { getUTCTime } from "@/libs/time";

declare module "hono" {
  interface ContextVariableMap {
    conversation: Prisma.ConversationGetPayload<{
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true;
                profile: {
                  select: {
                    name: true;
                    avatarUrl: true;
                  };
                };
              };
            };
          };
        };
      };
    }>;
  }
}

const conversationController = new Hono();
conversationController.use(authMiddleware);

// Lấy danh sách cuộc trò chuyện
conversationController.get("/", async (c) => {
  const { user } = c.var;

  const query = await validate(
    {
      cursor: yup.string().optional(),
      limit: yup.number().default(20),
    },
    c.req.query()
  );

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { userId: user.id },
      },
    },
    include: {
      participants: {
        include: {
          user: {
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
        },
      },
      messages: {
        orderBy: {
          sentAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          content: true,
          conversationId: true,
          isRevoked: true,
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
          sticker: {
            select: {
              id: true,
              url: true,
            },
          },
          files: {
            select: {
              url: true,
            },
          },
          sentAt: true,
        },
      },
    },
    take: query.limit,
    cursor: query.cursor ? { id: query.cursor } : undefined,
    skip: query.cursor ? 1 : 0,
    orderBy: {
      updatedAt: "desc",
    },
  });

  await prisma.unreadMessageCounter.deleteMany({
    where: {
      userId: user.id,
    },
  });

  // Xử lý kết quả để lấy tên và avatar của người còn lại nếu là cuộc trò chuyện 1-1
  const processedConversations = conversations.map((conversation) => {
    const lastMessage = conversation.messages[0] ?? null; // Tin nhắn gần nhất

    if (!conversation.isGroup) {
      const otherParticipant = conversation.participants.find(
        (participant) => participant.userId !== user.id
      );

      const isOnline = otherParticipant
        ? onlineUsers.isUserOnline(otherParticipant.userId)
        : false;
      const otherParticipantName = otherParticipant?.user.profile?.name;
      const otherParticipantAvatarUrl =
        otherParticipant?.user.profile?.avatarUrl;
      const otherParticipantId = otherParticipant?.userId;

      return {
        id: conversation.id,
        isGroup: conversation.isGroup,
        iconUrl: otherParticipantAvatarUrl || null,
        name: otherParticipantName || "Chưa đặt tên",
        otherParticipantId,
        lastMessage,
        isOnline,
      };
    }

    return {
      id: conversation.id,
      isGroup: conversation.isGroup,
      iconUrl: null,
      name: conversation.participants
        .map((participant) => participant.user.profile?.name)
        .join(", "),
      otherParticipantId: null,
      lastMessage,
      isOnline: false,
    };
  });

  const hasMore = conversations.length === query.limit;

  return c.json({
    code: 200,
    data: {
      list: processedConversations,
      hasMore: hasMore,
      cursor:
        processedConversations.length > 0 ? processedConversations[0].id : null,
    },
  });
});

// Tạo cuộc trò chuyện mới
conversationController.post("/", async (c) => {
  const { user } = c.var;

  const body = await validate(
    {
      userId: yup.string().required(),
    },
    await c.req.json()
  );

  try {
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            OR: [{ userId: user.id }, { userId: body.userId }],
          },
        },
      },
    });

    if (existingConversation) {
      return c.json({ code: 200, data: existingConversation });
    }

    const newConversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { user: { connect: { id: user.id } } },
            { user: { connect: { id: body.userId } } },
          ],
        },
      },
      include: {
        participants: true,
      },
    });

    return c.json({ code: 200, data: newConversation });
  } catch (error) {
    return c.json({ code: -100, message: "Tạo cuộc trò chuyện thất bại" });
  }
});

// Middleware hộp thoại
conversationController.use("/:id/*", async (c, next) => {
  const id = c.req.param("id");
  const { user } = c.var;

  if (!ObjectId.isValid(id)) {
    return c.json({ code: -100, message: "Không tìm thấy hộp thoại" });
  }

  const conversation = await prisma.conversation.findUnique({
    where: {
      id: id,
      participants: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
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
        },
      },
    },
  });

  if (!conversation) {
    return c.json({ code: -100, message: "Hộp thoại không tồn tại" });
  }

  c.set("conversation", conversation);
  await next();
});

// Lấy thông tin cuộc trò chuyện
conversationController.get("/:id", async (c) => {
  const { user, conversation } = c.var;

  const partner = conversation.participants.find(
    (participant) => participant.userId !== user.id
  );

  const partnerInfo = partner?.user;

  const name = conversation.isGroup
    ? conversation.participants
        .map((participant) => participant.user.profile?.name)
        .join(", ")
    : partnerInfo?.profile?.name;

  const iconUrl = conversation.isGroup
    ? conversation.participants
        .map((participant) => participant.user.profile?.avatarUrl)
        .join(", ")
    : partnerInfo?.profile?.avatarUrl;

  const isOnline = partnerInfo
    ? onlineUsers.isUserOnline(partnerInfo.id)
    : false;

  // Kiểm tra quyền nhắn tin và trạng thái chặn
  let canMessage = true;
  let isBlocking = false;

  if (!conversation.isGroup && partnerInfo) {
    // Kiểm tra xem hai người có là bạn bè không
    const areFriends = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId: partnerInfo.id },
          { userId: partnerInfo.id, friendId: user.id },
        ],
      },
    });

    // Kiểm tra chặn
    const blockRecord = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: partnerInfo.id },
          { blockerId: partnerInfo.id, blockedId: user.id },
        ],
      },
    });

    // Xác định trạng thái chặn
    if (blockRecord) {
      if (blockRecord.blockerId === user.id) {
        isBlocking = true;
        canMessage = false;
      } else {
        canMessage = false;
      }
    }

    // Chỉ kiểm tra quyền riêng tư nếu không có chặn
    if (canMessage) {
      const receiverSettings = await prisma.privacySettings.findUnique({
        where: { userId: partnerInfo.id },
      });

      if (receiverSettings) {
        canMessage =
          receiverSettings.allowMessage === "EVERYONE" ||
          (receiverSettings.allowMessage === "FRIENDS" && areFriends != null);
      }
    }
  }

  return c.json({
    code: 200,
    data: {
      isGroup: conversation.isGroup,
      name,
      iconUrl,
      partnerInfo,
      isOnline,
      canMessage,
      isBlocking,
    },
  });
});

// Lấy danh sách tin nhắn
conversationController.get("/:id/messages", async (c) => {
  try {
    const { user, conversation } = c.var;
    const query = await validate(
      {
        cursor: yup.string().optional(),
        limit: yup.number().default(20),
      },
      c.req.query()
    );

    // Nếu là cuộc trò chuyển 1-1, lấy thông tin của người mình nhắn
    const partner = conversation.participants.find(
      (participant) => participant.userId !== user.id
    );

    // tin nhắn trong cuộc trò chuyện
    const messages = await prisma.message.findMany({
      where: {
        conversation: {
          id: conversation.id,
        },
      },
      orderBy: { sentAt: "desc" },
      select: {
        id: true,
        content: true,
        isRevoked: true,
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
        files: {
          select: {
            url: true,
            type: true,
            name: true,
            size: true,
            messageId: true,
          },
        },
        stickerId: true,
        sticker: {
          select: {
            id: true,
            url: true,
          },
        },
        sentAt: true,
      },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
    });

    const reversedMessages = messages.reverse();

    const formattedMessages = reversedMessages.map((msg) => ({
      ...msg,
      content: msg.isRevoked ? "[Tin nhắn đã bị thu hồi]" : msg.content,
      files: msg.isRevoked ? [] : msg.files,
    }));

    await prisma.unreadMessageCounter.deleteMany({
      where: {
        userId: user.id,
        conversationId: conversation.id,
      },
    });

    return c.json({
      code: 200,
      data: {
        info: conversation,
        partnerInfo: partner?.user,
        list: formattedMessages,
        cursor: formattedMessages.length > 0 ? formattedMessages[0].id : null,
        hasMore: formattedMessages.length === query.limit,
      },
    });
  } catch (error) {
    return c.json({ code: -100, message: "Lấy tin nhắn thất bại" });
  }
});

// Gửi tin nhắn
conversationController.post("/:id/message", async (c) => {
  try {
    const { user, conversation } = c.var;

    // Kiểm tra quyền gửi tin nhắn
    if (!conversation.isGroup) {
      const partner = conversation.participants.find(
        (participant) => participant.userId !== user.id
      );

      if (partner) {
        // Kiểm tra xem hai người có là bạn bè không
        const areFriends = await prisma.friend.findFirst({
          where: {
            OR: [
              { userId: user.id, friendId: partner.userId },
              { userId: partner.userId, friendId: user.id },
            ],
          },
        });

        const isBlocked = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: user.id, blockedId: partner.userId },
              { blockerId: partner.userId, blockedId: user.id },
            ],
          },
        });

        if (isBlocked) {
          return c.json({
            code: -100,
            message: "Bạn đã bị chặn bởi người này",
          });
        }

        // Lấy cài đặt quyền riêng tư của đối phương
        const receiverSettings = await prisma.privacySettings.findUnique({
          where: { userId: partner.userId },
        });

        // Kiểm tra cài đặt riêng tư
        if (receiverSettings) {
          const canMessage =
            receiverSettings.allowMessage === "EVERYONE" ||
            (receiverSettings.allowMessage === "FRIENDS" && areFriends);

          if (!canMessage) {
            return c.json({
              code: -100,
              message: "Bạn không có quyền gửi tin nhắn cho người này",
            });
          }
        }
      }
    }

    const formData = await c.req.parseBody();

    // Extract all files from formData
    let files: File[] = [];
    for (const [key, value] of Object.entries(formData)) {
      if (key.startsWith("files[")) {
        // Check if value is an array and spread it
        if (Array.isArray(value)) {
          files = [...files, ...(value as File[])];
        } else {
          files.push(value as File);
        }
      }
    }

    // Validate đầu vào
    const body = await validate(
      {
        content: yup.string().nullable(),
        requestId: yup.string().required("Thiếu tham số"),
        stickerId: yup.string().nullable(),
      },
      formData
    );

    if (files.some((file) => !(file instanceof File))) {
      return c.json({ code: -100, message: "File không hợp lệ" });
    }

    // Kiểm tra sticker nếu có
    if (body.stickerId) {
      const sticker = await prisma.sticker.findFirst({
        where: {
          id: body.stickerId,
          status: "ACTIVE",
          pack: {
            status: "ACTIVE",
          },
        },
      });

      if (!sticker) {
        return c.json({
          code: -100,
          message: "Sticker không tồn tại hoặc không khả dụng",
        });
      }
    }

    // Tạo tin nhắn mới
    const newMessage = await prisma.message.create({
      data: {
        content: body.content,
        conversation: {
          connect: {
            id: conversation.id,
          },
        },
        sender: {
          connect: {
            id: user.id,
          },
        },
        ...(body.stickerId && {
          sticker: {
            connect: {
              id: body.stickerId,
            },
          },
        }),
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
        sticker: {
          select: {
            id: true,
            url: true,
          },
        },
        files: true,
        sentAt: true,
      },
    });

    // Upload và lưu files
    if (files.length > 0) {
      const uploadedFiles = [];

      // Sử dụng for...of để upload và lưu files tuần tự
      for (const file of files) {
        let arrayBuffer;
        if (file instanceof File) {
          arrayBuffer = await file.arrayBuffer();
        } else {
          throw new Error("File không hợp lệ");
        }
        const fileBuffer = Buffer.from(arrayBuffer);
        let fileUrl;

        // Phân biệt xử lý ảnh và documents
        if (file.type.startsWith("image/")) {
          fileUrl = await uploadImage(fileBuffer);
        } else {
          fileUrl = await uploadFile(fileBuffer, file.name);
        }

        // Lưu thông tin file vào database - thêm name và size
        const uploadedFile = await prisma.file.create({
          data: {
            url: fileUrl,
            messageId: newMessage.id,
            type: file.type,
            name: file.name,
            size: file.size,
          },
          select: {
            id: true,
            url: true,
            messageId: true,
            type: true,
            name: true,
            size: true,
          },
        });

        uploadedFiles.push(uploadedFile);
      }

      newMessage.files = uploadedFiles;
    }

    // Cập nhật thời gian cuộc trò chuyện
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Gửi tin nhắn qua WebSocket
    for (const participant of conversation.participants) {
      if (participant.userId !== user.id) {
        await prisma.unreadMessageCounter.upsert({
          where: {
            userId_conversationId: {
              userId: participant.userId,
              conversationId: conversation.id,
            },
          },
          update: {
            lastMessageTime: getUTCTime(new Date()),
          },
          create: {
            userId: participant.userId,
            conversationId: conversation.id,
            count: 1,
            lastMessageTime: getUTCTime(new Date()),
          },
        });

        const currentUnreadCounter = await prisma.unreadMessageCounter.count({
          where: {
            userId: participant.userId,
          },
        });

        if (currentUnreadCounter) {
          onlineUsers.broadcastToUser(participant.userId, {
            code: 200,
            type: "unreadMessageCounter",
            data: currentUnreadCounter,
          });
        }
      }
      onlineUsers.broadcastToUser(participant.userId, {
        code: 201,
        message: "Tin nhắn gửi thành công",
        data: newMessage,
        requestId: body.requestId,
      });
    }

    return c.json({
      code: 200,
      data: newMessage,
      message: "Gửi tin nhắn thành công",
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return c.json({ code: -100, message: "Gửi tin nhắn thất bại" });
  }
});

// Lấy danh sách ảnh
conversationController.get("/:id/images", async (c) => {
  const { conversation } = c.var;

  const { page = "1", pageSize = "10" } = c.req.query();
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize) + 1;

  // Lấy danh sách ảnh trong cuộc trò chuyện
  const images = await prisma.file.findMany({
    where: {
      message: {
        conversationId: conversation.id,
      },
      // Lọc chỉ lấy các file có type bắt đầu bằng "image/"
      type: {
        startsWith: "image/",
      },
    },
    select: {
      id: true,
      url: true,
      messageId: true,
      type: true,
      name: true,
      size: true,
    },
    skip: skip,
    take: take,
  });

  const hasMore = images.length === take;
  return c.json({
    code: 200,
    data: {
      images: images,
      hasMore,
    },
  });
});

// Lấy danh sách files (không bao gồm ảnh)
conversationController.get("/:id/files", async (c) => {
  const { conversation } = c.var;

  const { page = "1", pageSize = "10" } = c.req.query();
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize) + 1;

  // Lấy danh sách files (không phải ảnh) trong cuộc trò chuyện
  const files = await prisma.file.findMany({
    where: {
      message: {
        conversationId: conversation.id,
      },
      // Lọc để loại bỏ các file có type bắt đầu bằng "image/"
      NOT: {
        type: {
          startsWith: "image/",
        },
      },
    },
    select: {
      id: true,
      url: true,
      messageId: true,
      type: true,
      name: true,
      size: true,
    },
    skip: skip,
    take: take,
  });

  const hasMore = files.length === take;
  return c.json({
    code: 200,
    data: {
      files: files,
      hasMore,
    },
  });
});

// Đếm số hộp thoại có tin nhắn chưa đọc
conversationController.get("/unread", async (c) => {
  const { user } = c.var;

  try {
    // Lấy danh sách cuộc trò chuyện có tin nhắn chưa đọc
    const unreadConversations = await prisma.unreadMessageCounter.count({
      where: {
        userId: user.id,
      },
    });

    return c.json({
      code: 200,
      data: {
        count: unreadConversations,
      },
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Lỗi khi lấy số lượng hộp thoại chưa đọc",
    });
  }
});

export default conversationController;
