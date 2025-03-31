import { Hono } from "hono";
import prisma from "@/libs/prisma";
import { validate, yup } from "@/libs/validate";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { BanRestriction } from "@prisma/client";
import { getUTCTime } from "@/libs/time";
import { ObjectId } from "mongodb";

const banController = new Hono();

banController.use("*", authMiddleware);

// Lấy danh sách người dùng đang bị cấm / hạn chế
banController.get("/", async (c) => {
  const { page = "1", pageSize = "10", search = "" } = c.req.query();

  try {
    const [bannedUsers, pagination] = await prisma.bannedUser
      .paginate({
        where: {
          OR: [
            { endAt: { isSet: false } },
            { endAt: null },
            { endAt: { gt: getUTCTime(new Date()) } },
          ],
          user: {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { profile: { name: { contains: search, mode: "insensitive" } } },
            ],
          },
        },
        include: {
          user: {
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
          admin: {
            select: {
              email: true,
              profile: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          startAt: "desc",
        },
      })
      .withPages({
        page: parseInt(page),
        limit: parseInt(pageSize),
        includePageCount: true,
      });

    return c.json({
      code: 200,
      data: {
        list: bannedUsers,
        pagination,
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: 500,
      message: "Lỗi khi lấy danh sách người dùng bị cấm",
    });
  }
});

// Cấm người dùng
banController.post("/", async (c) => {
  const { user } = c.var;

  const body = await validate(
    {
      restriction: yup
        .string()
        .oneOf(["FULL_BAN", "COMMENT_BAN", "POST_BAN", "REACTION_BAN"])
        .required("Hình thức cấm là bắt buộc"),
      reason: yup.string().required("Lý do cấm là bắt buộc"),
      endAt: yup.date().nullable(),
      userId: yup.string().required("ID người dùng là bắt buộc"),
    },
    await c.req.json()
  );

  if (!ObjectId.isValid(body.userId)) {
    return c.json({ code: -100, message: "ID người dùng không hợp lệ" });
  }

  try {
    // Kiểm tra người dùng có tồn tại không
    const targetUser = await prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!targetUser) {
      return c.json({ code: -100, message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra xem người dùng đã bị cấm với hình thức này chưa
    const existingBan = await prisma.bannedUser.findFirst({
      where: {
        userId: body.userId,
        restriction: body.restriction,
        OR: [{ endAt: null }, { endAt: { gt: getUTCTime(new Date()) } }],
      },
    });

    if (existingBan) {
      return c.json({
        code: -101,
        message: "Người dùng đã bị cấm với hình thức này",
      });
    }

    // Tính toán ngày hết hạn nếu không là cấm vĩnh viễn

    // Tạo lệnh cấm mới
    const ban = await prisma.bannedUser.create({
      data: {
        userId: body.userId,
        bannedBy: user.id,
        reason: body.reason,
        restriction: body.restriction,
        endAt: body.endAt,
      },
    });

    return c.json({
      code: 200,
      message: "Cấm người dùng thành công",
      data: ban,
    });
  } catch (error) {
    console.error(error);
    return c.json({ code: 500, message: "Lỗi khi cấm người dùng" });
  }
});

// Lấy lịch sử cấm người dùng
banController.get("/history/:userId", async (c) => {
  const userId = c.req.param("userId");

  try {
    const banHistory = await prisma.bannedUser.findMany({
      where: {
        userId,
      },
      include: {
        admin: {
          select: {
            email: true,
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startAt: "desc",
      },
    });

    return c.json({
      code: 200,
      data: banHistory,
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: 500,
      message: "Lỗi khi lấy lịch sử cấm của người dùng",
    });
  }
});

// Gỡ cấm người dùng
banController.delete("/:userId/:restriction", async (c) => {
  const userId = c.req.param("userId");
  const restriction = c.req.param("restriction");

  console.log(userId, restriction);

  try {
    const activeBan = await prisma.bannedUser.findFirst({
      where: {
        userId,
        restriction: restriction as BanRestriction,
        OR: [
          { endAt: null },
          { endAt: { isSet: false } },
          { endAt: { gt: getUTCTime(new Date()) } },
        ],
      },
    });

    if (!activeBan) {
      return c.json({
        code: -100,
        message: "Không tìm thấy lệnh cấm đang hoạt động",
      });
    }

    await prisma.bannedUser.update({
      where: { id: activeBan.id },
      data: {
        endAt: new Date(),
      },
    });

    return c.json({
      code: 200,
      message: "Bỏ cấm thành công",
    });
  } catch (error) {
    // console.error(error);
    return c.json({ code: 500, message: "Lỗi khi bỏ cấm người dùng" });
  }
});

// Chỉnh sửa lệnh cấm
banController.put("/", async (c) => {
  const body = await validate(
    {
      id: yup.string().required("ID lệnh cấm là bắt buộc"),
      reason: yup.string().required("Lý do cấm là bắt buộc"),
      restriction: yup
        .string()
        .oneOf(["FULL_BAN", "COMMENT_BAN", "POST_BAN", "REACTION_BAN"])
        .required("Hình thức cấm là bắt buộc"),
      endAt: yup.date().nullable(),
    },
    await c.req.json()
  );

  try {
    // Kiểm tra lệnh cấm có tồn tại không
    const existingBan = await prisma.bannedUser.findUnique({
      where: { id: body.id },
    });

    if (!existingBan) {
      return c.json({ code: -100, message: "Không tìm thấy lệnh cấm" });
    }

    // Cập nhật lệnh cấm
    const updatedBan = await prisma.bannedUser.update({
      where: { id: body.id },
      data: {
        reason: body.reason,
        restriction: body.restriction,
        endAt: body.endAt,
      },
    });

    return c.json({
      code: 200,
      message: "Cập nhật lệnh cấm thành công",
      data: updatedBan,
    });
  } catch (error) {
    console.error(error);
    return c.json({ code: 500, message: "Lỗi khi cập nhật lệnh cấm" });
  }
});

export default banController;
