import "dotenv/config";
import { Router, Request, Response } from "express";
import { db } from "../db";
import { emailQueue } from "../queue/emailQueue";
import { z } from "zod/v4";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Auth guard middleware
function requireAuth(req: Request, res: Response, next: Function) {
  const user = (req.session as any).user;
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  next();
}

// ────────────────────────────────────────────────────────────────────────────
// GET /api/emails — return ALL emails (scheduled + sent + failed) for user
// ────────────────────────────────────────────────────────────────────────────
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const userId = (req.session as any).user.id;
  try {
    const result = await db.query(
      `SELECT
         se.id,
         ec.subject,
         ec.body,
         array_agg(se2.recipient_email ORDER BY se2.scheduled_at) AS recipients,
         se.scheduled_at AS "scheduledAt",
         se.sent_at       AS "sentAt",
         se.status,
         se.error_message AS error
       FROM scheduled_emails se
       JOIN email_campaigns ec ON ec.id = se.campaign_id
       JOIN (
         SELECT campaign_id, recipient_email, scheduled_at
         FROM scheduled_emails
       ) se2 ON se2.campaign_id = se.campaign_id
       WHERE ec.user_id = $1
       GROUP BY se.id, ec.subject, ec.body, se.scheduled_at, se.sent_at, se.status, se.error_message
       ORDER BY se.scheduled_at DESC
       LIMIT 200`,
      [userId]
    );

    // Map to frontend EmailRecord shape
    const emails = result.rows.map(mapRow);
    res.json(emails);
  } catch (err) {
    console.error("GET /api/emails error:", err);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/emails/scheduled
// ────────────────────────────────────────────────────────────────────────────
router.get("/scheduled", requireAuth, async (req: Request, res: Response) => {
  const userId = (req.session as any).user.id;
  try {
    const result = await db.query(
      `SELECT
         se.id,
         ec.subject,
         ec.body,
         array_agg(DISTINCT se2.recipient_email) AS recipients,
         MIN(se.scheduled_at) AS "scheduledAt",
         NULL::timestamptz  AS "sentAt",
         se.status,
         se.error_message AS error
       FROM scheduled_emails se
       JOIN email_campaigns ec ON ec.id = se.campaign_id
       JOIN scheduled_emails se2 ON se2.campaign_id = se.campaign_id
       WHERE ec.user_id = $1
         AND se.status IN ('scheduled', 'processing')
       GROUP BY se.id, ec.subject, ec.body, se.status, se.error_message
       ORDER BY "scheduledAt" ASC`,
      [userId]
    );
    res.json(result.rows.map(mapRow));
  } catch (err) {
    console.error("GET /api/emails/scheduled error:", err);
    res.status(500).json({ error: "Failed to fetch scheduled emails" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/emails/sent
// ────────────────────────────────────────────────────────────────────────────
router.get("/sent", requireAuth, async (req: Request, res: Response) => {
  const userId = (req.session as any).user.id;
  try {
    const result = await db.query(
      `SELECT
         se.id,
         ec.subject,
         ec.body,
         array_agg(DISTINCT se2.recipient_email) AS recipients,
         MIN(se.scheduled_at) AS "scheduledAt",
         MAX(se.sent_at)      AS "sentAt",
         se.status,
         se.error_message AS error
       FROM scheduled_emails se
       JOIN email_campaigns ec ON ec.id = se.campaign_id
       JOIN scheduled_emails se2 ON se2.campaign_id = se.campaign_id
       WHERE ec.user_id = $1
         AND se.status IN ('sent', 'failed')
       GROUP BY se.id, ec.subject, ec.body, se.status, se.error_message
       ORDER BY "sentAt" DESC NULLS LAST`,
      [userId]
    );
    res.json(result.rows.map(mapRow));
  } catch (err) {
    console.error("GET /api/emails/sent error:", err);
    res.status(500).json({ error: "Failed to fetch sent emails" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/emails/schedule
// ────────────────────────────────────────────────────────────────────────────
const scheduleSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  recipients: z.array(z.string().email()).min(1),
  scheduledAt: z.string().datetime(),
  delaySeconds: z.number().int().min(0).default(2),
  hourlyLimit: z.number().int().min(1).default(100),
});

router.post("/schedule", requireAuth, async (req: Request, res: Response) => {
  const userId = (req.session as any).user.id;

  const parse = scheduleSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid request", details: parse.error.flatten() });
  }

  const { subject, body, recipients, scheduledAt, delaySeconds, hourlyLimit } = parse.data;

  try {
    // 1. Ensure the user has a sender record (Ethereal SMTP)
    const { getMailer } = await import("../mailer");
    const mailer = await getMailer();
    const senderEmail = (mailer as any).options?.auth?.user ?? "noreply@ethereal.email";

    let senderRes = await db.query(
      `SELECT id FROM senders WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    let senderId: string;

    if (senderRes.rows.length === 0) {
      // Create an Ethereal sender for this user
      const newSender = await db.query(
        `INSERT INTO senders (user_id, email, display_name, smtp_host, smtp_port, smtp_user, smtp_password)
         VALUES ($1, $2, $3, 'smtp.ethereal.email', 587, $4, $5)
         RETURNING id`,
        [userId, senderEmail, "ReachInbox", senderEmail, (mailer as any).options?.auth?.pass ?? ""]
      );
      senderId = newSender.rows[0].id;
    } else {
      senderId = senderRes.rows[0].id;
    }

    // 2. Create campaign
    const campaignRes = await db.query(
      `INSERT INTO email_campaigns (user_id, subject, body, start_time, delay_seconds, hourly_limit)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [userId, subject, body, new Date(scheduledAt).toISOString(), delaySeconds, hourlyLimit]
    );
    const campaignId = campaignRes.rows[0].id;

    // 3. Create one scheduled_email per recipient and enqueue BullMQ jobs
    const startTime = new Date(scheduledAt).getTime();
    const jobRecords = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipientEmail = recipients[i];
      const jobScheduledAt = new Date(startTime + i * delaySeconds * 1000);
      const delay = Math.max(0, jobScheduledAt.getTime() - Date.now());
      const idempotencyKey = `${campaignId}:${recipientEmail}`;

      const emailRes = await db.query(
        `INSERT INTO scheduled_emails
           (campaign_id, sender_id, recipient_email, subject, body, scheduled_at, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (idempotency_key) DO NOTHING
         RETURNING id`,
        [campaignId, senderId, recipientEmail, subject, body, jobScheduledAt.toISOString(), idempotencyKey]
      );

      if (emailRes.rows.length === 0) continue; // duplicate skipped

      const scheduledEmailId = emailRes.rows[0].id;

      // Enqueue in BullMQ with the delay
      const job = await emailQueue.add(
        "send-email",
        { scheduledEmailId, to: recipientEmail, subject, body },
        {
          delay,
          jobId: idempotencyKey, // deduplication key
        }
      );

      // Store BullMQ job ID
      await db.query(
        `UPDATE scheduled_emails SET bullmq_job_id = $1 WHERE id = $2`,
        [job.id, scheduledEmailId]
      );

      jobRecords.push({ id: scheduledEmailId, to: recipientEmail });
    }

    // Return a summary EmailRecord for the frontend
    const response = {
      id: campaignId,
      subject,
      body,
      recipients,
      scheduledAt,
      status: "scheduled",
    };

    res.status(201).json(response);
  } catch (err) {
    console.error("POST /api/emails/schedule error:", err);
    res.status(500).json({ error: "Failed to schedule emails" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Helper: map a DB row to the frontend EmailRecord shape
// ────────────────────────────────────────────────────────────────────────────
function mapRow(row: any) {
  // Map DB status values to frontend-expected values
  const statusMap: Record<string, string> = {
    processing: "sending",
    scheduled: "scheduled",
    sent: "sent",
    failed: "failed",
  };

  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    recipients: Array.isArray(row.recipients) ? row.recipients : [row.recipients].filter(Boolean),
    scheduledAt: row.scheduledAt,
    sentAt: row.sentAt ?? null,
    status: statusMap[row.status] ?? row.status,
    error: row.error ?? null,
  };
}

export default router;
