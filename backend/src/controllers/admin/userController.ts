import { Hono } from "hono";
import prisma from "@/libs/prisma";
// import { adminAuthMiddleware } from "@/middlewares/authMiddleware";
import { validate, yup } from "@/libs/validate";
import { ObjectId } from "bson";
import { Role } from "@prisma/client";

const adminUserController = new Hono();

// adminUserController.use("*", adminAuthMiddleware);

// Lấy danh sách người dùng với phân trang và tìm kiếm
adminUserController.get("/", async (c) => {
  const { page = "1", pageSize = "10", search = "" } = c.req.query();

  const body = await validate(
    {
      role: yup
        .string()
        .transform((value) => (value === "" ? null : value))
        .oneOf(["USER", "MODERATOR", "ADMIN"])
        .nullable(),
    },
    c.req.query()
  );

  try {
    const [users, pagination] = await prisma.user
      .paginate({
        where: {
          AND: [
            {
              OR: [
                {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  profile: {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            },
            body.role
              ? {
                  roles: {
                    some: {
                      role: body.role.toUpperCase() as Role,
                    },
                  },
                }
              : {},
          ],
        },
        include: {
          profile: {
            select: {
              name: true,
              avatarUrl: true,
              gender: true,
              birthday: true,
            },
          },
          roles: {
            select: {
              role: true,
            },
          },
          bannedUsers: {
            where: {
              endAt: null, // Only get active bans
            },
            select: {
              restriction: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
      .withPages({
        page: parseInt(page),
        limit: parseInt(pageSize),
        includePageCount: true,
      });

    const transformedUsers = users.map((user) => ({
      ...user,
      roles: user.roles.map((r) => r.role),
      status: !user.profile
        ? "pending"
        : user.bannedUsers.length > 0
        ? user.bannedUsers[0].restriction === "FULL_BAN"
          ? "banned"
          : ["COMMENT_BAN", "POST_BAN", "REACTION_BAN"].includes(
              user.bannedUsers[0].restriction
            )
          ? "restricted"
          : "active"
        : "active",
      bannedUsers: undefined,
    }));

    return c.json({
      code: 200,
      data: {
        list: transformedUsers,
        pagination,
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: 500,
      message: "Lỗi khi lấy danh sách người dùng",
    });
  }
});

// Cập nhật vai trò người dùng
adminUserController.put("/:id/role", async (c) => {
  const userId = c.req.param("id");

  if (!ObjectId.isValid(userId)) {
    return c.json({ code: -100, message: "ID người dùng không hợp lệ" });
  }

  const body = await validate(
    {
      role: yup
        .mixed()
        .oneOf(["USER", "MODERATOR", "ADMIN"])
        .required("Vai trò là bắt buộc"),
    },
    await c.req.json()
  );

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
      },
    });

    if (!user) {
      return c.json({ code: -100, message: "Không tìm thấy người dùng" });
    }

    // Xóa tất cả role cũ (trừ MEMBER) trước khi thêm role mới
    await prisma.userRole.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Tạo role mới
    await prisma.userRole.create({
      data: {
        userId: user.id,
        role: body.role,
      },
    });

    return c.json({
      code: 200,
      message: "Cập nhật vai trò thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: 500,
      message: "Lỗi khi cập nhật vai trò người dùng",
    });
  }
});

export default adminUserController;
