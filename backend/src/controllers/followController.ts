import { Hono } from "hono";
import prisma from "@/libs/prisma";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { queueNotification } from "@/queues/notificationQueue";

const followController = new Hono();

// Middleware xác thực cho tất cả routes
followController.use("*", authMiddleware);

// Theo dõi người dùng
followController.post("/:id", async (c) => {
  const { user } = c.var;
  const targetUserId = c.req.param("id");

  if (user.id === targetUserId) {
    return c.json({
      code: -100,
      message: "Bạn không thể theo dõi chính mình",
    });
  }

  try {
    // Kiểm tra người dùng đích có tồn tại không
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        privacySettings: true,
      },
    });

    if (!targetUser) {
      return c.json({
        code: -100,
        message: "Không tìm thấy người dùng",
      });
    }

    // Kiểm tra xem đã follow chưa
    const existingFollow = await prisma.follower.findFirst({
      where: {
        followerId: user.id,
        followingId: targetUserId,
      },
    });

    if (existingFollow) {
      return c.json({
        code: -101,
        message: "Bạn đã theo dõi người dùng này rồi",
      });
    }

    // Kiểm tra cài đặt quyền riêng tư
    if (targetUser.privacySettings && !targetUser.privacySettings.allowFollow) {
      return c.json({
        code: -102,
        message: "Người dùng này không cho phép theo dõi",
      });
    }

    // Tạo mối quan hệ follow
    await prisma.follower.create({
      data: {
        followerId: user.id,
        followingId: targetUserId,
      },
    });

    // Tạo thông báo cho người được follow
    if (targetUser.id !== user.id) {
      await queueNotification({
        type: "follow",
        userId: targetUserId,
        senderId: user.id,
        redirectUrl: `/user/${user.id}`,
        message: null,
        id: "",
        createdAt: new Date(),
        read: false,
      });
    }

    return c.json({
      code: 200,
      message: "Theo dõi thành công",
    });
  } catch (error) {
    return c.json({
      code: 500,
      message: "Lỗi khi theo dõi người dùng",
    });
  }
});

// Bỏ theo dõi người dùng
followController.delete("/:id", async (c) => {
  const { user } = c.var;
  const targetUserId = c.req.param("id");

  try {
    const follow = await prisma.follower.findFirst({
      where: {
        followerId: user.id,
        followingId: targetUserId,
      },
    });

    if (!follow) {
      return c.json({
        code: -100,
        message: "Bạn chưa theo dõi người dùng này",
      });
    }

    await prisma.follower.delete({
      where: {
        id: follow.id,
      },
    });

    return c.json({
      code: 200,
      message: "Bỏ theo dõi thành công",
    });
  } catch (error) {
    return c.json({
      code: 500,
      message: "Lỗi khi bỏ theo dõi người dùng",
    });
  }
});

// Lấy danh sách người đang theo dõi
followController.get("/followers/:userId", async (c) => {
  const targetUserId = c.req.param("userId");
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "10", 10);
  const skip = (page - 1) * limit;

  try {
    const followers = await prisma.follower.findMany({
      where: {
        followingId: targetUserId,
      },
      select: {
        follower: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      skip: skip,
      take: limit + 1,
    });

    const hasMore = followers.length > limit;
    if (hasMore) {
      followers.pop();
    }

    return c.json({
      code: 200,
      data: {
        list: followers.map((f) => f.follower),
        hasMore,
      },
    });
  } catch (error) {
    return c.json({
      code: 500,
      message: "Lỗi khi lấy danh sách người theo dõi",
    });
  }
});

export default followController;
