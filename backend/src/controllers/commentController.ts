import prisma, { cachePrisma } from "@/libs/prisma";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "@/middlewares/authMiddleware";
import { Hono } from "hono";
import { validate, yup } from "@/libs/validate";
import { cleanHtml } from "@/libs/sanitizeHtml";
import { every, some } from "hono/combine";
import profileMiddleware from "@/middlewares/profileMiddleware";
import { StickerPackStatus, StickerStatus, User } from "@prisma/client";
import { checkCommentBan } from "@/middlewares/banMiddleware";
import { updatePostScore } from "@/helpers/posts";
import { queueNotification } from "@/queues/notificationQueue";
import { uploadImage } from "@/libs/uploadImage";
import { onlineUsers } from "@/websocket/services/onlineUsers";
import { queueSendRealtimeComment } from "@/queues/comment";

const commentController = new Hono();

// Kiểm tra quyền truy cập bài viết
export const checkPostAccess = async (postId: string, user: User) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { user: true },
  });

  if (!post) return { error: "Bài viết không tồn tại", post: null };
  if (post.visibility === "PRIVATE" && post.user.id !== user?.id) {
    return { error: "Bạn không có quyền truy cập bài viết này", post: null };
  }

  return { error: null, post };
};

// Lấy danh sách bình luận
commentController.get("/", optionalAuthMiddleware, async (c) => {
  const user = c.get("user");

  const query = await validate(
    {
      cursor: yup.string().nullable(),
      limit: yup.number().default(5),
      postId: yup.string().required(),
      sortBy: yup
        .string()
        .oneOf(["newest", "oldest", "popular"])
        .default("newest"),
    },
    c.req.query()
  );

  if (!query.postId) {
    return c.json({ code: -100, message: "Thiếu tham số" });
  }

  const { error, post } = await checkPostAccess(query.postId, user);
  if (error || !post) return c.json({ code: -100, message: error });

  // Xác định cách sắp xếp dựa trên sortBy
  const orderBy = {
    ...(query.sortBy === "newest"
      ? { createdAt: "desc" as const }
      : query.sortBy === "oldest"
      ? { createdAt: "asc" as const }
      : query.sortBy === "popular"
      ? { reactions: { _count: "desc" as const } }
      : { createdAt: "desc" as const }),
  };

  const comments = await prisma.comment.findMany({
    where: {
      postId: post.id,
      parentId: null,
    },
    select: {
      id: true,
      content: true,
      image: true,
      createdAt: true,
      sticker: {
        select: {
          id: true,
          url: true,
        },
      },
      user: {
        select: {
          id: true,
          profile: {
            select: {
              name: true,
              avatarUrl: true,
              userId: true,
            },
          },
        },
      },
      reactions: user
        ? {
            where: {
              userId: user.id,
              type: "LIKE",
            },
            select: {
              id: true,
            },
          }
        : undefined,
      _count: {
        select: {
          replies: true,
          reactions: true,
        },
      },
    },
    cursor: query.cursor ? { id: query.cursor } : undefined,
    skip: query.cursor ? 1 : 0,
    take: query.limit,
    orderBy: orderBy,
  });

  const hasMore = comments.length === parseInt(query.limit);

  const commentsWithLikeStatus = comments.map((comment) => ({
    ...comment,
    isLiked: user ? comment.reactions.length > 0 : false,
    replies: [],
  }));

  return c.json({
    code: 200,
    data: {
      comments: commentsWithLikeStatus,
      hasMore: hasMore,
      cursor: comments.length > 0 ? comments[comments.length - 1].id : null,
    },
  });
});

// Đăng bình luận hoặc trả lời bình luận
commentController.post(
  "/",
  every(authMiddleware, checkCommentBan, profileMiddleware),
  async (c) => {
    const user = c.get("user");

    // Validate đầu vào
    const body = await validate(
      {
        content: yup.string(),
        postId: yup.string().required(),
        parentId: yup.string().nullable(), // Thêm parentId để xác định đây là reply hay comment mới
        stickerId: yup.string().nullable(), // Thêm stickerId
      },
      await c.req.parseBody()
    );

    //kiểm tra sticker nếu có
    if (body.stickerId) {
      const sticker = await prisma.sticker.findFirst({
        where: {
          id: body.stickerId,
          status: "ACTIVE",
          pack: {
            status: "ACTIVE",
          },
        },
      });
      if (!sticker) {
        return c.json({
          code: -100,
          message: "Sticker không tồn tại hoặc không khả dụng",
        });
      }
    }
    try {
      // Xử lý upload ảnh nếu có
      const image = body.image as File | undefined;
      let imageUrl = null;

      if (image && image instanceof File) {
        if (!image.type.startsWith("image/")) {
          return c.json({ code: -100, message: "Chỉ chấp nhận file ảnh" });
        }

        const MAX_SIZE = 10 * 1024 * 1024;
        if (image.size > MAX_SIZE) {
          return c.json({
            code: -100,
            message: "Kích thước ảnh không được vượt quá 10MB",
          });
        }

        imageUrl = await uploadImage(Buffer.from(await image.arrayBuffer()));
      }

      const post = await prisma.post.findUnique({
        where: { id: body.postId },
      });

      if (!post) {
        return c.json({ code: -100, message: "Bài viết không tồn tại" });
      }

      if (!post.allowComments) {
        return c.json({
          code: -100,
          message: "Bài viết này đã tắt tính năng bình luận",
        });
      }

      const { error } = await checkPostAccess(body.postId, user);
      if (error) return c.json({ code: -100, message: error });

      // Kiểm tra parentId nếu là reply
      if (body.parentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: body.parentId },
        });

        if (!parentComment) {
          return c.json({
            code: -100,
            message: "Bình luận gốc không tồn tại",
          });
        }
      }

      const cleanContent = cleanHtml(body.content);

      const comment = await prisma.comment.create({
        data: {
          content: cleanContent,
          userId: user.id,
          postId: post.id,
          parentId: body.parentId || null,
          image: imageUrl,
          stickerId: body.stickerId || null,
        },
        select: {
          id: true,
          content: true,
          image: true,
          parentId: true,
          postId: true,
          createdAt: true,
          sticker: {
            select: {
              id: true,
              url: true,
            },
          },
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  name: true,
                  avatarUrl: true,
                  userId: true,
                },
              },
            },
          },
          _count: {
            select: {
              reactions: true,
            },
          },
          replies: !body.parentId
            ? {
                select: {
                  id: true,
                  content: true,
                  createdAt: true,
                  user: {
                    select: {
                      profile: {
                        select: {
                          name: true,
                          avatarUrl: true,
                          userId: true,
                        },
                      },
                    },
                  },
                  _count: {
                    select: {
                      reactions: true,
                    },
                  },
                },
              }
            : undefined,
        },
      });

      await queueSendRealtimeComment({
        comment,
        post,
        user,
        code: 200,
      });

      if (user.id !== post.userId) {
        await queueNotification({
          type: "comment",
          userId: post.userId,
          senderId: user.id,
          redirectUrl: `/post/${post.id}?id=${comment.id}`,
          message: null,
          id: comment.id,
          createdAt: new Date(),
          read: false,
        });

        await updatePostScore(post.id, "comment", true);
      }

      return c.json({
        code: 200,
        message: body.parentId
          ? "Trả lời bình luận thành công"
          : "Đăng bình luận thành công",
        data: comment,
      });
    } catch (error) {
      console.log(error);
      return c.json({ code: -100, message: "Thao tác thất bại" });
    }
  }
);

// Chỉnh sửa bình luận
commentController.put("/:comment_id", authMiddleware, async (c) => {
  const commentId = c.req.param("comment_id");
  const { user } = c.var;

  const body = await validate(
    {
      content: yup.string(),
      stickerId: yup.string().nullable(),
    },
    await c.req.parseBody()
  );

  try {
    // Kiểm tra bình luận có tồn tại không
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: true,
      },
    });

    if (!comment) {
      return c.json({
        code: -100,
        message: "Bình luận không tồn tại",
      });
    }

    // Xử lý upload ảnh nếu có
    const image = body.image as File | undefined;
    let imageUrl = null;

    if (image && image instanceof File) {
      if (!image.type.startsWith("image/")) {
        return c.json({ code: -100, message: "Chỉ chấp nhận file ảnh" });
      }

      const MAX_SIZE = 10 * 1024 * 1024;
      if (image.size > MAX_SIZE) {
        return c.json({
          code: -100,
          message: "Kích thước ảnh không được vượt quá 10MB",
        });
      }

      imageUrl = await uploadImage(Buffer.from(await image.arrayBuffer()));
    }

    // Kiểm tra sticker nếu có
    if (body.stickerId) {
      const sticker = await prisma.sticker.findFirst({
        where: {
          id: body.stickerId,
          status: StickerStatus.ACTIVE,
          pack: { status: StickerPackStatus.ACTIVE },
        },
      });

      if (!sticker) {
        return c.json({
          code: -100,
          message: "Sticker không tồn tại hoặc không khả dụng",
        });
      }
    }

    if (!body.content && !body.stickerId && !imageUrl) {
      return c.json({
        code: -100,
        message: "Không có nội dung để cập nhật",
      });
    }

    // Kiểm tra quyền chỉnh sửa (chỉ người viết bình luận mới được sửa)
    if (comment.userId !== user.id) {
      return c.json({
        code: -100,
        message: "Bạn không có quyền chỉnh sửa bình luận này",
      });
    }

    // Làm sạch nội dung
    const cleanContent = cleanHtml(body.content);

    // Cập nhật bình luận
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: cleanContent,
        stickerId: body.stickerId || null,
        image: body.stickerId ? null : imageUrl || undefined,
      },
      select: {
        id: true,
        content: true,
        image: true,
        parentId: true,
        postId: true,
        createdAt: true,
        sticker: {
          select: {
            id: true,
            url: true,
          },
        },
        user: {
          select: {
            profile: {
              select: {
                name: true,
                avatarUrl: true,
                userId: true,
              },
            },
          },
        },
        reactions: {
          where: {
            userId: user.id,
            type: "LIKE",
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            reactions: true,
          },
        },
      },
    });

    await queueSendRealtimeComment({
      comment: updatedComment,
      post: comment.post,
      user,
      code: 202,
    });

    return c.json({
      code: 200,
      message: "Cập nhật bình luận thành công",
      data: {
        ...updatedComment,
        isLiked: updatedComment.reactions.length > 0,
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({ code: -100, message: "Cập nhật bình luận thất bại" });
  }
});

// Thích bình luận
commentController.post("/:comment_id/like", authMiddleware, async (c) => {
  const { user } = c.var;
  const commentId = c.req.param("comment_id") || "";
  const type = "LIKE";

  try {
    const existingReaction = await prisma.commentReaction.findFirst({
      where: { userId: user.id, commentId: commentId },
    });

    if (existingReaction) {
      await prisma.commentReaction.delete({
        where: { id: existingReaction.id },
      });
    } else {
      await prisma.commentReaction.create({
        data: {
          userId: user.id,
          commentId: commentId,
          type: type,
        },
      });

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: { post: true },
      });

      if (comment) {
        await queueNotification({
          type: "comment_like",
          userId: comment.userId,
          senderId: user.id,
          redirectUrl: `/post/${comment.postId}`,
          message: null,
          id: "",
          createdAt: new Date(),
          read: false,
        });
      }
    }

    const likesCount = await prisma.commentReaction.count({
      where: { commentId: commentId, type: "LIKE" },
    });

    return c.json({
      code: 200,
      message: existingReaction
        ? "Đã bỏ thích bình luận"
        : "Đã thích bình luận",
      data: {
        isLiked: !existingReaction,
        likesCount: likesCount,
      },
    });
  } catch (error) {
    return c.json({ code: -100, message: "Like bình luận thất bại" });
  }
});

// Gỡ bình luận
commentController.delete("/:comment_id", authMiddleware, async (c) => {
  const user = c.get("user");
  const comment_id = c.req.param("comment_id");

  const body = await validate(
    {
      postId: yup.string(),
    },
    await c.req.json()
  );

  const { error, post } = await checkPostAccess(body.postId, user);
  if (error || !post) return c.json({ code: -100, message: error });

  const comment = await prisma.comment.findUnique({
    where: {
      id: comment_id,
    },
    include: {
      replies: true,
    },
  });

  if (!comment) {
    return c.json({
      code: -100,
      message: "Bình luận đã xoá hoặc không tồn tại",
    });
  }

  if (comment.userId != user.id && post.userId != user.id) {
    return c.json({
      code: -100,
      message: "Bạn không có quyền xoá bình luận này",
    });
  }

  if (comment.replies.length > 0) {
    await prisma.comment.deleteMany({
      where: {
        parentId: comment_id,
      },
    });
  }

  await prisma.comment.delete({
    where: {
      id: comment_id,
    },
  });

  await queueSendRealtimeComment({
    comment,
    post,
    user,
    code: 204,
  });

  await updatePostScore(post.id, "comment", false);

  return c.json({
    code: 200,
    message: "Xóa bình luận thành công",
  });
});

// Báo cáo bình luận
commentController.post("/:comment_id/report", authMiddleware, async (c) => {
  const user = c.get("user");
  const commentId = c.req.param("comment_id");

  const body = await validate(
    {
      reason: yup.string().required(),
      description: yup.string().nullable(),
    },
    await c.req.json()
  );

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return c.json({
        code: -100,
        message: "Bình luận không tồn tại",
      });
    }

    if (comment.userId === user.id) {
      return c.json({
        code: -101,
        message: "Bạn không thể báo cáo bình luận của chính mình",
      });
    }

    const existingReport = await prisma.commentReport.findFirst({
      where: {
        commentId: commentId,
        userId: user.id,
        status: "PENDING",
      },
    });

    if (existingReport) {
      return c.json({
        code: -102,
        message: "Bạn đã báo cáo bình luận này trước đó",
      });
    }

    await prisma.commentReport.create({
      data: {
        reason: body.reason,
        description: body.description,
        userId: user.id,
        commentId: commentId,
      },
    });

    return c.json({
      code: 200,
      message: "Báo cáo bình luận thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Lỗi khi báo cáo bình luận",
    });
  }
});

// Lấy danh sách reply của 1 comment
commentController.get(
  "/:comment_id/replies",
  optionalAuthMiddleware,
  async (c) => {
    const user = c.get("user");
    const commentId = c.req.param("comment_id");
    const { page = "1", pageSize = "5" } = c.req.query();

    try {
      const parentComment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: { post: true },
      });

      if (!parentComment) {
        return c.json({
          code: -100,
          message: "Bình luận không tồn tại",
        });
      }

      // Kiểm tra quyền truy cập bài viết
      const { error } = await checkPostAccess(parentComment.postId, user);
      if (error) return c.json({ code: -100, message: error });

      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize) + 1;

      const replies = await prisma.comment.findMany({
        where: {
          parentId: commentId,
        },
        select: {
          id: true,
          content: true,
          image: true,
          createdAt: true,
          sticker: {
            select: {
              id: true,
              url: true,
            },
          },
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  name: true,
                  avatarUrl: true,
                  userId: true,
                },
              },
            },
          },
          reactions: user
            ? {
                where: {
                  userId: user.id,
                  type: "LIKE",
                },
                select: {
                  id: true,
                },
              }
            : undefined,
          _count: {
            select: {
              reactions: true,
            },
          },
        },
        skip: skip,
        take: take,
        orderBy: {
          createdAt: "asc",
        },
      });

      const hasMore = replies.length === take;
      if (hasMore) {
        replies.pop();
      }

      const repliesWithLikeStatus = replies.map((reply) => ({
        ...reply,
        isLiked: user ? reply.reactions.length > 0 : false,
      }));

      return c.json({
        code: 200,
        data: {
          list: repliesWithLikeStatus,
          hasMore,
        },
      });
    } catch (error) {
      console.error(error);
      return c.json({
        code: -100,
        message: "Lỗi khi lấy danh sách phản hồi",
      });
    }
  }
);

export default commentController;
