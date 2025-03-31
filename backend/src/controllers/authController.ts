import { Hono } from "hono";
import prisma from "@/libs/prisma";
import * as bcrypt from "bcryptjs";
import { decode, sign } from "hono/jwt";
import { OAuth2Client } from "google-auth-library";
import { validate, yup } from "@/libs/validate";
import { ref } from "yup";
import CryptoJS from "crypto-js";
import { getUTCTime } from "@/libs/time";
import jwt from "jsonwebtoken";
import { optionalAuthMiddleware } from "@/middlewares/authMiddleware";
import { mailQueue } from "@/libs/mailQueue";
import DiscordOauth2 from "discord-oauth2";
import {
  createProfileTicket,
  generateAuthTokens,
  sendCodeVerifyDevice,
} from "@/helpers/auth";
import { getDeviceName } from "@/libs/device";
const authController = new Hono();

// Đăng nhập
authController.post("/login", async (c) => {
  const SECRET_KEY = Bun.env.SECRET_KEY;

  const data = await validate(
    {
      email: yup
        .string()
        .email("Email phải đúng định dạng")
        .required("Không bỏ trống email"),
      password: yup
        .string()
        .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
        .required("Mật khẩu không được bỏ trống"),
    },
    await c.req.json()
  );

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
      },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return c.json({ code: -100, message: "Tài khoản không tồn tại" });
    }

    if (!user.password) {
      return c.json({ code: -101, message: "Tài khoản chưa đăng ký mật khẩu" });
    }

    const decodePassword = await bcrypt.compare(data.password, user.password);

    if (!decodePassword) {
      return c.json({ code: -100, message: "Mật Khẩu không chính xác" });
    }

    if (!SECRET_KEY) {
      throw new Error("SECRET_KEY is not defined");
    }

    const deviceId = c.req.header("device-id");

    if (!deviceId) {
      return c.json({ code: -100, message: "Thiếu tham số" });
    }

    // Xác minh thiết bị
    const deviceCheck = await prisma.userDevice.findFirst({
      where: {
        userId: user.id,
        deviceId: deviceId,
      },
    });

    if (!deviceCheck) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 phút

      const ticket = CryptoJS.SHA256(`${now.getTime()}`).toString(
        CryptoJS.enc.Hex
      );

      // xoá các action ticket tạo profile trước đó nếu có
      await prisma.actionTicket.deleteMany({
        where: {
          userId: user.id,
          action: "verify_device",
        },
      });

      // tạo action ticket mới
      await prisma.actionTicket.create({
        data: {
          userId: user.id,
          ticket: ticket,
          action: "verify_device",
          expiresAt: getUTCTime(expiresAt),
        },
      });

      return c.json({
        code: 202,
        message: "Hãy xác minh thiết bị để tiếp tục.",
        data: {
          action_ticket: ticket,
        },
      });
    }

    if (!user.profile) {
      return c.json(await createProfileTicket(user));
    }

    // Xoá các token trước đó / đăng xuất trên các thiết bị khác
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const tokens = await generateAuthTokens(user, deviceCheck.id);

    return c.json({
      code: 200,
      message: "Đăng nhập thành công",
      data: tokens,
    });
  } catch (error) {
    return c.json({ code: -100, message: "Đăng nhập thất bại" });
  }
});

// Đăng ký
authController.post("/register", async (c) => {
  const body = await validate(
    {
      email: yup
        .string()
        .email("Email phải đúng định dạng")
        .required("Không bỏ trống email"),
      code: yup
        .string()
        .length(6, "Mã xác nhận phải có 6 ký tự")
        .required("Mã xác nhận không được bỏ trống"),
      password: yup
        .string()
        .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
        .required("Mật khẩu không được bỏ trống"),
      confirm_password: yup
        .string()
        .oneOf([ref("password"), ""], "Mật khẩu xác nhận không khớp")
        .required("Xác nhận mật khẩu không được bỏ trống"),
    },
    await c.req.json()
  );
  const now = new Date();

  try {
    const verifyCode = await prisma.verificationCode.findFirst({
      where: {
        email: body.email,
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

    const checkExist = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (checkExist) {
      return c.json({ code: -100, message: "Email đã được đăng Kí" });
    }

    const encodePassword = await bcrypt.hash(body.password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: body.email,
        password: encodePassword,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: newUser.id,
        role: "USER",
      },
    });

    return c.json({
      code: 200,
      message: "Đăng ký tài khoản thành công",
    });
  } catch (error) {
    return c.json({ code: -100, message: "Đăng ký thất bại" });
  }
});

// Đăng xuất
authController.post("/logout", optionalAuthMiddleware, async (c) => {
  const user = c.var.user;

  if (user) {
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
      },
    });
  }

  return c.json({ code: 200, msg: "Đăng xuất thành công" });
});

// Đặt lại mật khẩu
authController.post("/resetPassword", async (c) => {
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
    const now = new Date();

    // Tìm action ticket
    const actionTicket = await prisma.actionTicket.findFirst({
      where: {
        ticket: body.action_ticket,
        action: "reset_password",
      },
      include: {
        user: true,
      },
    });

    // Kiểm tra action ticket có tồn tại và còn hạn không
    if (!actionTicket || actionTicket.expiresAt < now) {
      return c.json({
        code: -100,
        message: "Hành động không tồn tại hoặc đã hết hạn.",
      });
    }

    const user = actionTicket.user;
    if (!user) {
      return c.json({
        code: -100,
        message: "Không tìm thấy người dùng",
      });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Cập nhật mật khẩu
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    // Xóa action ticket sau khi sử dụng
    await prisma.actionTicket.delete({
      where: {
        id: actionTicket.id,
      },
    });

    // Đăng xuất khỏi tất cả các thiết bị
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
      },
    });
    return c.json({
      code: 200,
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Đặt lại mật khẩu thất bại",
    });
  }
});

// Verify google code
authController.post("/google", async (c) => {
  try {
    const body = await validate(
      {
        code: yup.string().required("Vui lòng tải lại trang và thử lại."),
      },
      await c.req.json()
    );

    const client = new OAuth2Client(
      Bun.env.GOOGLE_CLIENT_ID,
      Bun.env.GOOGLE_CLIENT_SECRET,
      Bun.env.GOOGLE_CALLBACK_URL
    );

    const { tokens } = await client.getToken(body.code);
    client.setCredentials(tokens);
    const { id_token } = tokens;

    if (typeof id_token !== "string") {
      return c.json({ error: "Invalid code format" }, 400);
    }

    const decoded = decode(id_token);
    const { email, name, picture } = decoded?.payload ?? {};

    if (!email) {
      return c.json({ error: "Email not found in token" }, 400);
    }

    let user = await prisma.user.findUnique({
      where: { email: email as string },
      include: { profile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email: email as string, password: "" },
        include: { profile: true },
      });
      await prisma.userRole.create({
        data: {
          userId: user.id,
          role: "USER",
        },
      });
    }

    const deviceId = c.req.header("device-id");

    if (!deviceId) {
      return c.json({
        code: -100,
        message: "Vui lòng tải lại trang và thử lại.",
      });
    }

    const deviceName = await getDeviceName(c.req.header("user-agent") || "");

    let deviceCheck = await prisma.userDevice.findFirst({
      where: {
        userId: user.id,
        deviceId: deviceId,
      },
    });

    if (!deviceCheck) {
      deviceCheck = await prisma.userDevice.create({
        data: {
          userId: user.id,
          deviceId: deviceId,
          deviceName: deviceName,
        },
      });
    }

    if (!user.profile) {
      const now = new Date();
      const expiredAt = new Date(now.getTime() + 15 * 60 * 1000);
      const ticket = CryptoJS.SHA256(`${now.getTime()}`).toString(
        CryptoJS.enc.Hex
      );

      await prisma.actionTicket.deleteMany({
        where: { userId: user.id, action: "create_profile" },
      });

      await prisma.actionTicket.create({
        data: {
          userId: user.id,
          ticket: ticket,
          action: "create_profile",
          expiresAt: expiredAt,
        },
      });

      return c.json({
        code: 201,
        message: "Hãy tạo hồ sơ để tiếp tục.",
        data: { action_ticket: ticket },
      });
    }

    const authTokens = await generateAuthTokens(user, deviceCheck.id);

    return c.json({
      code: 200,
      message: "Đăng nhập thành công",
      data: authTokens,
    });
  } catch (error) {
    console.log(error);
    return c.json({ code: -100, message: "Đăng nhập google thất bại" });
  }
});

// Gửi mail xác minh thiết bị mới
authController.post("/newDeviceCaptcha", async (c) => {
  const body = await validate(
    {
      action_ticket: yup
        .string()
        .required("Vui lòng tải lại trang và thử lại."),
    },
    await c.req.json()
  );

  const now = new Date();

  const checkActionTicket = await prisma.actionTicket.findFirst({
    where: {
      ticket: body.action_ticket,
      action: "verify_device",
    },
    include: {
      user: true,
    },
  });

  if (
    !checkActionTicket ||
    checkActionTicket.expiresAt < now ||
    !checkActionTicket.user
  ) {
    return c.json({
      code: -100,
      message: "Hành động không tồn tại hoặc đã hết hạn.",
    });
  }

  const result = await sendCodeVerifyDevice(checkActionTicket.user);

  return c.json(result);
});

// Xác minh thiết bị mới
authController.post("/verifyNewDevice", async (c) => {
  const body = await validate(
    {
      code: yup.string().required("Vui lòng tải lại trang và thử lại."),
      action_ticket: yup
        .string()
        .required("Vui lòng tải lại trang và thử lại."),
    },
    await c.req.json()
  );

  // Lấy thông tin thiết bị
  const deviceId = c.req.header("device-id");
  const deviceName = await getDeviceName(c.req.header("user-agent") || "");

  if (!deviceId || !deviceName) {
    return c.json({ code: -100, message: "Vui lòng tải lại trang và thử lại" });
  }

  // Kiểm tra vé hành động
  const now = new Date();

  const checkActionTicket = await prisma.actionTicket.findFirst({
    where: {
      ticket: body.action_ticket,
      action: "verify_device",
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  if (
    !checkActionTicket ||
    checkActionTicket.expiresAt < now ||
    !checkActionTicket.user
  ) {
    return c.json({
      code: -100,
      message: "Hành động không tồn tại hoặc đã hết hạn.",
    });
  }

  // Kiểm tra mã xác nhận
  const checkCode = await prisma.verificationCode.findFirst({
    where: {
      email: checkActionTicket.user.email,
      code: CryptoJS.SHA256(body.code).toString(CryptoJS.enc.Hex),
    },
  });

  if (!checkCode || checkCode.expiresAt < now) {
    return c.json({
      code: -100,
      message: "Mã xác nhận sai hoặc hết hạn.",
    });
  }

  // Xóa mã xác nhận
  await prisma.verificationCode.delete({
    where: { id: checkCode.id },
  });

  // Tạo thiết bị mới
  const newDevice = await prisma.userDevice.create({
    data: {
      userId: checkActionTicket.user.id,
      deviceId: deviceId,
      deviceName: deviceName,
    },
  });

  const user = checkActionTicket.user;

  if (!user.profile) {
    return c.json(await createProfileTicket(user));
  }

  // Tạo token mới
  const authTokens = await generateAuthTokens(
    checkActionTicket.user,
    newDevice.id
  );

  return c.json({
    code: 200,
    message: "Xác minh thiết bị thành công",
    data: authTokens,
  });
});

// Gửi mã xác nhận
authController.post("/emailCaptcha", async (c) => {
  const body = await validate(
    {
      email: yup
        .string()
        .email("Email phải đúng định dạng")
        .required("Không bỏ trống email"),
      action: yup
        .string()
        .oneOf(["reset_password", "register"])
        .required("Hành động không hợp lệ"),
    },
    await c.req.json()
  );

  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 1 * 60 * 1000);
    const code = Math.floor(100000 + Math.random() * 60000).toString();

    if (body.action == "reset_password") {
      const user = await prisma.user.findFirst({
        where: { email: body.email },
      });

      if (!user) {
        return c.json({ code: -100, message: "Tài khoản không tồn tại" });
      }
    }

    const existingVerificationCode = await prisma.verificationCode.findFirst({
      where: {
        email: body.email,
        expiresAt: { gt: getUTCTime(new Date(now.getTime())) },
      },
    });

    if (existingVerificationCode) {
      return c.json({ code: -100, message: "Vui lòng chờ 1p sau để gửi lại" });
    }

    await prisma.verificationCode.create({
      data: {
        code: CryptoJS.SHA256(code.toString()).toString(CryptoJS.enc.Hex),
        email: body.email,
        expiresAt: getUTCTime(expiresAt),
      },
    });

    const subjects: Record<VerifyAction, string> = {
      register: "Mã xác nhận đăng ký tài khoản TWOK",
      change_password: "Mã xác nhận thay đổi mật khẩu TWOK",
      reset_password: "Mã xác nhận đặt lại mật khẩu TWOK",
      change_email: "Mã xác nhận thay đổi email TWOK",
    };
    type VerifyAction =
      | "change_password"
      | "reset_password"
      | "change_email"
      | "register";

    const messages: Record<VerifyAction, string> = {
      register: "đang thực hiện đăng ký tài khoản",
      change_password: "đang thực hiện thay đổi mật khẩu",
      reset_password: "đang thực hiện đặt lại mật khẩu",
      change_email: "đang thực hiện thay đổi email",
    };

    const mailOptions = {
      from: "shoperis.net@gmail.com",
      to: body.email,
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

// Tạo hành động
authController.post("/actionTicket", async (c) => {
  const now = new Date();
  const ticket = CryptoJS.SHA256(`${now.getTime()}`).toString(CryptoJS.enc.Hex);
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  const body = await validate(
    {
      email: yup
        .string()
        .email("Email phải đúng định dạng")
        .required("Không bỏ trống email"),
      code: yup
        .string()
        .length(6, "Mã xác nhận phải có 6 ký tự")
        .required("Mã xác nhận không được bỏ trống"),
      action: yup
        .string()
        .oneOf(["reset_password"])
        .required("Hành động không hợp lệ"),
    },
    await c.req.json()
  );

  const user = await prisma.user.findFirst({
    where: { email: body.email },
  });

  if (!user) {
    return c.json({ code: -100, message: "Tài khoản không tồn tại" });
  }

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

// Tạo token mới
authController.post("/refreshToken", async (c) => {
  const SECRET_KEY = Bun.env.SECRET_KEY ?? "";
  const body = await validate(
    {
      refresh_token: yup.string().required("Vui lòng đăng nhập lại."),
    },
    await c.req.json()
  );

  const deviceId = c.req.header("device-id");

  if (!deviceId) {
    return c.json({ code: -100, message: "Vui lòng tải lại trang và thử lại" });
  }

  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token: body.refresh_token,
      expiredAt: {
        gt: getUTCTime(new Date()),
      },
    },
  });

  if (!storedToken) {
    return c.json({
      code: -101,
      msg: "Token đã hết hạn sử dụng, vui lòng đăng nhập lại",
    });
  }

  try {
    const decode = jwt.verify(body.refresh_token, SECRET_KEY) as any;

    const user = await prisma.user.findFirst({
      where: {
        id: decode.user_id,
      },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return c.json({ code: -104, msg: "Tài khoản không còn hoạt động" });
    }

    const device = await prisma.userDevice.findFirst({
      where: {
        userId: user.id,
        deviceId: deviceId,
      },
    });

    if (!device) {
      return c.json({ code: -102, msg: "Vui lòng đăng nhập lại" });
    }

    await prisma.userDevice.update({
      where: { id: device.id },
      data: { lastLoginAt: getUTCTime(new Date()) },
    });

    const authTokens = await generateAuthTokens(user, device.id);

    return c.json({
      code: 200,
      message: "Tạo token mới thành công",
      data: authTokens,
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Tạo token mới thât bại",
    });
  }
});

const discordOauth = new DiscordOauth2({
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  redirectUri: process.env.DISCORD_CALLBACK_URL,
});

// Tạo yêu cầu đăng nhập discord
authController.get("/discord", async (c) => {
  try {
    const url = discordOauth.generateAuthUrl({
      scope: ["identify", "email"],
    });

    return c.json({ code: 200, data: { url } });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Tạo yêu cầu đăng nhập discord thất bại",
    });
  }
});

// Đăng nhập discord
authController.post("/discord", async (c) => {
  try {
    const body = await validate(
      {
        code: yup.string().required("Vui lòng đăng nhập lại."),
      },
      await c.req.json()
    );

    const deviceId = c.req.header("device-id");
    const deviceName = await getDeviceName(c.req.header("user-agent") || "");

    if (!deviceId) {
      return c.json({
        code: -100,
        message: "Vui lòng tải lại trang và thử lại",
      });
    }

    const token = await discordOauth.tokenRequest({
      code: body.code,
      scope: ["identify", "email"],
      grantType: "authorization_code",
    });

    const user = await discordOauth.getUser(token.access_token);

    if (!user || !user.email) {
      return c.json({ code: -100, message: "Đăng nhập discord thất bại" });
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: user.email },
    });

    if (!existingUser) {
      const newUser = await prisma.user.create({
        data: {
          email: user.email,
          password: null,
        },
      });

      const device = await prisma.userDevice.create({
        data: {
          userId: newUser.id,
          deviceId: deviceId,
          deviceName: deviceName,
        },
      });

      await prisma.userRole.create({
        data: {
          userId: newUser.id,
          role: "USER",
        },
      });

      await prisma.profile.create({
        data: {
          userId: newUser.id,
          name: user.global_name ?? user.username,
          gender: "other",
          birthday: new Date(),
          avatarUrl: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
          bannerUrl: `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.png`,
        },
      });

      const authTokens = await generateAuthTokens(newUser, device.id);

      return c.json({
        code: 200,
        data: authTokens,
      });
    }

    let device = await prisma.userDevice.findFirst({
      where: {
        userId: existingUser.id,
        deviceId: deviceId,
      },
    });

    if (!device) {
      device = await prisma.userDevice.create({
        data: {
          userId: existingUser.id,
          deviceId: deviceId,
          deviceName: deviceName,
        },
      });
    }

    const authTokens = await generateAuthTokens(existingUser, device.id);

    return c.json({ code: 200, data: authTokens });
  } catch (error) {
    console.log(error);
    return c.json({ code: -100, message: "Đăng nhập discord thất bại" });
  }
});

export default authController;
