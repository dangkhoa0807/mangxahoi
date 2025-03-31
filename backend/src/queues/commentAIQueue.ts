import { Queue, Worker } from "bullmq";
import { redisConfig } from "./config";
import prisma from "@/libs/prisma";
import Anthropic from "@anthropic-ai/sdk";

interface CommentAIJob {
  commentId: string;
  reportId: string;
  content: string;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Create queue
const commentAIQueue = new Queue<CommentAIJob>("comment-ai-analysis", {
  connection: redisConfig,
});

// Process AI analysis jobs
const worker = new Worker(
  "comment-ai-analysis",
  async (job) => {
    const { commentId, reportId, content } = job.data;

    try {
      // Call Claude API to analyze comment
      const response = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Analyze this comment for inappropriate content, harassment, hate speech, or violations. Rate severity from 0-10.
          Comment: "${content}"
          
          Respond in this JSON format:
          {
            "severity": number,
            "reason": "brief explanation",
            "recommendation": "REMOVE or KEEP"
          }`,
          },
        ],
      });

      const analysis = JSON.parse(response.content[0].text);

      // Update report with AI analysis
      await prisma.commentReport.update({
        where: { id: reportId },
        data: {
          aiAnalysis: {
            severity: analysis.severity,
            reason: analysis.reason,
            recommendation: analysis.recommendation,
          },
        },
      });

      // Auto-remove if severity is very high
      if (analysis.severity >= 9) {
        await prisma.$transaction(async (prisma) => {
          // Delete reply comments
          await prisma.comment.deleteMany({
            where: { parentId: commentId },
          });

          // Delete main comment
          await prisma.comment.delete({
            where: { id: commentId },
          });

          // Update report status
          await prisma.commentReport.update({
            where: { id: reportId },
            data: { status: "RESOLVED" },
          });
        });
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      throw error;
    }
  },
  {
    connection: redisConfig,
  }
);

// Add job to queue
async function addToQueue(data: CommentAIJob) {
  await commentAIQueue.add("analyze-comment", data);
}

export { addToQueue };
