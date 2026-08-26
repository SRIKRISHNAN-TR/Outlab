import "dotenv/config";
import { Queue } from "bullmq";
import { redis } from "../redis.js";

export const EMAIL_QUEUE_NAME = "email-queue";

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 500,
    removeOnFail: 1000,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export interface EmailJobData {
  emailJobId: string;
  to: string;
  subject: string;
  body: string;
}
