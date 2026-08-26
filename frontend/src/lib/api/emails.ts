import { apiClient } from "./client";
import type { EmailRecord, ScheduleEmailInput } from "../types";

export const emailsApi = {
  /** Fetch all emails (scheduled + sent + failed) */
  async list(): Promise<EmailRecord[]> {
    const res = await apiClient.get<EmailRecord[]>("/api/emails");
    return res.data;
  },

  /** Fetch only scheduled / processing emails */
  async scheduled(): Promise<EmailRecord[]> {
    const res = await apiClient.get<EmailRecord[]>("/api/emails/scheduled");
    return res.data;
  },

  /** Fetch only sent / failed emails */
  async sent(): Promise<EmailRecord[]> {
    const res = await apiClient.get<EmailRecord[]>("/api/emails/sent");
    return res.data;
  },

  /** Schedule a new email campaign */
  async schedule(input: ScheduleEmailInput): Promise<EmailRecord> {
    const res = await apiClient.post<EmailRecord>("/api/emails/schedule", input);
    return res.data;
  },
};
