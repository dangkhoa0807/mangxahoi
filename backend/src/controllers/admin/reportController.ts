import { Hono } from "hono";
import prisma from "@/libs/prisma";
import { validate, yup } from "@/libs/validate";
import { adminMiddleware } from "@/middlewares/adminMiddleware";

const reportController = new Hono();

// Middleware để kiểm tra quyền admin
reportController.use("*", adminMiddleware);

// Lấy danh sách báo cáo bài viết
reportController.get("/posts", async (c) => {
  const { page = "1", pageSize = "10", status = "pending" } = c.req.query();

  const body = await validate(
    {
      status: yup
        .string()
        .oneOf(
          ["ALL", "PENDING", "RESOLVED", "REJECTED"],
          "Trạng thái không hợp lệ"
        )
        .required("Trạng thái là bắt buộc"),
    },
    { status: status.toUpperCase() }
  );

  try {
    const [reports, pagination] = await prisma.postReport
      .paginate({
        where: {
          ...(body.status !== "ALL" && {
            status: body.status as "PENDING" | "RESOLVED" | "REJECTED",
          }),
        },
        select: {
          id: true,
          reason: true,
          description: true,
          createdAt: true,
          status: true,
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              content: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  profile: {
                    select: {
                      id: true,
                      name: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              images: true,
              group: {
                select: {
                  id: true,
                  name: true,
                  iconUrl: true,
                },
              },
              hashTags: {
                select: {
                  hashtag: true,
                },
              },
              originalPost: {
                select: {
                  id: true,
                  title: true,
                  content: true,
                  createdAt: true,
                  user: {
                    select: {
                      id: true,
                      profile: {
                        select: {
                          id: true,
                          name: true,
                          avatarUrl: true,
                        },
                      },
                    },
                  },
                  images: true,
                },
              },
              _count: {
                select: {
                  reports: true,
                },
              },
            },
          },
        },
        orderBy:
          body.status === "ALL"
            ? [
                { status: "asc" }, // PENDING first (alphabetically comes before RESOLVED/REJECTED)
                { createdAt: "desc" },
              ]
            : { createdAt: "desc" },
      })
      .withPages({
        page: parseInt(page),
        limit: parseInt(pageSize),
        includePageCount: true,
      });

    return c.json({
      code: 200,
      data: {
        list: reports,
        pagination,
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: 500,
      message: "Lỗi khi lấy danh sách báo cáo bài viết",
    });
  }
});

// Xử lý báo cáo bài viết
reportController.put("/posts/:id", async (c) => {
  const reportId = c.req.param("id");
  const { user } = c.var;

  const body = await validate(
    {
      action: yup.string().oneOf(["RESOLVED", "REJECTED"]).required(),
      punishment: yup
        .object({
          type: yup
            .string()
            .oneOf(["NONE", "COMMENT_BAN", "POST_BAN", "FULL_BAN"]),
          endAt: yup.date().nullable(),
          reason: yup.string().when("type", {
            is: (type: string) => type !== "NONE",
            then: (schema) => schema.required("Lý do cấm là bắt buộc"),
          }),
        })
        .default({ type: "NONE" }),
    },
    await c.req.json()
  );

  try {
    // Lấy báo cáo và bài viết liên quan
    const report = await prisma.postReport.findUnique({
      where: { id: reportId },
      include: {
        post: true,
      },
    });

    if (!report) {
      return c.json({
        code: 404,
        message: "Không tìm thấy báo cáo",
      });
    }

    if (report.status !== "PENDING") {
      return c.json({
        code: 400,
        message: "Báo cáo này đã được xử lý",
      });
    }

    await prisma.$transaction(async (prisma) => {
      // Cập nhật trạng thái báo cáo
      await prisma.postReport.updateMany({
        where: { postId: report.postId },
        data: { status: body.action },
      });

      if (body.action === "RESOLVED") {
        // Ẩn bài viết thay vì xóa
        await prisma.post.update({
          where: { id: report.postId },
          data: { status: "HIDDEN" },
        });

        // Áp dụng hình phạt nếu có
        if (body.punishment.type !== "NONE") {
          const existingBan = await prisma.bannedUser.findFirst({
            where: {
              userId: report.post.userId,
              restriction: body.punishment.type,
              OR: [{ endAt: null }, { endAt: { gt: new Date() } }],
            },
          });

          if (!existingBan) {
            await prisma.bannedUser.create({
              data: {
                userId: report.post.userId,
                bannedBy: user.id,
                reason: body.punishment.reason,
                restriction: body.punishment.type,
                endAt: body.punishment.endAt,
              },
            });
          }
        }
      } else if (body.action === "REJECTED") {
        // Hiển thị bài viết nếu nó đã bị ẩn
        await prisma.post.update({
          where: { id: report.postId },
          data: { status: "ACTIVE" },
        });
      }
    });

    return c.json({
      code: 200,
      message: "Xử lý báo cáo thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: 500,
      message: "Lỗi khi xử lý báo cáo",
    });
  }
});

// Lấy danh sách comment bị báo cáo
reportController.get("/comments", async (c) => {
  const { page = "1", pageSize = "10", status = "pending" } = c.req.query();

  const body = await validate(
    {
      status: yup
        .string()
        .oneOf(
          ["ALL", "PENDING", "RESOLVED", "REJECTED"],
          "Trạng thái không hợp lệ"
        )
        .required("Trạng thái là bắt buộc"),
    },
    { status: status.toUpperCase() }
  );

  try {
    const [reports, pagination] = await prisma.commentReport
      .paginate({
        where: {
          ...(body.status !== "ALL" && {
            status: body.status as "PENDING" | "RESOLVED" | "REJECTED",
          }),
        },
        select: {
          id: true,
          reason: true,
          description: true,
          createdAt: true,
          status: true,
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          comment: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  profile: {
                    select: {
                      name: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              post: {
                select: {
                  id: true,
                  title: true,
                },
              },
              _count: {
                select: {
                  reports: true,
                },
              },
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

    return c.json({
      code: 200,
      data: {
        list: reports,
        pagination,
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: 500,
      message: "Lỗi khi lấy danh sách báo cáo bình luận",
    });
  }
});

// Xử lý báo cáo bình luận
reportController.put("/comments/:id", async (c) => {
  const reportId = c.req.param("id");
  const { user } = c.var;

  const body = await validate(
    {
      action: yup.string().oneOf(["RESOLVED", "REJECTED"]).required(),
      punishment: yup
        .object({
          type: yup
            .string()
            .oneOf(["NONE", "COMMENT_BAN", "POST_BAN", "FULL_BAN"]),
          endAt: yup.date().nullable(),
          reason: yup.string().when("type", {
            is: (type: string) => type !== "NONE",
            then: (schema) => schema.required("Lý do cấm là bắt buộc"),
          }),
        })
        .default({ type: "NONE" }),
    },
    await c.req.json()
  );

  try {
    const report = await prisma.commentReport.findUnique({
      where: { id: reportId },
      include: { comment: true },
    });

    if (!report) {
      return c.json({
        code: 404,
        message: "Không tìm thấy báo cáo",
      });
    }

    if (report.status !== "PENDING") {
      return c.json({
        code: 400,
        message: "Báo cáo này đã được xử lý",
      });
    }

    await prisma.$transaction(async (prisma) => {
      // Cập nhật trạng thái báo cáo
      await prisma.commentReport.update({
        where: { id: reportId },
        data: { status: body.action },
      });

      if (body.action === "RESOLVED") {
        // Xoá bình luận được trả lời
        await prisma.comment.deleteMany({
          where: { parentId: report.commentId },
        });

        // Xóa bình luận
        await prisma.comment.delete({
          where: { id: report.commentId },
        });

        // Áp dụng hình phạt nếu có
        if (body.punishment.type !== "NONE") {
          const existingBan = await prisma.bannedUser.findFirst({
            where: {
              userId: report.comment.userId,
              restriction: body.punishment.type,
              OR: [{ endAt: null }, { endAt: { gt: new Date() } }],
            },
          });

          if (!existingBan) {
            await prisma.bannedUser.create({
              data: {
                userId: report.comment.userId,
                bannedBy: user.id,
                reason: body.punishment.reason,
                restriction: body.punishment.type,
                endAt: body.punishment.endAt,
              },
            });
          }
        }
      }
    });

    return c.json({
      code: 200,
      message: "Xử lý báo cáo thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: 500,
      message: "Lỗi khi xử lý báo cáo",
    });
  }
});

export default reportController;
