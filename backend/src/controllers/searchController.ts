import { postCondition, postSelect } from "@/helpers/posts";
import prisma from "@/libs/prisma";
import { validate, yup } from "@/libs/validate";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "@/middlewares/authMiddleware";
import { Hono } from "hono";

const searchController = new Hono();

// lấy danh sách bài viết tìm kiếm
searchController.get("/post", optionalAuthMiddleware, async (c) => {
  const { user } = c.var;

  const query = await validate(
    {
      cursor: yup.string().optional(),
      limit: yup.number().optional().min(1).max(100).default(10),
      search: yup.string().optional(),
    },
    c.req.query()
  );

  try {
    const posts = await prisma.post.findMany({
      where: {
        AND: [
          postCondition(user),
          {
            OR: [
              {
                title: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
              {
                content: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
      select: postSelect(user),
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : undefined,
      take: query.limit + 1,
      orderBy: {
        createdAt: "desc",
      },
    });

    const hasMore = posts.length === query.limit + 1;

    if (hasMore) {
      posts.pop();
    }

    return c.json({
      code: 200,
      data: {
        list: posts,
        pagination: {
          hasMore,
          cursor: posts.length > 0 ? posts[posts.length - 1].id : null,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({ code: -100, message: "Tìm kiếm thất bại" }, 500);
  }
});

// lấy danh sách người dùng khi tìm kiếm
searchController.get("/user", optionalAuthMiddleware, async (c) => {
  const { user } = c.var; // Lấy user hiện tại từ middleware
  const search = c.req.query("q");

  const query = await validate(
    {
      cursor: yup.string().optional(),
      limit: yup.number().optional().min(1).max(100).default(10),
      search: yup.string().optional(),
    },
    c.req.query()
  );

  try {
    // Tìm người dùng có tên tương tự từ khóa, loại trừ người dùng hiện tại
    const matchedUsers = await prisma.user.findMany({
      where: {
        id: {
          not: user.id, // Loại bỏ user hiện tại
        },
        profile: {
          name: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      },
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
      take: query.limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : undefined,
    });

    const hasMore = matchedUsers.length === query.limit + 1;

    if (hasMore) {
      matchedUsers.pop();
    }

    // Thêm thông tin follower, following count, và trạng thái kết bạn
    const usersWithDetails = await Promise.all(
      matchedUsers.map(async (targetUser) => {
        const [followerCount, followingCount, isFriend, friendRequest] =
          await Promise.all([
            // Đếm số người theo dõi
            prisma.follower.count({
              where: { followingId: targetUser.id },
            }),
            // Đếm số người mà user đang theo dõi
            prisma.follower.count({
              where: { followerId: targetUser.id },
            }),
            // Kiểm tra trạng thái kết bạn
            prisma.friend.findFirst({
              where: {
                OR: [
                  { userId: user.id, friendId: targetUser.id },
                  { userId: targetUser.id, friendId: user.id },
                ],
              },
            }),
            // Kiểm tra yêu cầu kết bạn đang chờ
            prisma.friendRequest.findFirst({
              where: {
                OR: [
                  { senderId: user.id, receiverId: targetUser.id },
                  { senderId: targetUser.id, receiverId: user.id },
                ],
                status: "pending",
              },
            }),
          ]);

        return {
          id: targetUser.id,
          profile: targetUser.profile,
          _count: {
            followers: followerCount,
            following: followingCount,
          },
          isFriend: Boolean(isFriend),
          hasFriendRequest: Boolean(friendRequest), // Thêm trạng thái có yêu cầu kết bạn
        };
      })
    );

    return c.json(
      {
        code: 200,
        message: "Tìm kiếm thành công",
        data: {
          list: usersWithDetails,
          pagination: {
            hasMore,
            cursor:
              matchedUsers.length > 0
                ? matchedUsers[matchedUsers.length - 1].id
                : null,
          },
        },
      },
      200
    );
  } catch (error) {
    console.error(error);
    return c.json({ code: -100, message: "Tìm kiếm thất bại" }, 500);
  }
});

// lấy danh sách nhóm khi tìm kiếm
searchController.get("/groups", authMiddleware, async (c) => {
  const { user } = c.var; // Lấy user hiện tại từ middleware

  const query = await validate(
    {
      cursor: yup.string().optional(),
      limit: yup.number().optional().min(1).max(100).default(10),
      search: yup.string().optional(),
    },
    c.req.query()
  );

  try {
    // Tìm kiếm nhóm theo từ khóa
    const groups = await prisma.group.findMany({
      where: {
        name: {
          contains: query.search, // Tìm kiếm theo tên nhóm
          mode: "insensitive", // Không phân biệt chữ hoa chữ thường
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
        members: {
          where: {
            userId: user.id, // Kiểm tra xem người dùng có phải là thành viên không
          },
        },
        joinRequests: {
          where: {
            userId: user.id,
            status: "PENDING",
          },
          select: {
            id: true,
          },
        },
      },
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : undefined,
      take: query.limit + 1,
    });

    const hasMore = groups.length === query.limit + 1;

    if (hasMore) {
      groups.pop();
    }

    // Thêm thuộc tính isJoined cho từng nhóm
    const groupsWithMembershipStatus = groups.map((group) => ({
      ...group,
      isJoined: group.members.length > 0 || group.ownerId === user.id, // Nếu có thành viên tương ứng với user, gán isJoined là true
      hasJoinRequest: group.joinRequests.length > 0,
    }));

    return c.json({
      code: 200,
      data: {
        list: groupsWithMembershipStatus,
        pagination: {
          hasMore,
          cursor: groups.length > 0 ? groups[groups.length - 1].id : null,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({ code: -100, message: "Tìm kiếm thất bại" }, 500);
  }
});

// lấy danh sách người dùng và nhóm khi tìm kiếm
searchController.get("/all", optionalAuthMiddleware, async (c) => {
  const { user } = c.var;
  const search = c.req.query("q");

  try {
    // Tìm người dùng
    const users = await prisma.user.findMany({
      where: {
        AND: [
          user
            ? {
                id: {
                  not: user.id,
                },
              }
            : {},
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
      take: 5,
    });

    // Tìm nhóm
    const groups = await prisma.group.findMany({
      where: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        iconUrl: true,
        _count: {
          select: { members: true },
        },
        members: user
          ? {
              where: {
                userId: user.id,
              },
            }
          : false,
      },
      take: 5,
    });

    // Thêm thuộc tính isJoined cho từng nhóm
    const groupsWithMembershipStatus = groups.map((group) => ({
      ...group,
      isJoined: group.members?.length > 0,
      members: undefined,
    }));

    return c.json({
      code: 200,
      data: {
        users: users,
        groups: groupsWithMembershipStatus,
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({ code: -100, message: "Tìm kiếm thất bại" });
  }
});

export default searchController;
