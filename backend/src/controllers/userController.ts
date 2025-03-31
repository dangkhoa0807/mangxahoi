import prisma, { cachePrisma } from "@/libs/prisma";
import { getUTCTime } from "@/libs/time";
import * as bcrypt from "bcryptjs";
import { validate, yup } from "@/libs/validate";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "@/middlewares/authMiddleware";
import { Hono } from "hono";
import jwt from "jsonwebtoken";
import { ObjectId } from "bson";
import CryptoJS from "crypto-js";
import { mailQueue } from "@/libs/mailQueue";
import { maskEmail } from "@/libs/string";
import { every } from "hono/combine";
import profileMiddleware from "@/middlewares/profileMiddleware";
import { generateAuthTokens } from "@/helpers/auth";
import { PostStatus, Role } from "@prisma/client";
import { postCondition, postSelect } from "@/helpers/posts";

const userController = new Hono();

// Lấy danh sách thiết bị
userController.get("/devices", authMiddleware, async (c) => {
  const { user } = c.var;

  const query = await validate(
    {
      cursor: yup.string().optional(),
      limit: yup.number().optional().default(10),
    },
    c.req.query()
  );

  try {
    const devices = await prisma.userDevice.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: {
        lastLoginAt: "desc",
      },
      cursor: query.cursor ? { id: query.cursor } : undefined,
      take: query.limit,
      skip: query.cursor ? 1 : 0,
    });

    return c.json({
      code: 200,
      data: {
        list: devices,
        hasMore: devices.length === query.limit,
        cursor: devices.length > 0 ? devices[devices.length - 1].id : undefined,
      },
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Lỗi khi lấy danh sách thiết bị",
    });
  }
});

// Xoá thiết bị
userController.delete("/devices/:id", authMiddleware, async (c) => {
  const { user } = c.var;
  const deviceId = c.req.param("id");

  try {
    const device = await prisma.userDevice.findFirst({
      where: {
        id: deviceId,
        userId: user.id,
      },
    });

    if (!device) {
      return c.json({
        code: -100,
        message: "Thiết bị không tồn tại",
      });
    }

    // Xoá refresh tokens của thiết bị
    await prisma.refreshToken.deleteMany({
      where: {
        deviceId: device.id,
      },
    });

    // Xoá thiết bị
    await prisma.userDevice.delete({
      where: {
        id: device.id,
      },
    });

    return c.json({
      code: 200,
      message: "Xoá thiết bị thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Xoá thiết bị thất bại",
    });
  }
});

// Lấy thông tin user
userController.get("/", authMiddleware, async (c) => {
  const user = c.var.user;
  return c.json({
    code: 200,
    data: {
      id: user.id,
      email: maskEmail(user.email),
      createdAt: user.createdAt,
      profile: user.profile
        ? {
            name: user.profile.name,
            avatarUrl: user.profile.avatarUrl,
            bannerUrl: user.profile.bannerUrl,
            bio: user.profile.bio,
          }
        : null,
      roles: user.roles.map((role: any) => role.role),
    },
  });
});

// Gửi mã xác nhận
userController.post("/emailCaptcha", authMiddleware, async (c) => {
  const { user } = c.var;

  const body = await validate(
    {
      action: yup
        .string()
        .oneOf(["change_password", "reset_password", "change_email"])
        .required("Hành động không hợp lệ"),
    },
    await c.req.json()
  );

  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 1 * 60 * 1000);
    const code = Math.floor(100000 + Math.random() * 60000).toString();

    const existingVerificationCode = await prisma.verificationCode.findFirst({
      where: {
        email: user.email,
        expiresAt: { gt: getUTCTime(new Date(now.getTime())) },
      },
    });

    if (existingVerificationCode) {
      return c.json({ code: -100, message: "Vui lòng chờ 1p sau để gửi lại" });
    }

    await prisma.verificationCode.create({
      data: {
        code: CryptoJS.SHA256(code.toString()).toString(CryptoJS.enc.Hex),
        email: user.email,
        expiresAt: getUTCTime(expiresAt),
      },
    });

    const subjects: Record<VerifyAction, string> = {
      change_password: "Mã xác nhận thay đổi mật khẩu 2KFORUM",
      reset_password: "Mã xác nhận đặt lại mật khẩu 2KFORUM",
      change_email: "Mã xác nhận thay đổi email 2KFORUM",
    };
    type VerifyAction = "change_password" | "reset_password" | "change_email";

    const messages: Record<VerifyAction, string> = {
      change_password: "đang thực hiện thay đổi mật khẩu",
      reset_password: "đang thực hiện đặt lại mật khẩu",
      change_email: "đang thực hiện thay đổi email",
    };

    const mailOptions = {
      from: "shoperis.net@gmail.com",
      to: user.email,
      subject: `${code} là ${subjects[body.action as VerifyAction]} của bạn`,
      html: `<div>Bạn ${
        messages[body.action as VerifyAction]
      }, mã xác nhận là ${code}</div><br><div>Vui lòng hoàn thành trong 15 phút.</div>`,
    };

    await mailQueue.addToQueue(mailOptions);

    return c.json({
      code: 200,
      message: "Gửi mã thành công",
    });
  } catch (error) {
    console.log(error);
    return c.json({ code: -100, message: "Gửi thư thất bại" });
  }
});

// Gửi mã xác nhận thay đổi email
userController.post("/newEmailCaptcha", authMiddleware, async (c) => {
  try {
    const { user } = c.var;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    const body = await validate(
      {
        email: yup
          .string()
          .email("Email không hợp lệ")
          .required("Email không được bỏ trống"),
        action_ticket: yup
          .string()
          .required("Vui lòng tải lại trang và thử lại."),
      },
      await c.req.json()
    );

    const actionTicket = await prisma.actionTicket.findFirst({
      where: {
        userId: user.id,
        ticket: body.action_ticket,
        action: "change_email",
      },
    });

    if (!actionTicket || actionTicket.expiresAt < now) {
      return c.json({
        code: -100,
        message: "Hành động không tồn tại hoặc hết hạn.",
      });
    }

    const checkEmail = await prisma.user.findFirst({
      where: {
        email: body.email,
      },
    });

    if (checkEmail) {
      return c.json({
        code: -100,
        message: "Email đã liên kết với một tài khoản khác.",
      });
    }

    const code = Math.floor(100000 + Math.random() * 60000).toString();

    const existingVerificationCode = await prisma.verificationCode.findFirst({
      where: {
        email: body.email,
        expiresAt: { gt: getUTCTime(new Date(now.getTime() + 14 * 60 * 1000)) },
      },
    });

    if (existingVerificationCode) {
      return c.json({ code: -100, message: "Vui lòng chờ 1p sau để gửi lại" });
    }

    await prisma.verificationCode.deleteMany({
      where: {
        email: body.email,
      },
    });

    await prisma.verificationCode.create({
      data: {
        code: CryptoJS.SHA256(code.toString()).toString(CryptoJS.enc.Hex),
        email: body.email,
        expiresAt: getUTCTime(expiresAt),
      },
    });

    const mailOptions = {
      from: "shoperis.net@gmail.com",
      to: body.email,
      subject: `${code} là mã xác nhận thay đổi email của bạn`,
      html: `<div>Bạn đang thực hiện thay đổi email, mã xác nhận là ${code}</div><br><div>Vui lòng hoàn thành trong 15 phút.</div>`,
    };

    await mailQueue.addToQueue(mailOptions);

    return c.json({
      code: 200,
      message: "Gửi mã thành công",
    });
  } catch (error) {
    return c.json({ code: -100, message: "Gửi mã thất bại" });
  }
});

// Thay đổi email
userController.post("/changeEmail", authMiddleware, async (c) => {
  const { user } = c.var;
  const now = new Date();

  try {
    const body = await validate(
      {
        email: yup
          .string()
          .email("Email không hợp lệ")
          .required("Email không được bỏ trống"),
        action_ticket: yup
          .string()
          .required("Vui lòng tải lại trang và thử lại."),
        code: yup.string().trim().required("Mã xác nhận không được bỏ trống"),
      },
      await c.req.json()
    );

    // Tìm hành động
    const actionTicket = await prisma.actionTicket.findFirst({
      where: {
        userId: user.id,
        ticket: body.action_ticket,
        action: "change_email",
      },
    });

    // Nếu hành động không tồn tại hoặc hết hạn
    if (!actionTicket || actionTicket.expiresAt < now) {
      return c.json({
        code: -100,
        message: "Hành động không tồn tại hoặc hết hạn.",
      });
    }

    // Tìm mã xác nhận
    const verifyCode = await prisma.verificationCode.findFirst({
      where: {
        email: body.email,
      },
    });

    // Nếu mã xác nhận không tồn tại hoặc hết hạn
    if (!verifyCode || verifyCode.expiresAt < now) {
      return c.json({ code: -100, message: "Mã xác nhận sai hoặc hết hạn." });
    }

    // Nếu thử quá nhiều lần, xóa mã xác nhận
    if (verifyCode.attempts >= 5) {
      await prisma.verificationCode.delete({
        where: {
          id: verifyCode.id,
        },
      });
      return c.json({
        code: -100,
        message: "Thử lại quá nhiều lần, vui lòng thử lại sau.",
      });
    }

    // Kiểm tra mã xác nhận
    if (
      verifyCode.code !== CryptoJS.SHA256(body.code).toString(CryptoJS.enc.Hex)
    ) {
      console.log(
        CryptoJS.SHA256(body.code).toString(CryptoJS.enc.Hex),
        verifyCode.code
      );
      // Cập nhật số lần thử
      await prisma.verificationCode.update({
        where: {
          id: verifyCode.id,
        },
        data: {
          attempts: verifyCode.attempts + 1,
        },
      });
      return c.json({ code: -100, message: "Mã xác nhận sai hoặc hết hạn" });
    }

    const checkEmail = await prisma.user.findFirst({
      where: {
        email: body.email,
      },
    });

    if (checkEmail) {
      return c.json({
        code: -100,
        message: "Email đã liên kết với một tài khoản khác.",
      });
    }

    // Thực hiện các thao tác trong transaction
    await prisma.$transaction(async (tx) => {
      // Xóa hành động
      await tx.actionTicket.delete({
        where: {
          id: actionTicket.id,
        },
      });

      // Xóa mã xác nhận
      await tx.verificationCode.delete({
        where: {
          id: verifyCode.id,
        },
      });

      // Cập nhật email
      await tx.user.update({
        where: { id: user.id },
        data: { email: body.email },
      });
    });

    return c.json({
      code: 200,
      message: "Thay đổi email thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Thay đổi email thất bại",
    });
  }
});

// Thay đổi mật khẩu
userController.post("/changePassword", authMiddleware, async (c) => {
  const { user } = c.var;
  const now = new Date();

  try {
    const body = await validate(
      {
        password: yup
          .string()
          .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
          .required("Mật khẩu không được bỏ trống"),
        action_ticket: yup
          .string()
          .required("Vui lòng tải lại trang và thử lại."),
      },
      await c.req.json()
    );

    // Tìm hành động
    const actionTicket = await prisma.actionTicket.findFirst({
      where: {
        userId: user.id,
        ticket: body.action_ticket,
        action: "change_password",
      },
    });

    // Nếu hành động không tồn tại hoặc hết hạn
    if (!actionTicket || actionTicket.expiresAt < now) {
      return c.json({
        code: -100,
        message: "Hành động không tồn tại hoặc hết hạn.",
      });
    }

    const encodePassword = await bcrypt.hash(body.password, 10);

    // Thực hiện các thao tác trong transaction
    await prisma.$transaction(async (tx) => {
      // Xóa hành động
      await tx.actionTicket.delete({
        where: {
          id: actionTicket.id,
        },
      });

      // Cập nhật mật khẩu
      await tx.user.update({
        where: { id: user.id },
        data: { password: encodePassword },
      });
    });

    return c.json({
      code: 200,
      message: "Thay đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Thay đổi mật khẩu thất bại",
    });
  }
});

// Tạo hành động
userController.post("/actionTicket", authMiddleware, async (c) => {
  const { user } = c.var;

  const now = new Date();
  const ticket = CryptoJS.SHA256(`${now.getTime()}`).toString(CryptoJS.enc.Hex);
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  const body = await validate(
    {
      code: yup
        .string()
        .length(6, "Mã xác nhận phải có 6 ký tự")
        .required("Mã xác nhận không được bỏ trống"),
      action: yup
        .string()
        .oneOf(["change_password", "reset_password", "change_email"])
        .required("Hành động không hợp lệ"),
    },
    await c.req.json()
  );

  const verifyCode = await prisma.verificationCode.findFirst({
    where: {
      email: user.email,
      code: CryptoJS.SHA256(body.code).toString(CryptoJS.enc.Hex),
    },
  });

  if (!verifyCode || verifyCode.expiresAt < now) {
    return c.json({ code: -100, message: "Mã xác nhận sai hoặc hết hạn." });
  }

  await prisma.verificationCode.delete({
    where: {
      id: verifyCode.id,
    },
  });

  // Xóa action ticket cũ nếu có
  await prisma.actionTicket.deleteMany({
    where: {
      userId: user.id,
      action: body.action,
    },
  });

  // Tạo action ticket mới
  await prisma.actionTicket.create({
    data: {
      userId: user.id,
      ticket: ticket,
      action: body.action,
      expiresAt: getUTCTime(expiresAt),
    },
  });

  return c.json({
    code: 200,
    data: { ticket },
    message: "Tạo hành động thành công",
  });
});

// Tạo hồ sơ
userController.post("/create", async (c) => {
  const SECRET_KEY = Bun.env.SECRET_KEY ?? "";
  const body = await validate(
    {
      action_ticket: yup
        .string()
        .required("Vui lòng tải lại trang và thử lại."),
      name: yup.string().required("Họ tên không được bỏ trống."),
      birthday: yup
        .date()
        .required("Sinh nhật không được bỏ trống")
        .max(
          new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000),
          "Bạn phải đủ 18 tuổi để đăng ký"
        ),
      gender: yup
        .string()
        .required("Giới tính không được bỏ trống.")
        .oneOf(["male", "female", "other"], "Giới tính không hợp lệ"),
    },
    await c.req.json()
  );

  try {
    const now = new Date();
    const verifyAction = await prisma.actionTicket.findFirst({
      where: {
        ticket: body.action_ticket,
        action: "create_profile",
      },
      include: {
        user: true,
      },
    });

    // nếu hành động hết hạn hoặc ko tồn tại
    if (!verifyAction || verifyAction.expiresAt < now) {
      return c.json({
        code: -101,
        message: "Hành động hết hạn, vui lòng tải lại trang và thử lại.",
      });
    }

    // xoá hành động
    await prisma.actionTicket.delete({
      where: {
        id: verifyAction.id,
      },
    });

    const user = verifyAction.user;

    if (!user) {
      throw Error("Không tìm thấy người dùng");
    }

    await prisma.profile.create({
      data: {
        userId: user.id,
        name: body.name,
        gender: body.gender,
        birthday: body.birthday,
      },
    });

    const deviceId = c.req.header("device-id");

    if (!deviceId) {
      return c.json({
        code: -100,
        message: "Vui lòng tải lại trang và thử lại",
      });
    }

    const device = await prisma.userDevice.findFirst({
      where: {
        userId: user.id,
        deviceId: deviceId,
      },
    });

    if (!device) {
      return c.json({
        code: -102,
        message: "Vui lòng tải lại trang và thử lại",
      });
    }

    // Xoá các token trước đó / đăng xuất trên các thiết bị khác
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const authTokens = await generateAuthTokens(user, device.id);

    return c.json({
      code: 200,
      message: "Tạo hồ sơ thành công",
      data: authTokens,
    });
  } catch (error) {
    console.log(error);

    return c.json({ code: -100, message: "Tạo hồ sơ thất bại." });
  }
});

// Lấy danh sách ảnh
userController.get("/image", optionalAuthMiddleware, async (c) => {
  const { user } = c.var;

  try {
    const imageList = await prisma.image.findMany({
      where: {
        post: {
          userId: user.id,
          status: "ACTIVE",
          visibility: "PUBLIC",
        },
      },
      select: {
        id: true,
        url: true,
        createdAt: true,
      },
    });

    return c.json({ code: 200, imageList }, 200);
  } catch (error) {
    console.error(error);
    return c.json({ code: 500, message: "Lỗi khi lấy danh sách nh" }, 500);
  }
});

// Lấy danh sách thông báo
userController.get("/notification", authMiddleware, async (c) => {
  const { user } = c.var;
  const query = await validate(
    {
      cursor: yup.string().nullable(),
      limit: yup.number().default(10),
      unreadOnly: yup.boolean().default(false),
    },
    c.req.query()
  );

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(query.unreadOnly ? { read: false } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        message: true,
        redirectUrl: true,
        read: true,
        createdAt: true,
        sender: {
          select: {
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      cursor: query.cursor ? { id: query.cursor } : undefined,
      take: query.limit,
      skip: query.cursor ? 1 : 0,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });

    return c.json({
      code: 200,
      data: {
        list: notifications,
        hasMore: notifications.length === query.limit,
        cursor: notifications.length
          ? notifications[notifications.length - 1].id
          : null,
        unreadCount,
      },
    });
  } catch (error) {
    console.log(error);
    return c.json({ code: -100, message: "Lỗi khi lấy danh sách thông báo" });
  }
});

// Đánh dấu thông báo đã đọc
userController.put("/notification/read", authMiddleware, async (c) => {
  const { user } = c.var;
  const { notificationIds } = await validate(
    {
      notificationIds: yup
        .array()
        .of(yup.string())
        .required("Thiếu ID thông báo"),
    },
    await c.req.json()
  );

  try {
    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds,
        },
        userId: user.id, // Chỉ cập nhật thông báo của người dùng hiện tại
      },
      data: {
        read: true,
      },
    });

    return c.json({
      code: 200,
      message: "Đánh dấu thông báo đã đọc thành công",
    });
  } catch (error) {
    console.log(error);
    return c.json({
      code: -100,
      message: "Lỗi khi đánh dấu thông báo đã đọc",
    });
  }
});

// Xóa thông báo
userController.delete("/notification", authMiddleware, async (c) => {
  const { user } = c.var;
  const { notificationIds } = await validate(
    {
      notificationIds: yup
        .array()
        .of(yup.string())
        .required("Thiếu ID thông báo"),
    },
    await c.req.json()
  );

  try {
    await prisma.notification.deleteMany({
      where: {
        id: {
          in: notificationIds,
        },
        userId: user.id, // Chỉ xóa thông báo của người dùng hiện tại
      },
    });

    return c.json({
      code: 200,
      message: "Xóa thông báo thành công",
    });
  } catch (error) {
    console.log(error);
    return c.json({
      code: -100,
      message: "Lỗi khi xóa thông báo",
    });
  }
});

userController.put(
  "/name",
  every(authMiddleware, profileMiddleware),
  async (c) => {
    const { user } = c.var;
    const body = await validate(
      {
        name: yup.string().required("Họ tên không được bỏ trống"),
      },
      await c.req.json()
    );

    await prisma.profile.update({
      where: {
        userId: user.id,
      },
      data: {
        name: body.name,
      },
    });

    return c.json({
      code: 200,
      message: "Cập nhật họ tên thành công",
    });
  }
);

// Middleware lấy thông tin người dùng
userController.use("/:id/*", optionalAuthMiddleware, async (c, next) => {
  const { user } = c.var;
  const id = c.req.param("id");

  if (!id || !ObjectId.isValid(id)) {
    return c.json({ code: -100, message: "Người dùng không hợp lệ" });
  }

  const userId = await prisma.user.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      profile: {
        select: {
          name: true,
          avatarUrl: true,
          bannerUrl: true,
          bio: true,
        },
      },
    },
  });

  if (!userId) {
    return c.json({ code: -100, message: "Không tìm thấy người dùng." });
  }

  c.set("userByID", userId);
  await next();
});

// Lấy thông tin người dùng
userController.get("/:id", optionalAuthMiddleware, async (c) => {
  const { user, userByID } = c.var;

  let isFriend = false;
  let hasSentRequest = false;
  let hasReceivedRequest = false;
  let canMessage = false;
  let isFollowing = false;
  let hasBlocked = false;

  // Lấy cài đặt riêng tư
  const privacySettings = await prisma.privacySettings.findUnique({
    where: { userId: userByID.id },
  });

  // Lấy số người theo dõi và người được theo dõi
  const [followerCount, followingCount] = await Promise.all([
    prisma.follower.count({
      where: {
        followingId: userByID.id,
      },
    }),
    prisma.follower.count({
      where: {
        followerId: userByID.id,
      },
    }),
  ]);

  if (user) {
    const isBlocked = await prisma.block.findFirst({
      where: {
        blockerId: userByID.id,
        blockedId: user.id,
      },
    });

    if (isBlocked) {
      return c.json({
        code: 403,
        message: "Bạn hiện không thể xem thông tin người dùng này",
      });
    }

    // Kiểm tra trạng thái chặn
    const blockStatus = await prisma.block.findFirst({
      where: {
        blockerId: user.id,
        blockedId: userByID.id,
      },
    });

    hasBlocked = !!blockStatus;

    // Kiểm tra trạng thái bạn bè
    const friendship = await prisma.friend.findFirst({
      where: {
        userId: user.id,
        friendId: userByID.id,
      },
    });
    isFriend = !!friendship;

    if (!isFriend) {
      // Kiểm tra yêu cầu kết bạn đã gửi
      const sentRequest = await prisma.friendRequest.findFirst({
        where: {
          senderId: user.id,
          receiverId: userByID.id,
          status: "pending",
        },
      });
      hasSentRequest = !!sentRequest;

      // Kiểm tra yêu cầu kết bạn đã nhận
      const receivedRequest = await prisma.friendRequest.findFirst({
        where: {
          senderId: userByID.id,
          receiverId: user.id,
          status: "pending",
        },
      });
      hasReceivedRequest = !!receivedRequest;
    }

    // Kiểm tra quyền gửi tin nhắn
    canMessage = !privacySettings
      ? true // Nếu không có cài đặt riêng tư, mặc định là cho phép gửi tin nhắn
      : privacySettings.allowMessage === "EVERYONE" ||
        (privacySettings.allowMessage === "FRIENDS" && isFriend);

    // Kiểm tra xem người dùng hiện tại có theo dõi hồ sơ người dùng không
    const following = await prisma.follower.findFirst({
      where: {
        followerId: user.id,
        followingId: userByID.id,
      },
    });
    isFollowing = !!following;
  }

  // Kiểm tra tính hiển thị của hồ sơ
  const canViewProfile = !privacySettings
    ? true // Nếu không có cài đặt riêng tư, mặc định là cho phép xem
    : privacySettings.showProfileTo === "EVERYONE" ||
      (privacySettings.showProfileTo === "FRIENDS" && isFriend) ||
      (user && user.id === userByID.id); // Người dùng có thể xem hồ sơ của chính mình

  if (!canViewProfile) {
    return c.json({
      code: 403,
      message: "Không có quyền xem thông tin người dùng này",
    });
  }

  // Add isShowFollowing calculation after the canViewProfile check
  const isShowFollowing = !privacySettings
    ? true // If no privacy settings, default to showing following list
    : privacySettings.showFollowing || (user && user.id === userByID.id); // Show if enabled or viewing own profile

  const canFollow = !privacySettings
    ? true // Nếu không có cài đặt riêng tư, mặc định là cho phép theo dõi
    : privacySettings.allowFollow;

  return c.json({
    code: 200,
    data: {
      ...userByID,
      isFriend,
      hasSentRequest,
      hasReceivedRequest,
      canMessage,
      isFollowing,
      isShowFollowing,
      canFollow,
      hasBlocked,
      _count: {
        followers: followerCount,
        following: followingCount,
      },
    },
  });
});

// Lấy danh sách bài viết
userController.get("/:id/posts", optionalAuthMiddleware, async (c) => {
  const { user, userByID } = c.var;

  const { page = "1", pageSize = "10" } = c.req.query();

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize) + 1;

  try {
    const posts = await prisma.post.findMany({
      where: {
        userId: userByID.id,
        groupId: { isSet: false },
        ...postCondition(user),
      },
      select: postSelect(user),
      skip: skip,
      take: take,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Kiểm tra isLiked cho từng bài viết
    const postsWithLikeStatus = posts.map((post) => ({
      ...post,
      isLiked: user ? post.reactions.length > 0 : false,
    }));

    const hasMore = posts.length === take;

    return c.json({
      code: 200,
      data: {
        list: postsWithLikeStatus,
        hasMore,
      },
    });
  } catch (error) {
    return c.json({ code: -100, message: "Lỗi khi lấy danh sách bài viết" });
  }
});

// Lấy danh sách bạn bè
userController.get("/:id/friends", optionalAuthMiddleware, async (c) => {
  const { userByID } = c.var;

  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = 9;
  const skip = (page - 1) * limit;

  try {
    const friends = await prisma.friend.findMany({
      where: {
        userId: userByID.id,
      },
      select: {
        userId: true,
        friend: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    const friendList = friends.map((relation) => {
      return relation.userId === userByID.id ? relation.friend : relation.user;
    });

    const hasMore = friendList.length === limit;

    return c.json({ code: 200, data: { hasMore, list: friendList } }, 200);
  } catch (error) {
    console.error(error);
    return c.json({ code: 500, message: "Lỗi khi lấy danh sách bạn bè" }, 500);
  }
});

// Lấy danh sách ảnh
userController.get("/:id/images", optionalAuthMiddleware, async (c) => {
  const { userByID } = c.var;

  const { page = "1", pageSize = "10" } = c.req.query();
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize) + 1;

  try {
    const images = await prisma.image.findMany({
      where: {
        post: {
          userId: userByID.id,
          status: PostStatus.ACTIVE,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: skip,
      take: take,
    });

    const hasMore = images.length === take;

    return c.json({
      code: 200,
      data: {
        list: images,
        hasMore: hasMore,
      },
    });
  } catch (error) {
    return c.json({ code: -100, message: "Lấy ảnh thất bại" });
  }
});

// Lấy danh sách người đang được theo dõi
userController.get("/:id/following", optionalAuthMiddleware, async (c) => {
  const { user, userByID } = c.var;
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "10", 10);
  const search = c.req.query("search") || "";
  const skip = (page - 1) * limit;

  try {
    // Get privacy settings
    const privacySettings = await prisma.privacySettings.findUnique({
      where: { userId: userByID.id },
    });

    // Check if user has permission to view following list
    if (privacySettings && !privacySettings.showFollowing) {
      // Only allow viewing if it's the user's own profile
      if (!user || user.id !== userByID.id) {
        return c.json({
          code: 403,
          message: "Không có quyền xem danh sách đang theo dõi",
        });
      }
    }

    // Lấy danh sách đang theo dõi với phân trang và tìm kiếm
    const following = await prisma.follower.findMany({
      where: {
        followerId: userByID.id,
        following: {
          profile: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      select: {
        following: {
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
      orderBy: {
        following: {
          profile: {
            name: "asc",
          },
        },
      },
    });

    // Lấy số lượng người theo dõi và trạng thái đang theo dõi cho mỗi người dùng
    const followingWithCounts = await Promise.all(
      following.map(async (f) => {
        const [followerCount, followingCount, isFollowing] = await Promise.all([
          // Lấy số lượng người theo dõi
          prisma.follower.count({
            where: {
              followingId: f.following.id,
            },
          }),
          // Lấy số lượng đang theo dõi
          prisma.follower.count({
            where: {
              followerId: f.following.id,
            },
          }),
          // Kiểm tra xem người dùng hiện tại có đang theo dõi người này không
          user && user.id !== f.following.id
            ? prisma.follower.findFirst({
                where: {
                  followerId: user.id,
                  followingId: f.following.id,
                },
              })
            : Promise.resolve(null),
        ]);

        return {
          ...f.following,
          // Nếu là người dùng hiện tại đang xem danh sách following của chính họ
          // thì tất cả người dùng trong danh sách đều đang được follow
          isFollowing: userByID.id === user?.id ? true : !!isFollowing,
          _count: {
            followers: followerCount,
            following: followingCount,
          },
        };
      })
    );

    const hasMore = following.length > limit;
    if (hasMore) {
      followingWithCounts.pop();
    }

    return c.json({
      code: 200,
      data: {
        list: followingWithCounts,
        hasMore,
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: 500,
      message: "Lỗi khi lấy danh sách đang theo dõi",
    });
  }
});

export default userController;
