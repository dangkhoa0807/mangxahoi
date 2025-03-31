import { Prisma } from "@prisma/client";
import { sendRealtimeComment } from "@/helpers/comment";

type Notification = Prisma.NotificationGetPayload<{}>;

class CommentQueue {
  private queue: Notification[] = [];
  private processing: boolean = false;

  // Xử lý từng item trong queue
  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const data = this.queue.shift();
      if (!data) continue;

      const { comment, post, user, code } = data as any;
      console.log("Xử lý queue", comment.id);

      try {
        await sendRealtimeComment(comment, post, user, code);
      } catch (error) {
        console.error("Lỗi xử lý comment:", error);
      }
    }

    this.processing = false;
  }

  // Thêm item vào queue
  async add(data: any) {
    console.log("Đưa vào queue", data.comment.id);
    this.queue.push(data);
    this.processQueue();
  }
}

const commentQueue = new CommentQueue();

const queueSendRealtimeComment = async (data: any) => {
  await commentQueue.add(data);
};

export { commentQueue, queueSendRealtimeComment };
