import prisma from "@/libs/prisma";
import { startOfWeek, endOfWeek } from "date-fns";
import { getUTCTime } from "@/libs/time";

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

interface PostScoreJob {
  postId: string;
  interactionType: keyof ScoreConfig;
  isAdd: boolean;
}

// Implement simple queue
class PostScoreQueue {
  private queue: PostScoreJob[] = [];
  private isProcessing: boolean = false;

  // Add job to queue
  async add(job: PostScoreJob): Promise<void> {
    this.queue.push(job);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Process queue
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift();

    if (job) {
      try {
        await this.processJob(job);
      } catch (error) {
        console.error("Error processing job:", error);
      }
    }

    // Process next job
    await this.processQueue();
  }

  // Process individual job
  private async processJob(job: PostScoreJob): Promise<void> {
    const { postId, interactionType, isAdd } = job;

    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const points =
      INTERACTION_SCORES[interactionType as keyof ScoreConfig] *
      (isAdd ? 1 : -1);

    await prisma.postInteractionScore.upsert({
      where: {
        postId_weekStartDate_weekEndDate: {
          postId,
          weekStartDate: getUTCTime(weekStart),
          weekEndDate: getUTCTime(weekEnd),
        },
      },
      create: {
        postId,
        score: points,
        weekStartDate: getUTCTime(weekStart),
        weekEndDate: getUTCTime(weekEnd),
      },
      update: {
        score: {
          increment: points,
        },
      },
    });
  }
}

// Create singleton instance
const postScoreQueue = new PostScoreQueue();

// Helper function to add jobs
async function addToQueue(data: PostScoreJob) {
  await postScoreQueue.add(data);
}

export { addToQueue };
