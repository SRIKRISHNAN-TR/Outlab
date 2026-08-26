import "dotenv/config";
import { Worker, Job } from "bullmq";
import { redis } from "../redis";
import { db } from "../db";
import { sendEmail } from "../mailer";
import { EMAIL_QUEUE_NAME } from "./emailQueue";

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY ?? "3", 10);
const HOURLY_LIMIT = parseInt(process.env.HOURLY_RATE_LIMIT ?? "100", 10);

interface EmailJobData {
  scheduledEmailId: string;
  to: string;
  subject: string;
  body: string;
}

async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { scheduledEmailId, to, subject, body } = job.data;

  console.log(`📤  Processing email job ${job.id} → ${to}`);

  // Mark as processing
  await db.query(
    `UPDATE scheduled_emails SET status = 'processing', updated_at = now() WHERE id = $1`,
    [scheduledEmailId]
  );

  try {
    // Hourly rate-limit check via Redis
    const hourKey = `rate:${Math.floor(Date.now() / 3_600_000)}`;
    const count = await redis.incr(hourKey);
    await redis.expire(hourKey, 3600);

    if (count > HOURLY_LIMIT) {
      // Rate limited — delay by remaining seconds in the hour
      const secsLeft = 3600 - (Math.floor(Date.now() / 1000) % 3600);
      console.warn(`⏳  Hourly limit (${HOURLY_LIMIT}) reached. Rescheduling in ${secsLeft}s`);
      await redis.decr(hourKey); // give back the count we incremented
      await job.moveToDelayed(Date.now() + secsLeft * 1000);
      // Re-mark as scheduled
      await db.query(
        `UPDATE scheduled_emails SET status = 'scheduled', updated_at = now() WHERE id = $1`,
        [scheduledEmailId]
      );
      return;
    }

    // Send the email via Ethereal SMTP
    const previewUrl = await sendEmail({ to, subject, text: body });

    // Mark as sent (store Ethereal preview URL)
    await db.query(
      `UPDATE scheduled_emails
       SET status = 'sent', sent_at = now(), updated_at = now(),
           preview_url = $2
       WHERE id = $1`,
      [scheduledEmailId, previewUrl]
    );

    console.log(`\n📨  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅  Email sent   → ${to}`);
    console.log(`🔗  Preview URL  → ${previewUrl}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  } catch (err: any) {
    const errMsg = err?.message ?? "Unknown error";
    console.error(`❌  Failed to send to ${to}:`, errMsg);

    // Mark as failed
    await db.query(
      `UPDATE scheduled_emails
       SET status = 'failed', failed_at = now(), error_message = $2, updated_at = now()
       WHERE id = $1`,
      [scheduledEmailId, errMsg]
    );

    throw err; // Let BullMQ handle retries
  }
}

export function startWorker() {
  const worker = new Worker<EmailJobData>(EMAIL_QUEUE_NAME, processEmailJob, {
    connection: redis,
    concurrency: CONCURRENCY,
  });

  worker.on("completed", (job) => {
    console.log(`✔  Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`✖  Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("Worker error:", err);
  });

  console.log(`🚀  Email worker started (concurrency=${CONCURRENCY})`);
  return worker;
}
