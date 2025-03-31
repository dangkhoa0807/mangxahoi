import { mailer } from "./mailer";

interface MailJob {
  id: string;
  options: {
    from: string;
    to: string;
    subject: string;
    html: string;
  };
  attempts: number;
  maxAttempts: number;
}

class MailQueue {
  private queue: MailJob[] = [];
  private processing: boolean = false;
  private maxAttempts: number = 3;
  private retryDelay: number = 5000; // 5 seconds

  async addToQueue(mailOptions: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }) {
    const job: MailJob = {
      id: crypto.randomUUID(),
      options: mailOptions,
      attempts: 0,
      maxAttempts: this.maxAttempts,
    };

    this.queue.push(job);

    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const job = this.queue[0];

    try {
      await mailer.sendMail(job.options);
      this.queue.shift(); // Remove the job after successful processing
      console.log(`Email sent successfully to ${job.options.to}`);
    } catch (error) {
      console.error(`Failed to send email to ${job.options.to}:`, error);
      job.attempts++;

      if (job.attempts >= job.maxAttempts) {
        console.error(`Max attempts reached for email to ${job.options.to}`);
        this.queue.shift(); // Remove failed job after max attempts
      } else {
        // Move failed job to the end of the queue for retry
        this.queue.shift();
        this.queue.push(job);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      }
    }

    // Process next job
    this.processQueue();
  }
}

export const mailQueue = new MailQueue();
