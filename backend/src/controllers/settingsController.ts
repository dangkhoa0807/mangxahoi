import { Hono } from "hono";
import prisma from "@/libs/prisma";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { validate, yup } from "@/libs/validate";

const settingsController = new Hono();

// Middleware xác thực cho tất cả routes
settingsController.use("*", authMiddleware);

// Lấy cài đặt quyền riêng tư
settingsController.get("/privacy", async (c) => {
  const { user } = c.var;

  try {
    const privacySettings = await prisma.privacySettings.findUnique({
      where: { userId: user.id },
    });

    if (!privacySettings) {
      // Tạo cài đặt mặc định nếu chưa có
      const defaultSettings = await prisma.privacySettings.create({
        data: {
          userId: user.id,
          allowFollow: true,
          allowMessage: "EVERYONE",
          showOnlineStatus: true,
          showLastSeen: true,
          showProfileTo: "EVERYONE",
        },
      });
      return c.json({ code: 200, data: defaultSettings });
    }

    return c.json({ code: 200, data: privacySettings });
  } catch (error) {
    return c.json({
      code: 500,
      message: "L���i khi lấy cài đặt quyền riêng tư",
    });
  }
});

// Cập nhật cài đặt quyền riêng tư
settingsController.put("/privacy", async (c) => {
  const { user } = c.var;

  const body = await validate(
    {
      allowFollow: yup.boolean(),
      allowMessage: yup.mixed().oneOf(["EVERYONE", "FRIENDS", "NOBODY"]),
      showOnlineStatus: yup.boolean(),
      showLastSeen: yup.boolean(),
      showProfileTo: yup.mixed().oneOf(["EVERYONE", "FRIENDS", "PRIVATE"]),
      showFollowing: yup.boolean(),
    },
    await c.req.json()
  );

  try {
    // Chỉ lấy các trường cần thiết cho update/create
    const settingsData = {
      allowFollow: body.allowFollow,
      allowMessage: body.allowMessage,
      showOnlineStatus: body.showOnlineStatus,
      showLastSeen: body.showLastSeen,
      showProfileTo: body.showProfileTo,
      showFollowing: body.showFollowing,
    };

    const updatedSettings = await prisma.privacySettings.upsert({
      where: { userId: user.id },
      update: settingsData,
      create: {
        userId: user.id,
        ...settingsData,
      },
    });

    return c.json({
      code: 200,
      message: "Cập nhật cài đặt quyền riêng tư thành công",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    return c.json({
      code: 500,
      message: "Lỗi khi cập nhật cài đặt quyền riêng tư",
    });
  }
});

// Lấy cài đặt thông báo
settingsController.get("/notifications", async (c) => {
  const { user } = c.var;

  try {
    const notificationSettings = await prisma.notificationSettings.findUnique({
      where: { userId: user.id },
    });

    if (!notificationSettings) {
      // Tạo cài đặt mặc định nếu chưa có
      const defaultSettings = await prisma.notificationSettings.create({
        data: {
          userId: user.id,
          postComments: true,
          postLikes: true,
          commentLikes: true,
          newFollower: true,
          friendRequests: true,
          groupInvites: true,
          directMessages: true,
          emailNotifications: true,
        },
      });
      return c.json({ code: 200, data: defaultSettings });
    }

    return c.json({ code: 200, data: notificationSettings });
  } catch (error) {
    return c.json({ code: 500, message: "Lỗi khi lấy cài đặt thông báo" });
  }
});

// Cập nhật cài đặt thông báo
settingsController.put("/notifications", async (c) => {
  const { user } = c.var;

  try {
    const rawBody = await c.req.json();
    const body = await validate(
      {
        postComments: yup.boolean(),
        postLikes: yup.boolean(),
        commentLikes: yup.boolean(),
        newFollower: yup.boolean(),
        friendRequests: yup.boolean(),
        groupInvites: yup.boolean(),
        directMessages: yup.boolean(),
        emailNotifications: yup.boolean(),
      },
      rawBody
    );

    // Chỉ lấy các trường cần thiết cho update/create
    const settingsData = {
      postComments: body.postComments,
      postLikes: body.postLikes,
      commentLikes: body.commentLikes,
      newFollower: body.newFollower,
      friendRequests: body.friendRequests,
      groupInvites: body.groupInvites,
      directMessages: body.directMessages,
      emailNotifications: body.emailNotifications,
    };

    const updatedSettings = await prisma.notificationSettings.upsert({
      where: { userId: user.id },
      update: settingsData,
      create: {
        userId: user.id,
        ...settingsData,
      },
    });

    return c.json({
      code: 200,
      message: "Cập nhật cài đặt thông báo thành công",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return c.json({
      code: 500,
      message: "Lỗi khi cập nhật cài đặt thông báo",
    });
  }
});

// Kiểm tra quyền riêng tư của một người dùng khác
settingsController.get("/check/:userId", async (c) => {
  const { user } = c.var;
  const targetUserId = c.req.param("userId");

  try {
    // Kiểm tra xem có phải bạn bè không
    const areFriends = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId: targetUserId },
          { userId: targetUserId, friendId: user.id },
        ],
      },
    });

    const targetPrivacySettings = await prisma.privacySettings.findUnique({
      where: { userId: targetUserId },
    });

    if (!targetPrivacySettings) {
      return c.json({
        code: 200,
        data: {
          canMessage: true,
          canViewProfile: true,
          canFollow: true,
        },
      });
    }

    const response = {
      canMessage:
        targetPrivacySettings.allowMessage === "EVERYONE" ||
        (targetPrivacySettings.allowMessage === "FRIENDS" && areFriends),

      canViewProfile:
        targetPrivacySettings.showProfileTo === "EVERYONE" ||
        (targetPrivacySettings.showProfileTo === "FRIENDS" && areFriends),

      canFollow: targetPrivacySettings.allowFollow,
    };

    return c.json({ code: 200, data: response });
  } catch (error) {
    return c.json({ code: 500, message: "Lỗi khi kiểm tra quyền riêng tư" });
  }
});

export default settingsController;
