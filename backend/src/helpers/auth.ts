import prisma from "@/libs/prisma";
import jwt from "jsonwebtoken";
import { getUTCTime } from "@/libs/time";
import { maskEmail } from "@/libs/string";
import { mailQueue } from "@/libs/mailQueue";
import { User } from "@prisma/client";
import CryptoJS from "crypto-js";

async function generateAuthTokens(user: any, deviceId: string) {
  const SECRET_KEY = Bun.env.SECRET_KEY ?? "";

  const accessToken = jwt.sign(
    {
      id: user.id,
      email: maskEmail(user.email),
      profile: user.profile,
    },
    SECRET_KEY,
    { expiresIn: "1h" }
  );

  const refreshToken = jwt.sign(
    {
      user_id: user.id,
    },
    SECRET_KEY,
    { expiresIn: "30d" }
  );

  const now = new Date();
  const expired_at = new Date();
  expired_at.setDate(now.getDate() + 30);

  // Xoá refresh token cũ
  await prisma.refreshToken.deleteMany({
    where: {
      userId: user.id,
      deviceId: deviceId,
    },
  });

  // Tạo refresh token mới
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiredAt: getUTCTime(expired_at),
      deviceId: deviceId,
    },
  });

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

async function sendCodeVerifyDevice(user: User) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 phút
  const code = Math.floor(100000 + Math.random() * 60000).toString();

  const existingVerificationCode = await prisma.verificationCode.findFirst({
    where: {
      email: user.email,
      expiresAt: { gt: getUTCTime(new Date(now.getTime())) },
    },
  });

  if (existingVerificationCode) {
    return {
      code: -100,
      message: "Vui lòng chờ 1p sau để gửi lại",
    };
  }

  await prisma.verificationCode.create({
    data: {
      code: CryptoJS.SHA256(code.toString()).toString(CryptoJS.enc.Hex),
      email: user.email,
      expiresAt: getUTCTime(expiresAt),
    },
  });

  const mailOptions = {
    from: "shoperis.net@gmail.com",
    to: user.email,
    subject: `${code} là mã xác minh thiết bị mới của bạn`,
    html: `<div>Mã xác minh thiết bị mới của bạn là ${code}</div><br><div>Vui lòng hoàn thành trong 15 phút.</div>`,
  };

  await mailQueue.addToQueue(mailOptions);

  return {
    code: 200,
    message: "Mã xác minh đã được gửi đến email của bạn",
  };
}

async function createProfileTicket(user: User) {
  const now = new Date();
  const expiredAt = new Date(now.getTime() + 15 * 60 * 1000);

  const ticket = CryptoJS.SHA256(`${now.getTime()}`).toString(CryptoJS.enc.Hex);

  // xoá các action ticket tạo profile trước đó nếu có
  await prisma.actionTicket.deleteMany({
    where: {
      userId: user.id,
      action: "create_profile",
    },
  });

  // tạo action ticket mới
  await prisma.actionTicket.create({
    data: {
      userId: user.id,
      ticket: ticket,
      action: "create_profile",
      expiresAt: getUTCTime(expiredAt),
    },
  });

  return {
    code: 201,
    message: "Hãy tạo hồ sơ để tiếp tục.",
    data: {
      action_ticket: ticket,
    },
  };
}

export { generateAuthTokens, sendCodeVerifyDevice, createProfileTicket };
