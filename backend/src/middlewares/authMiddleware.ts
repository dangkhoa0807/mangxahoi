import { createMiddleware } from "hono/factory";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import prisma from "@/libs/prisma";

type user = Prisma.UserGetPayload<{}>;
type profile = Prisma.ProfileGetPayload<{}>;

interface UserWithRole extends user {
  roles: string[];
  profile: profile;
}

type Env = {
  Variables: {
    user: UserWithRole;
  };
};

const optionalAuthMiddleware = createMiddleware<Env>(async (c, next) => {
  const SECRET_KEY = Bun.env.SECRET_KEY ?? "";
  const authHeader = c.req.header("authorization");

  // Nếu không có header Authorization, tiếp tục mà không xác thực
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    await next();
    return;
  }

  const token = authHeader.split(" ")[1];

  if (token) {
    try {
      // Xác thực token
      const decoded = jwt.verify(token, SECRET_KEY);

      // Nếu xác thực thành công, set thông tin người dùng vào context
      c.set("user", decoded as any);
    } catch (error) {
      c.header("auth-status", "invalid");
    }
  }

  await next();
});

const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const SECRET_KEY = Bun.env.SECRET_KEY ?? "";
  const authHeader = c.req.header("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({
      code: 401,
      message: "Vui lòng đăng nhập và thử lại.",
    });
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    return c.json({
      code: 401,
      message: "Vui lòng đăng nhập và thử lại.",
    });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as {
      id: string;
      exp: number;
    };

    // Thêm truy vấn database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: true,
        roles: true,
      },
    });

    if (!user) {
      return c.json({
        code: 401,
        message: "Người dùng không tồn tại.",
      });
    }

    c.set("user", user as unknown as UserWithRole);
  } catch (error) {
    return c.json({
      code: 401,
      message: "Vui lòng tải lại trang và thử lại.",
    });
  }

  await next();
});

export { authMiddleware, optionalAuthMiddleware };
