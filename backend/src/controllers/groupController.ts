import prisma, { cachePrisma } from "@/libs/prisma";
import { validate, yup } from "@/libs/validate";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "@/middlewares/authMiddleware";
import { Hono } from "hono";
import { ObjectId } from "bson";
import { uploadImage } from "@/libs/uploadImage";
import { postCondition, postSelect } from "@/helpers/posts";

const groupController = new Hono();

// Tạo nhóm
groupController.post("/", authMiddleware, async (c) => {
  const { user } = c.var;

  const body = await validate(
    {
      name: yup.string().required("Tên nhóm không được bỏ trống"),
      description: yup.string().optional(),
      privacy: yup
        .mixed()
        .oneOf(["PUBLIC", "PRIVATE"], "Vui lòng chọn quyền riêng tư"),
    },
    await c.req.json()
  );

  await prisma.group.create({
    data: {
      name: body.name,
      description: body.description,
      ownerId: user.id,
      privacy: body.privacy,
    },
  });

  return c.json({ code: 200, message: "Tạo nhóm thành công" });
});

// Lấy danh sách nhóm đề xuất
groupController.get("/discover", authMiddleware, async (c) => {
  const { user } = c.var;

  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const groups = await prisma.group.findMany({
    where: {
      AND: [
        { ownerId: { not: user.id } }, // Không phải là chủ sở hữu
        {
          members: {
            none: {
              userId: user.id, // Người dùng không phải là thành viên
            },
          },
        },
        // bỏ qua nhóm đã bị chặn
        {
          bannedUsers: {
            none: {
              userId: user.id,
            },
          },
        },
      ],
    },
    include: {
      _count: {
        select: { members: true },
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
    skip: skip,
    take: limit + 1,
  });

  const hasMore = groups.length > limit;

  if (hasMore) {
    groups.pop();
  }

  const transformedGroups = groups.map((group) => ({
    ...group,
    hasJoinRequest: group.joinRequests.length > 0,
    joinRequests: undefined,
  }));

  return c.json({
    code: 200,
    data: {
      groups: transformedGroups,
      pagination: {
        hasMore: hasMore,
      },
    },
  });
});

// Lấy danh sách nhóm đang quản lý
groupController.get("/managed", authMiddleware, async (c) => {
  const { user } = c.var;

  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const groups = await prisma.group.findMany({
    where: {
      OR: [
        {
          ownerId: user.id,
        },
        {
          members: {
            some: {
              userId: user.id,
              role: "ADMIN",
            },
          },
        },
      ],
    },
    include: {
      _count: {
        select: { members: true },
      },
    },
    skip: skip,
    take: limit + 1,
  });

  const hasMore = groups.length > limit;

  if (hasMore) {
    groups.pop();
  }

  return c.json({
    code: 200,
    data: {
      list: groups,
      pagination: {
        hasMore: hasMore,
      },
    },
  });
});

// Lấy danh sách nhóm đang tham gia
groupController.get("/joined", authMiddleware, async (c) => {
  const { user } = c.var;

  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "10", 10);
  const skip = (page - 1) * limit;

  const groups = await prisma.group.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      _count: {
        select: { members: true },
      },
    },
    skip: skip,
    take: limit + 1,
  });

  const hasMore = groups.length > limit;

  if (hasMore) {
    groups.pop();
  }

  return c.json({
    code: 200,
    data: {
      list: groups,
      pagination: {
        hasMore: hasMore,
      },
    },
  });
});

// Lấy danh sách bài viết nhóm
groupController.get("/posts", optionalAuthMiddleware, async (c) => {
  const { user } = c.var;
  const data = await validate(
    {
      groupId: yup.string(),
      page: yup.number().min(1).default(1),
      limit: yup.number().min(1).default(10),
    },
    c.req.query()
  );

  const take = data.limit + 1;

  try {
    const group = data.groupId
      ? await prisma.group.findUnique({
          where: {
            id: data.groupId,
          },
        })
      : null;

    if (group && group.privacy === "PRIVATE") {
      if (!user) {
        return c.json({
          code: 403,
          message: "Bạn phải đăng nhập để xem bài viết",
        });
      }

      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId: group.id,
          userId: user.id,
        },
      });

      if (!membership && group.ownerId !== user.id) {
        return c.json({
          code: 403,
          message: "Bạn phải tham gia nhóm để xem bài viết",
        });
      }
    }

    const posts = await prisma.post.findMany({
      where: {
        groupId: { isSet: true },
        ...(group ? { groupId: group.id } : {}),
        ...postCondition(user),
      },
      select: postSelect(user),
      skip: (data.page - 1) * data.limit,
      take: take,
      orderBy: {
        createdAt: "desc",
      },
    });

    const hasMore = posts.length === take;
    if (hasMore) {
      posts.pop();
    }

    return c.json({
      code: 200,
      data: {
        list: posts,
        pagination: {
          hasMore: hasMore,
          currentPage: data.page,
        },
      },
    });
  } catch (error) {
    console.log(error);
    return c.json({ code: 500, message: "Lỗi khi lấy danh sách bài viết" });
  }
});

// Tạo middleware
groupController.use("/:id/*", optionalAuthMiddleware, async (c, next) => {
  const user = c.var.user;
  const id = c.req.param("id") ?? "";

  if (!ObjectId.isValid(id)) {
    return c.json({ code: -100, message: "ID không đúng định dạng" });
  }

  const group = await prisma.group.findFirst({
    where: {
      id: id,
    },
    include: {
      _count: {
        select: { members: true },
      },
      owner: {
        select: {
          id: true,
          profile: {
            select: {
              avatarUrl: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!group) {
    return c.json({ code: -100, message: "Nhóm không tồn tại" });
  }

  if (user) {
    const bannedMember = await prisma.groupBannedMember.findFirst({
      where: {
        groupId: group.id,
        userId: user.id,
      },
    });

    if (bannedMember) {
      return c.json({
        code: -100,
        message: `Bạn đã bị cấm khỏi nhóm`,
        data: {
          reason: bannedMember.reason,
          endAt: bannedMember.endAt,
        },
      });
    }
  }

  c.set("group", group);
  await next();
});

// Lấy thông tin nhóm
groupController.get("/:id", optionalAuthMiddleware, async (c) => {
  const { user, group } = c.var;

  try {
    // Kiểm tra xem người dùng có phải là thành viên không
    const membership = user
      ? await prisma.groupMember.findFirst({
          where: {
            groupId: group.id,
            userId: user.id,
          },
        })
      : null;

    // Kiểm tra xem người dùng có yêu cầu tham gia đang chờ không
    const pendingRequest = user
      ? await prisma.groupJoinRequest.findFirst({
          where: {
            groupId: group.id,
            userId: user.id,
            status: "PENDING",
          },
        })
      : null;

    return c.json({
      code: 200,
      data: {
        ...group,
        isOwner: user ? group.ownerId === user.id : false,
        isJoined: !!membership,
        hasJoinRequest: !!pendingRequest,
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: 500,
      message: "Lỗi khi lấy thông tin nhóm",
    });
  }
});

// Tham gia nhóm / yêu cầu tham gia nhóm nếu nhóm riêng tư
groupController.post("/:id/join", authMiddleware, async (c) => {
  const { user, group } = c.var;

  try {
    // Kiểm tra xem người dùng đã là thành viên chưa
    const existingMember = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: user.id,
      },
    });

    if (existingMember) {
      return c.json({
        code: -100,
        message: "Bạn đã là thành viên của nhóm này",
      });
    }

    const bannedUser = await prisma.groupBannedMember.findFirst({
      where: {
        groupId: group.id,
        userId: user.id,
      },
    });

    if (bannedUser) {
      return c.json({
        code: -100,
        message: "Bạn đã bị cấm khỏi nhóm này",
      });
    }

    // Kiểm tra xem đã có yêu cầu tham gia đang chờ chưa
    const pendingRequest = await prisma.groupJoinRequest.findFirst({
      where: {
        groupId: group.id,
        userId: user.id,
        status: "PENDING",
      },
    });

    if (pendingRequest) {
      return c.json({
        code: -100,
        message: "Bạn đã có yêu cầu tham gia đang chờ xử lý",
      });
    }

    if (group.privacy === "PRIVATE") {
      // Tạo yêu cầu tham gia nếu nhóm riêng tư
      await prisma.groupJoinRequest.create({
        data: {
          groupId: group.id,
          userId: user.id,
          status: "PENDING",
        },
      });

      return c.json({
        code: 201,
        message: "Đã gửi yêu cầu tham gia nhóm",
      });
    } else {
      // Tự động thêm vào nhóm nếu nhóm công khai
      await prisma.groupMember.create({
        data: {
          groupId: group.id,
          userId: user.id,
          role: "MEMBER",
        },
      });

      return c.json({
        code: 200,
        message: "Tham gia nhóm thành công",
      });
    }
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Tham gia nhóm thất bại",
    });
  }
});

// Huỷ yêu cầu tham gia nhóm
groupController.delete("/:id/join", authMiddleware, async (c) => {
  const { user, group } = c.var;

  try {
    // Kiểm tra xem có yêu cầu tham gia đang chờ không
    const pendingRequest = await prisma.groupJoinRequest.findFirst({
      where: {
        groupId: group.id,
        userId: user.id,
        status: "PENDING",
      },
    });

    if (!pendingRequest) {
      return c.json({
        code: -100,
        message: "Không tìm thấy yêu cầu tham gia nhóm",
      });
    }

    // Xóa yêu cầu tham gia
    await prisma.groupJoinRequest.delete({
      where: {
        id: pendingRequest.id,
      },
    });

    return c.json({
      code: 200,
      message: "Đã huỷ yêu cầu tham gia nhóm",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Huỷ yêu cầu tham gia nhóm thất bại",
    });
  }
});

// Rời nhóm
groupController.post("/:id/leave", authMiddleware, async (c) => {
  const { user, group } = c.var;

  try {
    // Kiểm tra xem người dùng có phải là chủ nhóm không
    if (group.ownerId === user.id) {
      return c.json({
        code: -100,
        message: "Chủ nhóm không thể rời nhóm",
      });
    }

    // Kiểm tra xem người dùng có phải là thành viên không
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: user.id,
      },
    });

    if (!membership) {
      return c.json({
        code: -100,
        message: "Bạn không phải là thành viên của nhóm này",
      });
    }

    // Xóa thành viên khỏi nhóm
    await prisma.groupMember.delete({
      where: {
        id: membership.id,
      },
    });

    return c.json({
      code: 200,
      message: "Rời nhóm thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Rời nhóm thất bại",
    });
  }
});

// Lấy danh sách thành viên nhóm
groupController.get("/:id/members", optionalAuthMiddleware, async (c) => {
  const { user } = c.var;

  const { page = "1", pageSize = "10", search = "" } = c.req.query();
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize) + 1;

  const members = await prisma.groupMember.findMany({
    where: {
      groupId: c.var.group.id,
      user: {
        profile: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    },
    select: {
      role: true,
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
    },
    skip: skip,
    take: take,
  });

  const hasMore = members.length === take;

  // Add friendship status and friend request status for each member if there's a logged in user
  const membersWithStatus = user
    ? await Promise.all(
        members.map(async (member) => {
          // Skip checking status with self
          if (member.user.id === user.id) {
            return {
              ...member,
              isFriend: false,
              hasFriendRequest: false,
            };
          }

          const [friendship, friendRequest] = await Promise.all([
            // Check friendship status
            prisma.friend.findFirst({
              where: {
                OR: [
                  { userId: user.id, friendId: member.user.id },
                  { userId: member.user.id, friendId: user.id },
                ],
              },
            }),
            // Check pending friend request
            prisma.friendRequest.findFirst({
              where: {
                OR: [
                  {
                    senderId: user.id,
                    receiverId: member.user.id,
                    status: "pending",
                  },
                ],
              },
            }),
          ]);

          return {
            ...member,
            isFriend: !!friendship,
            hasFriendRequest: !!friendRequest,
          };
        })
      )
    : members.map((member) => ({
        ...member,
        isFriend: false,
        hasFriendRequest: false,
      }));

  if (hasMore) {
    membersWithStatus.pop();
  }

  return c.json({
    code: 200,
    data: {
      list: membersWithStatus,
      hasMore,
    },
  });
});

// Kick thành viên khỏi nhóm
groupController.delete("/:id/members/:userId", authMiddleware, async (c) => {
  const { user, group } = c.var;
  const targetUserId = c.req.param("userId");

  try {
    // Kiểm tra quyền quản trị
    const isAdmin = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: user.id,
        role: "ADMIN",
      },
    });

    if (!isAdmin && group.ownerId !== user.id) {
      return c.json({
        code: -100,
        message: "Bạn không có quyền kick thành viên",
      });
    }

    // Kiểm tra người dùng cần kick có tồn tại không
    const targetMember = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: targetUserId,
      },
    });

    if (!targetMember) {
      return c.json({
        code: -100,
        message: "Người dùng không phải là thành viên của nhóm",
      });
    }

    // Không thể kick chủ nhóm
    if (group.ownerId === targetUserId) {
      return c.json({
        code: -100,
        message: "Không thể kick chủ nhóm",
      });
    }

    // Không thể kick admin khác nếu bạn là admin (chỉ chủ nhóm mới có quyền kick admin)
    if (targetMember.role === "ADMIN" && isAdmin && group.ownerId !== user.id) {
      return c.json({
        code: -100,
        message: "Bạn không có quyền kick quản trị viên khác",
      });
    }

    // Xóa thành viên khỏi nhóm
    await prisma.groupMember.delete({
      where: {
        id: targetMember.id,
      },
    });

    // Tạo thông báo chấp nhận
    await prisma.notification.create({
      data: {
        type: "group_join_accepted",
        userId: targetMember.userId,
        senderId: user.id,
        message: `đã kick bạn khỏi nhóm ${group.name}`,
        redirectUrl: `/groups/${group.id}`,
      },
    });

    return c.json({
      code: 200,
      message: "Đã kick thành viên khỏi nhóm",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Kick thành viên thất bại",
    });
  }
});

// Đổi tên nhóm
groupController.put("/:id/name", authMiddleware, async (c) => {
  const { user, group } = c.var;

  // Kiểm tra quyền quản trị
  const isAdmin = await prisma.groupMember.findFirst({
    where: {
      groupId: group.id,
      userId: user.id,
      role: "ADMIN",
    },
  });

  if (!isAdmin && group.ownerId !== user.id) {
    return c.json({
      code: -100,
      message: "Bạn không có quyền thay đổi tên nhóm",
    });
  }

  const body = await validate(
    {
      name: yup.string().required("Tên nhóm không được bỏ trống"),
    },
    await c.req.json()
  );

  try {
    await prisma.group.update({
      where: { id: group.id },
      data: { name: body.name },
    });

    return c.json({
      code: 200,
      message: "Đổi tên nhóm thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Đổi tên nhóm thất bại",
    });
  }
});

// Chỉnh sửa mô tả nhóm
groupController.put("/:id/description", authMiddleware, async (c) => {
  const { user, group } = c.var;

  // Kiểm tra quyền quản trị
  const isAdmin = await prisma.groupMember.findFirst({
    where: {
      groupId: group.id,
      userId: user.id,
      role: "ADMIN",
    },
  });

  if (!isAdmin && group.ownerId !== user.id) {
    return c.json({
      code: -100,
      message: "Bạn không có quyền thay đổi mô tả nhóm",
    });
  }

  const body = await validate(
    {
      description: yup.string().nullable(),
    },
    await c.req.json()
  );

  try {
    await prisma.group.update({
      where: { id: group.id },
      data: { description: body.description },
    });

    return c.json({
      code: 200,
      message: "Cập nhật mô tả nhóm thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Cập nhật mô tả nhóm thất bại",
    });
  }
});

// Chỉnh sửa quyền riêng tư nhóm
groupController.put("/:id/privacy", authMiddleware, async (c) => {
  const { user, group } = c.var;

  // Kiểm tra quyền quản trị
  const isAdmin = await prisma.groupMember.findFirst({
    where: {
      groupId: group.id,
      userId: user.id,
      role: "ADMIN",
    },
  });

  if (!isAdmin && group.ownerId !== user.id) {
    return c.json({
      code: -100,
      message: "Bạn không có quyền thay đổi quyền riêng tư nhóm",
    });
  }

  const body = await validate(
    {
      privacy: yup
        .mixed()
        .oneOf(["PUBLIC", "PRIVATE"])
        .required("Quyền riêng tư không được bỏ trống"),
    },
    await c.req.json()
  );

  try {
    await prisma.group.update({
      where: { id: group.id },
      data: { privacy: body.privacy },
    });

    return c.json({
      code: 200,
      message: "Cập nhật quyền riêng tư nhóm thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Cập nhật quyền riêng tư nhóm thất bại",
    });
  }
});

// Đổi ảnh nhóm
groupController.put("/:id/icon", authMiddleware, async (c) => {
  const { user, group } = c.var;

  // Kiểm tra quyền quản trị
  const isAdmin = await prisma.groupMember.findFirst({
    where: {
      groupId: group.id,
      userId: user.id,
      role: "ADMIN",
    },
  });

  if (!isAdmin && group.ownerId !== user.id) {
    return c.json({
      code: -100,
      message: "Bạn không có quyền thay đổi ảnh nhóm",
    });
  }

  const formData = await c.req.parseBody();
  const iconFile = formData["icon"];

  if (!(iconFile instanceof File)) {
    return c.json({ code: -100, message: "File ảnh không hợp lệ" });
  }

  try {
    // Chuyển file ảnh thành buffer
    const fileBuffer = Buffer.from(await iconFile.arrayBuffer());

    // Upload và lấy URL ảnh
    const iconUrl = await uploadImage(fileBuffer);

    // Cập nhật URL ảnh vào database
    await prisma.group.update({
      where: { id: group.id },
      data: { iconUrl },
    });

    return c.json({
      code: 200,
      data: { iconUrl },
      message: "Cập nhật ảnh nhóm thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Cập nhật ảnh nhóm thất bại",
    });
  }
});

// Đổi ảnh bìa nhóm
groupController.put("/:id/banner", authMiddleware, async (c) => {
  const { user, group } = c.var;

  // Kiểm tra quyền quản trị
  const isAdmin = await prisma.groupMember.findFirst({
    where: {
      groupId: group.id,
      userId: user.id,
      role: "ADMIN",
    },
  });

  if (!isAdmin && group.ownerId !== user.id) {
    return c.json({
      code: -100,
      message: "Bạn không có quyền thay đổi ảnh bìa nhóm",
    });
  }

  const formData = await c.req.parseBody();
  const bannerFile = formData["banner"];

  if (!(bannerFile instanceof File)) {
    return c.json({ code: -100, message: "File ảnh không hợp lệ" });
  }

  try {
    // Chuyển file ảnh thành buffer
    const fileBuffer = Buffer.from(await bannerFile.arrayBuffer());

    // Upload và lấy URL ảnh
    const bannerUrl = await uploadImage(fileBuffer);

    // Cập nhật URL ảnh vào database
    await prisma.group.update({
      where: { id: group.id },
      data: { bannerUrl },
    });

    return c.json({
      code: 200,
      data: { bannerUrl },
      message: "Cập nhật ảnh bìa nhóm thành công",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Cập nhật ảnh bìa nhóm thất bại",
    });
  }
});

// Ban thành viên trong nhóm
groupController.post("/:id/ban/:userId", authMiddleware, async (c) => {
  const { user, group } = c.var;
  const targetUserId = c.req.param("userId");

  try {
    // Kiểm tra quyền quản trị
    const isAdmin = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: user.id,
        role: "ADMIN",
      },
    });

    if (!isAdmin && group.ownerId !== user.id) {
      return c.json({
        code: -100,
        message: "Bạn không có quyền cấm thành viên",
      });
    }

    // Kiểm tra người dùng cần ban có tồn tại không
    const targetMember = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: targetUserId,
      },
    });

    if (!targetMember) {
      return c.json({
        code: -100,
        message: "Người dùng không phải là thành viên của nhóm",
      });
    }

    // Không thể ban chủ nhóm
    if (group.ownerId === targetUserId) {
      return c.json({
        code: -100,
        message: "Không thể cấm chủ nhóm",
      });
    }

    // Không thể ban admin khác nếu bạn là admin (chỉ chủ nhóm mới có quyền ban admin)
    if (targetMember.role === "ADMIN" && isAdmin && group.ownerId !== user.id) {
      return c.json({
        code: -100,
        message: "Bạn không có quyền cấm quản trị viên khác",
      });
    }

    const body = await validate(
      {
        reason: yup.string().required("Lý do cấm là bắt buộc"),
        endAt: yup.date().nullable(),
      },
      await c.req.json()
    );

    // Kiểm tra xem người dùng đã bị cấm chưa
    const existingBan = await prisma.groupBannedMember.findFirst({
      where: {
        groupId: group.id,
        userId: targetUserId,
        OR: [{ endAt: null }, { endAt: { gt: new Date() } }],
      },
    });

    if (existingBan) {
      return c.json({
        code: -100,
        message: "Người dùng đã bị cấm trong nhóm này",
      });
    }

    // Tạo lệnh cấm mới
    await prisma.groupBannedMember.create({
      data: {
        groupId: group.id,
        userId: targetUserId,
        bannedBy: user.id,
        reason: body.reason,
        endAt: body.endAt,
      },
    });

    // Xóa thành viên khỏi nhóm
    await prisma.groupMember.delete({
      where: {
        id: targetMember.id,
      },
    });

    return c.json({
      code: 200,
      message: "Đã cấm thành viên khỏi nhóm",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Cấm thành viên thất bại",
    });
  }
});

// Hủy cấm thành viên trong nhóm
groupController.delete("/:id/ban/:userId", authMiddleware, async (c) => {
  const { user, group } = c.var;
  const targetUserId = c.req.param("userId");

  try {
    // Kiểm tra quyền quản trị
    const isAdmin = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: user.id,
        role: "ADMIN",
      },
    });

    if (!isAdmin && group.ownerId !== user.id) {
      return c.json({
        code: -100,
        message: "Bạn không có quyền bỏ cấm thành viên",
      });
    }

    // Kiểm tra xem người dùng có bị cấm không
    const bannedMember = await prisma.groupBannedMember.findFirst({
      where: {
        groupId: group.id,
        userId: targetUserId,
      },
    });

    if (!bannedMember) {
      return c.json({
        code: -100,
        message: "Người dùng không bị cấm trong nhóm này",
      });
    }

    // Xóa lệnh cấm
    await prisma.groupBannedMember.delete({
      where: {
        id: bannedMember.id,
      },
    });

    return c.json({
      code: 200,
      message: "Đã bỏ cấm thành viên khỏi nhóm",
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Bỏ cấm thành viên thất bại",
    });
  }
});

// Lấy danh sách người dùng bị chặn trong nhóm
groupController.get("/:id/blocked", authMiddleware, async (c) => {
  const { user, group } = c.var;
  const { page = "1", pageSize = "10", search = "" } = c.req.query();
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize) + 1;

  try {
    // Kiểm tra quyền quản trị
    const isAdmin = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: user.id,
        role: "ADMIN",
      },
    });

    if (!isAdmin && group.ownerId !== user.id) {
      return c.json({
        code: -100,
        message: "Bạn không có quyền xem danh sách người dùng bị chặn",
      });
    }

    // Lấy danh sách người dùng bị chặn
    const blockedUsers = await prisma.groupBannedMember.findMany({
      where: {
        groupId: group.id,
        user: {
          profile: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      select: {
        id: true,
        reason: true,
        endAt: true,
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
        admin: {
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
      },
      skip: skip,
      take: take,
      orderBy: {
        createdAt: "desc",
      },
    });

    const hasMore = blockedUsers.length === take;
    if (hasMore) {
      blockedUsers.pop();
    }

    return c.json({
      code: 200,
      data: {
        list: blockedUsers,
        pagination: {
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Lỗi khi lấy danh sách người dùng bị chặn",
    });
  }
});

// Xử lý yêu cầu tham gia nhóm
groupController.put(
  "/:id/join-requests/:requestId",
  authMiddleware,
  async (c) => {
    const { user, group } = c.var;
    const requestId = c.req.param("requestId");

    try {
      // Kiểm tra quyền quản trị
      const isAdmin = await prisma.groupMember.findFirst({
        where: {
          groupId: group.id,
          userId: user.id,
          role: "ADMIN",
        },
      });

      if (!isAdmin && group.ownerId !== user.id) {
        return c.json({
          code: -100,
          message: "Bạn không có quyền xử lý yêu cầu tham gia nhóm",
        });
      }

      // Validate body
      const body = await validate(
        {
          status: yup
            .string()
            .oneOf(["ACCEPTED", "REJECTED"])
            .required("Trạng thái không được bỏ trống"),
        },
        await c.req.json()
      );

      // Kiểm tra yêu cầu tham gia
      const joinRequest = await prisma.groupJoinRequest.findFirst({
        where: {
          id: requestId,
          groupId: group.id,
          status: "PENDING",
        },
        include: {
          user: true,
        },
      });

      if (!joinRequest) {
        return c.json({
          code: -100,
          message: "Không tìm thấy yêu cầu tham gia hoặc đã được xử lý",
        });
      }

      // Kiểm tra xem người dùng có bị cấm không
      const bannedUser = await prisma.groupBannedMember.findFirst({
        where: {
          groupId: group.id,
          userId: joinRequest.userId,
          OR: [{ endAt: null }, { endAt: { gt: new Date() } }],
        },
      });

      if (bannedUser) {
        return c.json({
          code: -100,
          message: "Người dùng đã bị cấm khỏi nhóm",
        });
      }

      if (body.status === "ACCEPTED") {
        // Thêm người dùng vào nhóm
        await prisma.groupMember.create({
          data: {
            groupId: group.id,
            userId: joinRequest.userId,
            role: "MEMBER",
          },
        });

        // Tạo thông báo chấp nhận
        await prisma.notification.create({
          data: {
            type: "group_join_accepted",
            userId: joinRequest.userId,
            senderId: user.id,
            message: `đã chấp nhận yêu cầu tham gia nhóm ${group.name} của bạn`,
            redirectUrl: `/groups/${group.id}`,
          },
        });
      } else {
        // Tạo thông báo từ chối
        await prisma.notification.create({
          data: {
            type: "group_join_rejected",
            userId: joinRequest.userId,
            senderId: user.id,
            message: `đã từ chối yêu cầu tham gia nhóm ${group.name} của bạn`,
            redirectUrl: `/groups/${group.id}`,
          },
        });
      }

      // Cập nhật trạng thái yêu cầu
      await prisma.groupJoinRequest.delete({
        where: {
          id: requestId,
        },
      });

      return c.json({
        code: 200,
        message:
          body.status === "ACCEPTED"
            ? "Đã chấp nhận yêu cầu tham gia"
            : "Đã từ chối yêu cầu tham gia",
      });
    } catch (error) {
      console.error(error);
      return c.json({
        code: -100,
        message: "Xử lý yêu cầu tham gia thất bại",
      });
    }
  }
);

// Lấy danh sách yêu cầu tham gia nhóm
groupController.get("/:id/join-requests", authMiddleware, async (c) => {
  const { user, group } = c.var;
  const { page = "1", limit = "10", search = "" } = c.req.query();
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit) + 1;

  try {
    // Kiểm tra quyền quản trị
    const isAdmin = await prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId: user.id,
        role: "ADMIN",
      },
    });

    if (!isAdmin && group.ownerId !== user.id) {
      return c.json({
        code: -100,
        message: "Bạn không có quyền xem danh sách yêu cầu tham gia",
      });
    }

    // Lấy danh sách yêu cầu tham gia
    const requests = await prisma.groupJoinRequest.findMany({
      where: {
        groupId: group.id,
        status: "PENDING",
        user: {
          profile: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      select: {
        id: true,
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
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: skip,
      take: take,
    });

    const hasMore = requests.length === take;
    if (hasMore) {
      requests.pop();
    }

    return c.json({
      code: 200,
      data: {
        list: requests,
        pagination: {
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({
      code: -100,
      message: "Lấy danh sách yêu cầu tham gia thất bại",
    });
  }
});

export default groupController;
