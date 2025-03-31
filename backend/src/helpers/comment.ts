import prisma from "@/libs/prisma";
import { onlineUsers } from "@/websocket/services/onlineUsers";
import { Comment, Post, User } from "@prisma/client";

async function sendRealtimeComment(
  comment: Comment,
  post: Post,
  user: User,
  code: number
) {
  if (post.visibility === "PUBLIC") {
    onlineUsers.broadcastToAll(
      {
        code: code,
        type: "comment",
        data: comment,
      },
      [user.id]
    );
  } else if (post.visibility === "FRIENDS") {
    const friends = await prisma.friend.findMany({
      where: {
        userId: user.id,
      },
    });

    const friendIds = friends.map((friend) => friend.friendId);

    onlineUsers.broadcastToUsers(friendIds, {
      code: code,
      type: "comment",
      data: comment,
    });
  } else if (post.visibility === "GROUP") {
    if (!post.groupId) return;

    const group = await prisma.group.findUnique({
      where: { id: post.groupId },
    });

    if (!group) return;

    const groupMembers = await prisma.groupMember.findMany({
      where: {
        groupId: group.id,
      },
    });

    const groupMemberIds = groupMembers.map((member) => member.userId);

    onlineUsers.broadcastToUsers(groupMemberIds, {
      code: code,
      type: "comment",
      data: comment,
    });
  }
}

export { sendRealtimeComment };
