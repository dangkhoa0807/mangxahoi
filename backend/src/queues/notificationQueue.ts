import prisma from "@/libs/prisma";
import { Prisma } from "@prisma/client";
import { onlineUsers } from "@/websocket/services/onlineUsers";
import { getUTCTime } from "@/libs/time";

type Notification = Prisma.NotificationGetPayload<{}>;

// Simple queue implementation
class NotificationQueue {
  private queue: Notification[] = [];
  private isProcessing: boolean = false;

  // Process notifications
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const notification = this.queue.shift();
      if (!notification) continue;

      await this.processNotification(notification);
    }

    this.isProcessing = false;
  }

  private async processNotification(data: Notification) {
    try {
      console.log("Xử lý thông báo");
      const { type, userId, senderId, message, redirectUrl } = data;

      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type,
          redirectUrl,
          createdAt: {
            gte: getUTCTime(new Date(Date.now() - 24 * 60 * 60 * 1000)), // 24 giờ trước
          },
        },
      });

      if (existingNotification) {
        console.log("Bỏ qua thông báo trùng lặp trong 24h");
        return;
      }

      if (type != "new_post") {
        const notificationSettings =
          await prisma.notificationSettings.findUnique({
            where: { userId },
          });

        const settings = notificationSettings || {
          postComments: true,
          postLikes: true,
          commentLikes: true,
          newFollower: true,
          friendRequests: true,
          groupInvites: true,
          directMessages: true,
          emailNotifications: true,
        };

        const settingsMap: Record<string, keyof typeof settings> = {
          like: "postLikes",
          comment: "postComments",
          comment_like: "commentLikes",
          follow: "newFollower",
          friend_request: "friendRequests",
          group_invite: "groupInvites",
          message: "directMessages",
          group_join_accepted: "groupInvites",
          group_join_rejected: "groupInvites",
        };

        const settingKey = settingsMap[type];
        if (!settingKey || !settings[settingKey]) {
          return;
        }
      }

      const notification = await prisma.notification.create({
        data: {
          type,
          userId,
          senderId,
          message,
          redirectUrl: redirectUrl || "",
        },
        include: {
          sender: {
            select: {
              profile: {
                select: {
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      onlineUsers.broadcastToUser(userId, {
        code: 200,
        type: "notification",
        data: notification,
      });
    } catch (error) {
      console.error("Lỗi xử lý thông báo:", error);
    }
  }

  // Add notification to queue
  async add(data: Notification) {
    console.log("Đưa vào queue thông báo", data.userId);
    this.queue.push(data);
    this.processQueue();
  }
}

const notificationQueue = new NotificationQueue();

export const queueNotification = async (data: Notification) => {
  await notificationQueue.add(data);
};

export default notificationQueue;
