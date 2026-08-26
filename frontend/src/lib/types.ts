export type EmailStatus = "scheduled" | "sending" | "sent" | "failed" | "cancelled";

export interface EmailRecord {
  id: string;
  subject: string;
  body: string;
  recipients: string[];
  scheduledAt: string;
  sentAt?: string | null;
  status: EmailStatus;
  error?: string | null;
  previewUrl?: string | null;
  openRate?: number;
}

export interface ScheduleEmailInput {
  subject: string;
  body: string;
  recipients: string[];
  scheduledAt: string;
  delaySeconds?: number;
  hourlyLimit?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}
