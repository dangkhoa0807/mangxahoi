import { Prisma } from "@prisma/client";
import prisma from "@/libs/prisma";
import { onlineUsers } from "@/websocket/services/onlineUsers";
import { queueNotification } from "./notificationQueue";

type Post = Prisma.PostGetPayload<{}>;
type User = Prisma.UserGetPayload<{}>;

class PostQueue {
  private queue: { post: Post; user: User }[] = [];
  private processing: boolean = false;

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const data = this.queue.shift();
      if (!data) continue;

      const { post, user } = data;
      console.log("Xử lý queue post mới", post.id);

      try {
        // Lấy danh sách người theo dõi
        const followers = await prisma.follower.findMany({
          where: {
            followingId: user.id,
          },
          select: {
            followerId: true,
          },
        });

        // Kiểm tra cài đặt thông báo của từng người theo dõi
        for (const follower of followers) {
          await queueNotification({
            id: post.id,
            userId: follower.followerId,
            senderId: user.id,
            message: null,
            redirectUrl: `/post/${post.id}`,
            createdAt: new Date(),
            read: false,
            type: "new_post",
          });
        }
      } catch (error) {
        console.error("Lỗi xử lý thông báo bài viết mới:", error);
      }
    }

    this.processing = false;
  }

  async add(post: Post, user: User) {
    console.log("Đưa vào queue", post.id);
    this.queue.push({ post, user });
    this.processQueue();
  }
}

const postQueue = new PostQueue();

const queueNewPostNotification = async (post: any, user: User) => {
  await postQueue.add(post, user);
};

export { postQueue, queueNewPostNotification };
