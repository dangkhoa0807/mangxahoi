import { postCondition, postSelect } from "@/helpers/posts";
import prisma, { cachePrisma } from "@/libs/prisma";
import { yup } from "@/libs/validate";
import { validate } from "@/libs/validate";
import { optionalAuthMiddleware } from "@/middlewares/authMiddleware";
import { PostStatus } from "@prisma/client";
import { Hono } from "hono";

const hashtagController = new Hono();

hashtagController.get("/", async (c) => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Lấy ngày đầu tuần (Chủ nhật)
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay())); // Lấy ngày cuối tuần (Thứ Bảy)
  endOfWeek.setHours(23, 59, 59, 999);

  const hashtags = await cachePrisma.hashtag.findMany({
    select: {
      name: true,
      _count: {
        select: {
          postHashtags: {
            where: {
              post: {
                // createdAt: {
                //   gte: startOfWeek,
                //   lte: endOfWeek,
                // },
              },
            },
          },
        },
      },
    },
    orderBy: {
      postHashtags: { _count: "desc" }, // Sắp xếp theo số lượng bài viết giảm dần
    },
    take: 5,
    cache: {
      ttl: 60 * 30, // 30 phút
      key: "hashtags",
    },
  });

  const list = hashtags.map((hashtag) => ({
    name: hashtag.name,
    postCount: hashtag._count.postHashtags,
  }));

  return c.json({ code: 200, data: list });
});

hashtagController.get("/:hashtag", optionalAuthMiddleware, async (c) => {
  const { user } = c.var;

  const query = await validate(
    {
      cursor: yup.string().optional(),
      limit: yup.number().default(20),
    },
    c.req.query()
  );
  const hashtagName = c.req.param("hashtag");

  try {
    const posts = await prisma.post.findMany({
      where: {
        hashTags: {
          some: {
            hashtag: {
              name: hashtagName,
            },
          },
        },
        status: PostStatus.ACTIVE,
      },
      select: postSelect(user),
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
    });

    return c.json({
      code: 200,
      data: {
        posts: posts,
        hasMore: posts.length === query.limit,
        cursor: posts.length > 0 ? posts[posts.length - 1].id : null,
      },
    });
  } catch (error) {
    return c.json({ code: -100, message: "Lỗi khi lấy danh sách bài viết" });
  }
});

export default hashtagController;
