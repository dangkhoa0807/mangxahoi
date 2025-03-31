import { Hono } from "hono";
import slugify from "slugify";
import { nanoid } from "nanoid";
import prisma, { cachePrisma } from "@/libs/prisma";
import { validate, yup } from "@/libs/validate";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "@/middlewares/authMiddleware";
import { cleanHtml } from "@/libs/sanitizeHtml";
import { uploadImage } from "@/libs/uploadImage";
import { ObjectId } from "bson";
import { every } from "hono/combine";
import { checkPostBan } from "@/middlewares/banMiddleware";

import { checkPostAccess } from "./commentController";
import { Post, ReactionType, User } from "@prisma/client";
import { queueNotification } from "@/queues/notificationQueue";
import {
  updatePostScore,
  postSelect,
  getLatestPosts,
  getTrendingPosts,
} from "@/helpers/posts";
import { queueNewPostNotification } from "@/queues/postQueue";

const postController = new Hono();

function unCachePost(user: User, post?: Post) {
  return {
    uncacheKeys: [
      cachePrisma.getKeyPattern({
        params: [
          { prisma: "SavedPost" },
          { page: "*" },
          { userId: user?.id },
          { cursor: "*" },
        ],
      }),
      cachePrisma.getKeyPattern({
        params: [
          { prisma: "Post" },
          { page: "*" },
          { userId: user?.id },
          { cursor: "*" },
        ],
      }),
      post
        ? cachePrisma.getKeyPattern({
            params: [
              { prisma: "Post" },
              { page: "*" },
              { userId: user?.id },
              { id: post.id },
            ],
          })
        : "",
    ],
    hasPattern: true,
  };
}

postController.get("/latest", optionalAuthMiddleware, async (c) => {
  const { user } = c.var;

  const query = await validate(
    {
      cursor: yup.string().nullable(),
      limit: yup.number().min(10),
    },
    c.req.query()
  );

  const posts = await getLatestPosts(user, query.cursor, query.limit);

  return c.json({
    code: 200,
    data: posts,
  });
});

postController.get("/trending", optionalAuthMiddleware, async (c) => {
  const { user } = c.var;

  const query = await validate(
    {
      cursor: yup.string().nullable(),
      limit: yup.number().min(10),
    },
    c.req.query()
  );

  const posts = await getTrendingPosts(user, query.cursor, query.limit);

  return c.json({
    code: 200,
    data: posts,
  });
});

// Tạo bài viết
postController.post("/", every(authMiddleware, checkPostBan), async (c) => {
  const { user } = c.var;

  const rawBody = await c.req.parseBody();

  if (typeof rawBody.hashtag === "string") {
    try {
      rawBody.hashtag = JSON.parse(rawBody.hashtag);
    } catch (error) {
      return c.json({ code: -100, message: "Hashtag không hợp lệ" });
    }
  }

  // Validate đầu vào
  const body = await validate(
    {
      title: yup.string(),
      content: yup.string(),
      visibility: yup.mixed().oneOf(["PUBLIC", "PRIVATE", "FRIENDS", "GROUP"]),
      groupId: yup.string().nullable(),
      hashtag: yup
        .array()
        .of(yup.object({ value: yup.string() }))
        .nullable(),
    },
    rawBody
  );

  // Xử lý đầu vào của hình ảnh
  let imagesInput = Array.isArray(body["images[]"])
    ? body["images[]"]
    : [body["images[]"]].filter(Boolean);

  if (imagesInput.some((file) => !(file instanceof File))) {
    return c.json({ code: -100, message: "File ảnh không hợp lệ" });
  }

  // Kiểm tra nếu không có nội dung
  if (!body.title && !body.content && imagesInput.length === 0) {
    return c.json({
      code: -100,
      message: "Vui lòng nhập nội dung bài viết",
    });
  }

  // Kiểm tra quyền đăng nội dung nếu đăng vào group
  if (ObjectId.isValid(body.groupId)) {
    const group = await prisma.group.findUnique({
      where: { id: body.groupId },
    });

    if (!group) {
      return c.json({
        code: -100,
        message: "Nhóm đã bị gỡ hoặc không tồn tại",
      });
    }

    // Kiểm tra quyền đăng bài viết
    if (group.ownerId != user.id) {
      const groupMembership = await prisma.groupMember.findFirst({
        where: {
          groupId: body.groupId,
          userId: user.id,
        },
      });

      if (!groupMembership) {
        return c.json({
          code: -100,
          message: "Bạn không có quyền đăng bài trong nhóm này",
        });
      }
    }
  }

  try {
    // Tạo slug duy nhất
    let generatedSlug = body.title
      ? slugify(body.title, { lower: true, strict: true })
      : nanoid(12);
    let uniqueSlug = generatedSlug;

    while (await prisma.post.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${generatedSlug}-${nanoid(6)}`;
    }

    // Lọc nội dung bài viết
    const cleanContent = cleanHtml(body.content);

    // Tạo bài viết
    const post = await prisma.post.create({
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        visibility: true,
        user: {
          select: {
            id: true,
            profile: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                bio: true,
              },
            },
          },
        },
        images: {
          select: {
            id: true,
            url: true,
          },
        },
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
                    bio: true,
                  },
                },
              },
            },
            images: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
            shares: true,
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
        savedPost: user
          ? {
              where: {
                userId: user.id,
              },
              select: {
                id: true,
              },
            }
          : undefined,
      },
      data: {
        title: body.title,
        content: cleanContent,
        userId: user.id,
        slug: uniqueSlug,
        visibility: body.groupId ? "GROUP" : body.visibility,
        groupId: body.groupId,
      },
    });

    // Xử lý hashtag
    if (body.hashtag && Array.isArray(body.hashtag)) {
      for (const tag of body.hashtag) {
        const hashtag = await prisma.hashtag.upsert({
          where: { name: tag.value },
          update: {},
          create: { name: tag.value },
        });

        // Tạo liên kết giữa bài viết và hashtag trong bảng PostHashtag
        await prisma.postHashtag.create({
          data: {
            postId: post.id,
            hashtagId: hashtag.id,
          },
        });
      }
    }

    // Upload và lưu ảnh (nếu có)
    if (imagesInput.length > 0) {
      const imageUploadPromises = imagesInput.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        const imageUrl = await uploadImage(fileBuffer);
        return prisma.image.create({
          data: {
            url: imageUrl,
            postId: post.id,
          },
        });
      });

      await Promise.all(imageUploadPromises);
    }

    const newPost = await prisma.post.findUnique({
      where: { id: post.id },
      select: postSelect(user),
    });

    if (newPost) {
      await queueNewPostNotification(newPost, user);
    }

    return c.json({
      code: 200,
      data: newPost,
      message: "Đăng bài viết thành công",
    });
  } catch (error) {
    console.log(error);

    return c.json({ code: -100, message: "Đăng bài viết thất bại" });
  }
});

// Lấy danh sách bài viết đã lưu
postController.get("/saved", authMiddleware, async (c) => {
  const { user } = c.var;
  const { page = "1", pageSize = "10" } = c.req.query();
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize) + 1;

  try {
    const savedPosts = await prisma.savedPost.findMany({
      where: {
        userId: user.id,
      },
      select: {
        post: {
          select: postSelect(user),
        },
      },
      skip: skip,
      take: take,
      orderBy: {
        createdAt: "desc",
      },
    });

    const hasMore = savedPosts.length === take;
    if (hasMore) {
      savedPosts.pop();
    }

    const postsWithLikeStatus = savedPosts.map((savedPost) => ({
      ...savedPost.post,
      isLiked: savedPost.post.reactions.length > 0,
      isSaved: true,
    }));

    return c.json({
      code: 200,
      data: {
        list: postsWithLikeStatus,
        hasMore,
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: 500,
      message: "Lỗi khi lấy danh sách bài viết đã lưu",
    });
  }
});

// Tạo middleware 1 bài viết
postController.use("/:id/*", optionalAuthMiddleware, async (c, next) => {
  const user = c.var.user;
  const id = c.req.param("id");

  const post = await prisma.post.findFirst({
    where: {
      AND: [
        { id },
        { status: "ACTIVE" },
        // Lọc bài viết không bị chặn
        {
          OR: user
            ? [
                { visibility: "PUBLIC" },
                { visibility: "PRIVATE", userId: user.id },
                {
                  visibility: "FRIENDS",
                  user: {
                    AND: [
                      {
                        OR: [
                          { friends: { some: { userId: user.id } } },
                          { friends: { some: { friendId: user.id } } },
                        ],
                      },
                      // Lọc bài viết không bị chặn
                      {
                        NOT: {
                          blockedBy: { some: { blockerId: user.id } },
                        },
                      },
                    ],
                  },
                },
                {
                  visibility: "GROUP",
                  group: {
                    OR: [
                      { ownerId: user.id },
                      {
                        members: {
                          some: {
                            userId: user.id,
                          },
                        },
                      },
                    ],
                  },
                },
              ]
            : [{ visibility: "PUBLIC" }],
        },
        // Lọc bài viết không bị ẩn
        user
          ? {
              NOT: {
                hiddenPost: {
                  some: {
                    userId: user.id,
                  },
                },
              },
            }
          : {},
      ],
    },
    include: {
      user: true,
    },
  });

  if (!post) {
    return c.json({
      code: -100,
      message: "Bài viết không tồn tại hoặc không có quyền truy cập",
    });
  }

  c.set("post", post);
  await next();
});

// Lấy 1 bài viết
postController.get("/:id", async (c) => {
  const { user } = c.var;
  const postId = c.req.param("id");

  try {
    const post = await prisma.post.findFirst({
      where: {
        AND: [
          { id: postId },
          { status: "ACTIVE" },
          // Lọc bài viết không bị chặn
          {
            OR: user
              ? [
                  { visibility: "PUBLIC" },
                  { visibility: "PRIVATE", userId: user.id },
                  {
                    visibility: "FRIENDS",
                    user: {
                      AND: [
                        {
                          OR: [
                            { friends: { some: { userId: user.id } } },
                            { friends: { some: { friendId: user.id } } },
                          ],
                        },
                        // Lọc bài viết không bị chặn
                        {
                          NOT: {
                            blockedBy: { some: { blockerId: user.id } },
                          },
                        },
                      ],
                    },
                  },
                  {
                    visibility: "GROUP",
                    group: {
                      OR: [
                        { ownerId: user.id },
                        {
                          members: {
                            some: {
                              userId: user.id,
                            },
                          },
                        },
                      ],
                    },
                  },
                ]
              : [{ visibility: "PUBLIC" }],
          },
          // Lọc bài viết không bị ẩn
          user
            ? {
                NOT: {
                  hiddenPost: {
                    some: {
                      userId: user.id,
                    },
                  },
                },
              }
            : {},
        ],
      },
      select: postSelect(user),
    });

    if (!post) {
      return c.json({
        code: -100,
        message: "Bài viết không tồn tại hoặc không có quyền truy cập",
      });
    }

    const postWithLikeStatus = {
      ...post,
      isLiked: user ? post.reactions.length > 0 : false,
    };

    return c.json({
      code: 200,
      data: postWithLikeStatus,
    });
  } catch (error) {
    return c.json({ code: 500, message: "Lỗi khi lấy bài viết" });
  }
});

// Gỡ bài viết
postController.delete("/:id", authMiddleware, async (c) => {
  const { user, post } = c.var;

  if (post.userId !== user.id) {
    return c.json({
      code: -100,
      message: "Bạn không có quyền xóa bài viết này",
    });
  }

  try {
    // Xoá các bài viết chia sẽ
    await prisma.post.deleteMany({
      where: {
        originalPostId: post.id,
      },
    });

    // Xóa tất cả bình luận con của bài viết
    await prisma.comment.deleteMany({
      where: {
        postId: post.id,
        parentId: {
          not: null,
        },
      },
    });

    await prisma.post.delete({
      where: { id: post.id },
    });

    return c.json({
      code: 200,
      message: "Xóa bài viết thành công",
    });
  } catch (error) {
    console.log(error);
    return c.json({ code: -100, message: "Xóa bài viết thất bại" });
  }
});

// Ẩn bài viết
postController.get("/:id/hide", authMiddleware, async (c) => {
  const user = c.var.user;
  const post = c.var.post;

  try {
    // Kiểm tra xem bài viết đã bị ẩn trước đó chưa
    const hiddenPost = await prisma.hiddenPost.findFirst({
      where: {
        userId: user.id,
        postId: post.id,
      },
    });

    if (hiddenPost) {
      return c.json({ code: -100, message: "Bài viết đã được ẩn trước đó" });
    }

    // Ẩn bài viết bằng cách thêm bản ghi vào bảng HiddenPost
    await cachePrisma.hiddenPost.create({
      data: {
        userId: user.id,
        postId: post.id,
      },
      uncache: unCachePost(user, post),
    });

    return c.json({ code: 200, message: "Đã ẩn bài viết thành công" });
  } catch (error) {
    return c.json({ code: -100, message: "Lỗi khi ẩn bài viết" });
  }
});

// Lưu bài viết
postController.get("/:id/save", authMiddleware, async (c) => {
  const user = c.var.user;
  const post = c.var.post;

  try {
    const savedPost = await prisma.savedPost.findFirst({
      where: {
        userId: user.id,
        postId: post.id,
      },
    });

    if (savedPost) {
      return c.json({ code: 400, message: "Bài viết đã được lưu trước đó" });
    }

    await cachePrisma.savedPost.create({
      data: {
        userId: user.id,
        postId: post.id,
      },
      uncache: unCachePost(user, post),
    });

    await updatePostScore(post.id, "save", true);

    return c.json({ code: 200, message: "Đã lưu bài viết thành công" });
  } catch (error) {
    return c.json({ code: -100, message: "Lỗi khi lưu bài viết" });
  }
});

// Bỏ lưu bài viết
postController.delete("/:id/save", authMiddleware, async (c) => {
  const user = c.var.user;
  const post = c.var.post;

  try {
    const savedPost = await prisma.savedPost.findFirst({
      where: {
        userId: user.id,
        postId: post.id,
      },
    });

    if (!savedPost) {
      return c.json({ code: -100, message: "Bài viết chưa được lưu trước đó" });
    }

    await cachePrisma.savedPost.delete({
      where: {
        id: savedPost.id,
      },
      uncache: unCachePost(user, post),
    });

    await updatePostScore(post.id, "save", false);

    return c.json({ code: 200, message: "Đã bỏ lưu bài viết thành công" });
  } catch (error) {
    return c.json({ code: -100, message: "Lỗi khi bỏ lưu bài viết" });
  }
});

// Lấy danh sách người đã thả biểu cảm
postController.get("/:id/reactions", optionalAuthMiddleware, async (c) => {
  const { user, post } = c.var;

  const query = await validate(
    {
      page: yup.number().min(1).default(1),
      limit: yup.number().min(1).default(5),
      type: yup
        .string()
        .oneOf(["ALL", "LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"])
        .optional(),
    },
    c.req.query()
  );

  try {
    const [reactions, reactionCounts] = await Promise.all([
      prisma.reaction.findMany({
        where: {
          postId: post.id,
          ...(query.type !== "ALL" ? { type: query.type as ReactionType } : {}),
        },
        select: {
          type: true,
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
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit + 1,
      }),

      prisma.reaction.groupBy({
        by: ["type"],
        where: {
          postId: post.id,
        },
        _count: true,
      }),
    ]);

    const hasMore = reactions.length === query.limit + 1;
    if (hasMore) {
      reactions.pop();
    }

    // Tính tổng số lượng biểu cảm
    const counter = {
      ALL: reactionCounts.reduce((sum, count) => sum + count._count, 0),
      LIKE: 0,
      LOVE: 0,
      HAHA: 0,
      WOW: 0,
      SAD: 0,
      ANGRY: 0,
    };

    // Điền số lượng biểu cảm cho mỗi loại
    reactionCounts.forEach((count) => {
      counter[count.type] = count._count;
    });

    // Chuyển đổi dữ liệu biểu cảm
    const formattedReactions = reactions.map((reaction) => ({
      type: reaction.type,
      user: {
        id: reaction.user.id,
        profile: reaction.user.profile,
      },
      createdAt: reaction.createdAt,
    }));

    return c.json({
      code: 200,
      data: {
        list: formattedReactions,
        counter,
        pagination: {
          hasMore,
          page: query.page,
          limit: query.limit,
        },
      },
    });
  } catch (error) {
    return c.json({
      code: -100,
      message: "Lỗi khi lấy danh sách người thả biểu cảm",
    });
  }
});

// Thả biểu cảm
postController.post("/:id/reaction", authMiddleware, async (c) => {
  const user = c.var.user;
  const post = c.var.post;

  const body = await validate(
    {
      type: yup
        .string()
        .required()
        .oneOf(["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"]),
    },
    await c.req.json()
  );

  try {
    // Kiểm tra reaction hiện tại
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: post.id,
        },
      },
    });

    // Nếu đã có reaction cùng loại -> xóa reaction
    if (existingReaction && existingReaction.type === body.type) {
      await cachePrisma.reaction.delete({
        where: {
          userId_postId: {
            userId: user.id,
            postId: post.id,
          },
        },
        uncache: unCachePost(user, post),
      });

      await updatePostScore(post.id, "reaction", false);

      const reactionCount = await prisma.reaction.count({
        where: {
          postId: post.id,
        },
      });

      return c.json({
        code: 200,
        message: "Đã gỡ biểu cảm",
        data: {
          isReacted: false,
          reactionCount: reactionCount,
        },
      });
    }

    // Nếu chưa có hoặc khác loại -> tạo/cập nhật reaction mới
    await cachePrisma.reaction.upsert({
      where: {
        userId_postId: {
          userId: user.id,
          postId: post.id,
        },
      },
      update: {
        type: body.type,
      },
      create: {
        postId: post.id,
        userId: user.id,
        type: body.type,
      },
      uncache: unCachePost(user, post),
    });

    await updatePostScore(post.id, "reaction", true);

    // Tạo thông báo nếu là reaction mới và người reaction không phải chủ bài viết
    if (user.id !== post.userId) {
      await queueNotification({
        type: "like",
        userId: post.userId,
        senderId: user.id,
        redirectUrl: `/post/${post.id}`,
        message: null,
        id: "",
        createdAt: new Date(),
        read: false,
      });
    }

    // Đếm số lượng reaction hiện tại của bài viết
    const reactionCount = await prisma.reaction.count({
      where: {
        postId: post.id,
      },
    });

    return c.json({
      code: 200,
      message: "Thả biểu cảm thành công",
      data: {
        isReacted: true,
        reactionCount: reactionCount,
      },
    });
  } catch (error) {
    console.log(error);
    return c.json({ code: -100, message: "Lỗi khi xử lý biểu cảm bài viết" });
  }
});

// Báo cáo bài viết
postController.post("/:id/report", authMiddleware, async (c) => {
  const { post, user } = c.var;

  if (post.userId == user.id) {
    return c.json({
      code: -100,
      message: "Bạn không thể báo cáo bài viết chính mình",
    });
  }

  const body = await validate(
    {
      reason: yup.string().required(),
      description: yup.string().nullable(),
    },
    await c.req.json()
  );

  const existingReport = await prisma.postReport.findFirst({
    where: {
      postId: post.id,
      userId: user.id,
      status: "PENDING",
    },
  });

  if (existingReport) {
    return c.json({
      code: -101,
      message: "Bạn đã báo cáo bài viết này trước đó",
    });
  }

  await prisma.postReport.create({
    data: {
      postId: post.id,
      userId: user.id,
      reason: body.reason,
      description: body.description,
    },
  });

  return c.json({ code: 200, message: "Báo cáo thành công" });
});

// Chia sẽ bài viết
postController.post("/:id/share", authMiddleware, async (c) => {
  const { user, post } = c.var;

  const body = await validate(
    {
      content: yup.string().optional(),
    },
    await c.req.json()
  );

  // Kiểm tra nếu bài viết gốc tồn tại
  const originalPost = await prisma.post.findUnique({ where: { id: post.id } });
  if (!originalPost) {
    return c.json({ code: -100, message: "Bài viết không tồn tại" });
  }

  try {
    const generatedSlug = nanoid(12);

    // Lưu vào database bài viết chia sẻ
    const sharedPost = await prisma.post.create({
      data: {
        content: body.content,
        userId: user.id,
        originalPostId: originalPost.id,
        slug: generatedSlug,
        visibility: originalPost.visibility, // có thể điều chỉnh visibility nếu cần
      },
    });

    await updatePostScore(post.id, "share", true);

    return c.json({
      code: 200,
      message: "Chia sẻ bài viết thành công",
      data: sharedPost,
    });
  } catch (error) {
    console.log(error);
    return c.json({ code: -100, message: "Chia sẻ bài viết thất bại" });
  }
});

// Bật / tắt bình luận bài viết
postController.put("/:id/toggle-comments", authMiddleware, async (c) => {
  const { user } = c.var;
  const postId = c.req.param("id");

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return c.json({ code: -100, message: "Bài viết không tồn tại" });
    }

    // Kiểm tra quyền - chỉ chủ bài viết mới có thể bật/tắt bình luận
    if (post.userId !== user.id) {
      return c.json({
        code: -100,
        message: "Bạn không có quyền thực hiện hành động này",
      });
    }

    // Cập nhật trạng thái cho phép bình luận
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        allowComments: !post.allowComments,
      },
    });

    return c.json({
      code: 200,
      message: updatedPost.allowComments
        ? "Đã bật bình luận cho bài viết"
        : "Đã tắt bình luận cho bài viết",
      data: {
        allowComments: updatedPost.allowComments,
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Lỗi khi thay đổi trạng thái bình luận",
    });
  }
});

// lấy danh sách comment
postController.get("/:id/comment", optionalAuthMiddleware, async (c) => {
  const user = c.get("user");
  const { page = "1", pageSize = "3" } = c.req.query();
  const postId = c.req.param("id");

  const { error, post } = await checkPostAccess(postId, user);
  if (error || !post) return c.json({ code: -100, message: error });

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize) + 1;
  const comments = await prisma.comment.findMany({
    where: {
      postId: post.id,
      parentId: null,
    },
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
      replies: {
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
      createdAt: "desc",
    },
  });

  const hasMore = comments.length === take;

  const commentsWithLikeStatus = comments.map((comment) => ({
    ...comment,
    isLiked: user ? comment.reactions.length > 0 : false,
    replies: comment.replies.map((reply) => ({
      ...reply,
      isLiked: user ? reply.reactions.length > 0 : false,
    })),
  }));

  return c.json({
    code: 200,
    data: {
      comments: commentsWithLikeStatus,
      hasMore: hasMore,
    },
  });
});

// Chỉnh sửa bài viết
postController.put("/:id", authMiddleware, async (c) => {
  const { user, post } = c.var;
  const rawBody = await c.req.parseBody();

  if (post.userId !== user.id) {
    return c.json({
      code: -100,
      message: "Bạn không có quyền chỉnh sửa bài viết này",
    });
  }

  if (typeof rawBody.hashtag === "string") {
    try {
      rawBody.hashtag = JSON.parse(rawBody.hashtag);
    } catch (error) {
      return c.json({ code: -100, message: "Hashtag không hợp lệ" });
    }
  }

  if (typeof rawBody.deleted_images === "string") {
    try {
      rawBody.deleted_images = JSON.parse(rawBody.deleted_images);
    } catch (error) {
      return c.json({ code: -100, message: "Danh sách ảnh xóa không hợp lệ" });
    }
  }

  // Validate đầu vào
  const body = await validate(
    {
      title: yup.string(),
      content: yup.string(),
      visibility: yup.mixed().oneOf(["PUBLIC", "PRIVATE", "FRIENDS"]),
      hashtag: yup
        .array()
        .of(yup.object({ value: yup.string() }))
        .nullable(),
      deleted_images: yup.array().of(yup.string()).nullable(),
    },
    rawBody
  );

  // Xử lý đầu vào của hình ảnh mới
  let imagesInput = Array.isArray(body["images[]"])
    ? body["images[]"]
    : [body["images[]"]].filter(Boolean);

  if (imagesInput.some((file) => !(file instanceof File))) {
    return c.json({ code: -100, message: "File ảnh không hợp lệ" });
  }

  // Kiểm tra nếu không có nội dung
  if (!body.title && !body.content && imagesInput.length === 0) {
    return c.json({
      code: -100,
      message: "Vui lòng nhập nội dung bài viết",
    });
  }

  try {
    const cleanContent = cleanHtml(body.content);
    let updatedPost: any;

    await prisma.$transaction(async (prisma) => {
      // Xóa tất cả hashtag cũ
      await prisma.postHashtag.deleteMany({
        where: { postId: post.id },
      });

      // Thêm hashtag mới
      if (body.hashtag && Array.isArray(body.hashtag)) {
        for (const tag of body.hashtag) {
          const hashtag = await prisma.hashtag.upsert({
            where: { name: tag.value },
            update: {},
            create: { name: tag.value },
          });

          await prisma.postHashtag.create({
            data: {
              postId: post.id,
              hashtagId: hashtag.id,
            },
          });
        }
      }

      // Xóa các ảnh được chọn để xóa
      if (body.deleted_images && Array.isArray(body.deleted_images)) {
        await prisma.image.deleteMany({
          where: {
            postId: post.id,
            id: {
              in: body.deleted_images,
            },
          },
        });
      }

      // Upload và lưu ảnh mới (nếu có)
      if (imagesInput.length > 0) {
        const imageUploadPromises = imagesInput.map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          const fileBuffer = Buffer.from(arrayBuffer);
          const imageUrl = await uploadImage(fileBuffer);
          return prisma.image.create({
            data: {
              url: imageUrl,
              postId: post.id,
            },
          });
        });

        await Promise.all(imageUploadPromises);
      }

      // Cập nhật bài viết
      updatedPost = await cachePrisma.post.update({
        where: { id: post.id },
        data: {
          title: body.title,
          content: cleanContent,
          visibility: body.visibility,
        },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          visibility: true,
          userId: true,
          user: {
            select: {
              id: true,
              profile: {
                select: {
                  avatarUrl: true,
                  id: true,
                  name: true,
                },
              },
            },
          },
          images: true,
          hashTags: {
            select: {
              hashtag: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              reactions: true,
              shares: true,
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
              hashTags: {
                select: {
                  hashtag: {
                    select: {
                      name: true,
                    },
                  },
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
        },
        uncache: unCachePost(user, post),
      });
    });

    const postWithLikeStatus = updatedPost
      ? {
          ...updatedPost,
          isLiked: updatedPost.reactions.length > 0,
        }
      : null;

    return c.json({
      code: 200,
      message: "Cập nhật bài viết thành công",
      data: postWithLikeStatus,
    });
  } catch (error) {
    return c.json({ code: -100, message: "Cập nhật bài viết thất bại" });
  }
});

export default postController;
