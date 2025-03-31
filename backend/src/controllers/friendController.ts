import prisma, { cachePrisma } from "@/libs/prisma";
import { validate, yup } from "@/libs/validate";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "@/middlewares/authMiddleware";
import { Hono } from "hono";
import { ObjectId } from "bson";

const friendController = new Hono();

// Thêm bạn bè
friendController.post("/add/:id", authMiddleware, async (c) => {
  const { user } = c.var;
  const friendId = c.req.param("id");

  if (user.id === friendId) {
    return c.json({
      code: -100,
      message: "Bạn không thể gửi yêu cầu kết bạn cho chính mình",
    });
  }

  // Kiểm tra đã là bạn hay chưa
  const existingFriend = await prisma.friend.findFirst({
    where: {
      OR: [
        { userId: user.id, friendId: friendId },
        { userId: friendId, friendId: user.id },
      ],
    },
  });

  if (existingFriend) {
    return c.json({
      code: -102,
      message: "Hai người dùng đã là bạn bè",
    });
  }

  // Kiểm tra request tồn tại hay chưa
  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [{ senderId: user.id, receiverId: friendId }],
    },
  });

  if (existingRequest) {
    return c.json({
      code: -101,
      message: "Yêu cầu kết bạn đã tồn tại",
    });
  }

  const friendRequest = await prisma.friendRequest.create({
    data: {
      senderId: user.id,
      receiverId: friendId,
      status: "pending",
    },
  });

  return c.json({
    code: 200,
    message: "Yêu cầu kết bạn đã được gửi",
    friendRequest,
  });
});

// Huỷ lời mời kết bạn
friendController.post("/cancel/:id", authMiddleware, async (c) => {
  const { user } = c.var;
  const receiverId = c.req.param("id");

  try {
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        senderId: user.id,
        receiverId: receiverId,
        status: "pending",
      },
    });

    if (!friendRequest) {
      return c.json({
        code: -100,
        message: "Yêu cầu kết bạn không tồn tại hoặc đã được xử lý",
      });
    }

    await prisma.friendRequest.delete({
      where: {
        id: friendRequest.id,
      },
    });

    return c.json({
      code: 200,
      message: "Huỷ yêu cầu kết bạn thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: 500,
      message: "Lỗi khi huỷ yêu cầu kết bạn",
    });
  }
});

// Chấp nhận lời mời kết bạn
friendController.post("/accept/:id", authMiddleware, async (c) => {
  const { user } = c.var;
  const idSender = c.req.param("id");

  try {
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        senderId: idSender,
        status: "pending",
      },
    });

    if (!friendRequest) {
      return c.json({
        code: -100,
        message: "Yêu cầu đã được xử lý hoặc không tồn tại",
      });
    }

    await prisma.friendRequest.delete({
      where: {
        id: friendRequest.id,
      },
    });

    await prisma.friend.createMany({
      data: [
        {
          userId: user.id,
          friendId: idSender,
        },
        {
          userId: idSender,
          friendId: user.id,
        },
      ],
    });
    return c.json({ code: 200, message: "Đã thêm bạn bè" });
  } catch (error) {
    return c.json({ code: -100, message: "Lỗi khi lấy danh sách bạn bè" });
  }
});

// Huỷ kết bạn
friendController.post("/unfriend/:id", authMiddleware, async (c) => {
  const { user } = c.var;
  const friendId = c.req.param("id") ?? "";

  try {
    const friend = await prisma.friend.findFirst({
      where: {
        OR: [
          {
            userId: user.id,
            friendId: friendId,
          },
          {
            userId: friendId,
            friendId: user.id,
          },
        ],
      },
    });

    if (!friend) {
      return c.json({
        code: -100,
        message: "Bạn đã không còn là bạn bè với bạn này",
      });
    }

    await prisma.friend.deleteMany({
      where: {
        OR: [
          { userId: user.id, friendId: friendId },
          { userId: friendId, friendId: user.id },
        ],
      },
    });

    return c.json({ code: 200, message: "Huỷ kết bạn thành công" });
  } catch (error) {
    return c.json({ code: -100, message: "Huỷ kết bạn thất bại" });
  }
});

//lấy danh sách yêu cầu kết bạn
friendController.get("/friendRequest", authMiddleware, async (c) => {
  const { user } = c.var;
  const { page = "1", pageSize = "10", search = "" } = c.req.query();
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize) + 1;

  try {
    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        receiverId: user.id,
        status: "pending",
        sender: {
          profile: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      select: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      skip: skip,
      take: take,
      orderBy: {
        createdAt: "desc",
      },
    });

    const hasMore = friendRequests.length === take;

    if (hasMore) {
      friendRequests.pop(); // Remove the extra item used to determine hasMore
    }

    return c.json({
      code: 200,
      data: {
        list: friendRequests,
        hasMore,
      },
    });
  } catch (error) {
    console.error(error);
    return c.json(
      { code: 500, message: "Lỗi khi lấy danh sách yêu cầu kết bạn" },
      500
    );
  }
});

//lấy danh sách bạn bè
friendController.get("/friendList", authMiddleware, async (c) => {
  const { user } = c.var;

  const query = await validate(
    {
      cursor: yup.string().optional(),
      limit: yup.number().required().default(10),
      search: yup.string().optional(),
    },
    c.req.query()
  );

  const searchById = ObjectId.isValid(query.search);

  try {
    // Kết hợp truy vấn với tổng hợp
    const friends = await prisma.friend.findMany({
      where: {
        userId: user.id,
        AND: query.search
          ? {
              OR: [
                searchById
                  ? { user: { id: query.search } }
                  : {
                      user: {
                        profile: {
                          name: { contains: query.search, mode: "insensitive" },
                        },
                      },
                    },
                searchById
                  ? { friend: { id: query.search } }
                  : {
                      friend: {
                        profile: {
                          name: { contains: query.search, mode: "insensitive" },
                        },
                      },
                    },
              ],
            }
          : undefined,
      },
      include: {
        user: {
          include: {
            profile: true,
            _count: {
              select: { followers: true, following: true },
            },
          },
        },
        friend: {
          include: {
            profile: true,
            _count: {
              select: { followers: true, following: true },
            },
          },
        },
      },
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      take: query.limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Chuyển đổi dữ liệu
    const friendListWithCounts = friends.map((relation) => {
      const friendData =
        relation.userId === user.id ? relation.friend : relation.user;
      return {
        id: friendData.id,
        email: friendData.email,
        profile: friendData.profile,
        _count: {
          followers: friendData._count.followers,
          following: friendData._count.following,
        },
      };
    });

    return c.json({
      code: 200,
      data: {
        list: friendListWithCounts,
        hasMore: friends.length === query.limit,
        cursor: friends.length > 0 ? friends[friends.length - 1].id : null,
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({ code: 500, message: "Lỗi khi lấy danh sách bạn bè" });
  }
});

export default friendController;
