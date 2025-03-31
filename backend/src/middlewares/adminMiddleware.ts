import { Context, Next } from "hono";
import prisma from "@/libs/prisma";
import { authMiddleware } from "./authMiddleware";

export const adminMiddleware = async (c: Context, next: Next) => {
  await authMiddleware(c, async () => {});

  const { user } = c.var;

  try {
    // Check if user has admin role
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        role: "ADMIN",
      },
    });

    if (!userRole) {
      return c.json({
        code: 403,
        message: "Không có quyền truy cập",
      });
    }

    await next();
  } catch (error) {
    return c.json({
      code: 500,
      message: "Lỗi khi kiểm tra quyền truy cập",
    });
  }
};
