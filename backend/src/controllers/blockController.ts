import { Hono } from "hono";
import prisma from "@/libs/prisma";
import { authMiddleware } from "@/middlewares/authMiddleware";

const blockController = new Hono();

// Middleware for authentication
blockController.use("*", authMiddleware);

// Chặn người dùng
blockController.post("/:id", async (c) => {
  const { user } = c.var;
  const blockedId = c.req.param("id");

  if (user.id === blockedId) {
    return c.json({
      code: -100,
      message: "Bạn không thể chặn chính mình",
    });
  }

  try {
    // Kiểm tra đã chặn hay chưa
    const existingBlock = await prisma.block.findFirst({
      where: {
        blockerId: user.id,
        blockedId: blockedId,
      },
    });

    if (existingBlock) {
      return c.json({
        code: -101,
        message: "Người dùng đã bị chặn trước đó",
      });
    }

    await prisma.block.create({
      data: {
        blockerId: user.id,
        blockedId: blockedId,
      },
    });
    return c.json({
      code: 200,
      message: "Đã chặn người dùng thành công",
    });
  } catch (error) {
    return c.json({ code: 500, message: "Lỗi khi chặn người dùng" });
  }
});

// Bỏ chặn người dùng
blockController.delete("/:id", async (c) => {
  const { user } = c.var;
  const blockedId = c.req.param("id");

  try {
    await prisma.block.deleteMany({
      where: {
        blockerId: user.id,
        blockedId: blockedId,
      },
    });
    return c.json({ code: 200, message: "Đã bỏ chặn người dùng thành công" });
  } catch (error) {
    return c.json({ code: 500, message: "Lỗi khi bỏ chặn người dùng" });
  }
});

// Lấy danh sách người dùng đã chặn
blockController.get("/", async (c) => {
  const { user } = c.var;

  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "10", 10);
  const skip = (page - 1) * limit;

  try {
    const blockedUsers = await prisma.block.findMany({
      where: {
        blockerId: user.id,
      },
      include: {
        blocked: {
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

    const hasMore = blockedUsers.length > limit;

    if (hasMore) {
      blockedUsers.pop();
    }

    return c.json({
      code: 200,
      data: {
        list: blockedUsers,
        paginate: {
          hasMore: hasMore,
        },
      },
    });
  } catch (error) {
    return c.json({
      code: 500,
      message: "Lỗi khi lấy danh sách người dùng đã chặn",
    });
  }
});

export default blockController;
