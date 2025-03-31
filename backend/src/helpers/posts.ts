import { startOfWeek, endOfWeek } from "date-fns";
import { getUTCTime } from "@/libs/time";
import prisma from "@/libs/prisma";
import { Prisma, User } from "@prisma/client";
import { addToQueue } from "@/queues/postScoreQueue";

interface ScoreConfig {
  reaction: number;
  comment: number;
  share: number;
  save: number;
}

const INTERACTION_SCORES: ScoreConfig = {
  reaction: 1,
  comment: 2,
  share: 3,
  save: 2,
};

// Hàm xáo trộn Fisher-Yates
function shuffleArray(array: any[]): any[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function postSelect(user?: User) {
  return {
    id: true,
    title: true,
    content: true,
    createdAt: true,
    visibility: true,
    status: true,
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
        blockedBy: true,
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
        privacy: true,
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
          },
          select: {
            id: true,
            type: true,
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
  };
}

function postCondition(user?: User) {
  return {
    AND: [
      // Lọc bài viết đang hoạt động
      { status: "ACTIVE" },
      // Lọc bài viết của người dùng bị chặn
      user
        ? {
            NOT: {
              user: {
                OR: [
                  {
                    blockedUsers: {
                      some: { blockedId: user.id },
                    },
                  },
                  {
                    blockedBy: {
                      some: { blockerId: user.id },
                    },
                  },
                ],
              },
            },
          }
        : {},
      // Lọc bài viết theo quyền riêng tư
      {
        OR: user
          ? [
              {
                visibility: "PUBLIC",
              },
              { visibility: "PRIVATE", userId: user.id },
              {
                visibility: "FRIENDS",
                user: {
                  AND: [
                    {
                      friends: {
                        some: {
                          OR: [
                            {
                              friendId: user.id,
                            },
                            {
                              userId: user.id,
                            },
                          ],
                        },
                      },
                    },
                    // Lọc bài viết không bị chặn
                    {
                      NOT: {
                        OR: [
                          { blockedUsers: { some: { blockedId: user.id } } },
                          { blockedBy: { some: { blockerId: user.id } } },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                visibility: "GROUP",
                group: {
                  OR: [
                    // Người dùng là chủ nhóm
                    { ownerId: user.id },
                    // Người dùng là thành viên nhóm và không bị chặn
                    {
                      AND: [
                        {
                          members: {
                            some: {
                              userId: user.id,
                            },
                          },
                        },
                        {
                          NOT: {
                            bannedUsers: {
                              some: {
                                userId: user.id,
                              },
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ]
          : // Nếu không có user thì chỉ lọc bài viết công khai
            [{ visibility: "PUBLIC" }],
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
  } satisfies Prisma.PostWhereInput;
}

async function getLatestPosts(
  user?: User,
  cursor?: string,
  limit: number = 10
) {
  const posts = await prisma.post.findMany({
    where: postCondition(user),
    select: postSelect(user),
    orderBy: {
      createdAt: "desc",
    },
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : undefined,
    take: limit + 1,
  });

  const hasMore = posts.length > limit;
  if (hasMore) {
    posts.pop();
  }

  return {
    list: posts,
    pagination: {
      hasMore,
      cursor: posts.length > 0 ? posts[posts.length - 1].id : null,
    },
  };
}

async function getTrendingPosts(
  user?: User,
  cursor?: string,
  limit: number = 10
) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const postInteractionScores = await prisma.postInteractionScore.findMany({
    where: {
      weekStartDate: getUTCTime(weekStart),
      weekEndDate: getUTCTime(weekEnd),
      post: postCondition(user),
    },
    select: {
      id: true,
      post: {
        select: postSelect(user),
      },
    },
    orderBy: {
      score: "desc",
    },
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : undefined,
    take: limit + 1,
  });

  const posts = postInteractionScores.map(
    (postInteractionScore) => postInteractionScore.post
  );

  const hasMore = posts.length > limit;
  if (hasMore) {
    posts.pop();
  }

  return {
    list: posts,
    pagination: {
      hasMore,
      cursor:
        postInteractionScores.length > 0
          ? postInteractionScores[postInteractionScores.length - 1].id
          : null,
    },
  };
}

// isAdd = true: tăng điểm, isAdd = false: giảm điểm
async function updatePostScore(
  postId: string,
  interactionType: keyof ScoreConfig,
  isAdd: boolean = true
) {
  await addToQueue({
    postId,
    interactionType,
    isAdd,
  });
}

// Xóa điểm tương tác của các tuần trước
async function cleanupOldScores() {
  try {
    const now = new Date();
    const currentWeekStart = startOfWeek(now);

    await prisma.postInteractionScore.deleteMany({
      where: {
        weekEndDate: {
          lt: getUTCTime(currentWeekStart),
        },
      },
    });

    console.log("Điểm tương tác của các tuần trước đã được xóa thành công");
  } catch (error) {
    console.error("Lỗi khi xóa điểm tương tác của các tuần trước:", error);
  }
}

export {
  postCondition,
  postSelect,
  getTrendingPosts,
  getLatestPosts,
  updatePostScore,
  cleanupOldScores,
};
