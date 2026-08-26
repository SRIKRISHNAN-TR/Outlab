import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Plus, Upload } from "lucide-react";
import { emailsApi } from "@/lib/api/emails";

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComposeEmailDialog({ open, onOpenChange }: ComposeEmailDialogProps) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");

  const { mutate: schedule, isPending } = useMutation({
    mutationFn: emailsApi.schedule,
    onSuccess: () => {
      toast.success("Email scheduled successfully!");
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? "Failed to schedule email");
    },
  });

  function resetForm() {
    setSubject("");
    setBody("");
    setRecipientInput("");
    setRecipients([]);
    setScheduledAt("");
  }

  function addRecipient() {
    const email = recipientInput.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email address");
      return;
    }
    if (recipients.includes(email)) {
      toast.error("Already added");
      return;
    }
    setRecipients((prev) => [...prev, email]);
    setRecipientInput("");
  }

  function handleRecipientKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addRecipient();
    }
  }

  function removeRecipient(email: string) {
    setRecipients((prev) => prev.filter((r) => r !== email));
  }

  async function handleFileDrop(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
    const unique = [...new Set(emails.map((e) => e.toLowerCase()))].filter(
      (e) => !recipients.includes(e)
    );
    setRecipients((prev) => [...prev, ...unique]);
    toast.success(`Added ${unique.length} recipient(s)`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return toast.error("Subject is required");
    if (!body.trim()) return toast.error("Body is required");
    if (recipients.length === 0) return toast.error("Add at least one recipient");
    if (!scheduledAt) return toast.error("Schedule date/time is required");

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) return toast.error("Schedule time must be in the future");

    schedule({
      subject: subject.trim(),
      body: body.trim(),
      recipients,
      scheduledAt: scheduledDate.toISOString(),
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-xl rounded-2xl border bg-card shadow-2xl shadow-black/40 sm:mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Schedule Email</h2>
          <button
            id="compose-close-btn"
            onClick={() => onOpenChange(false)}
            className="flex size-7 items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Subject */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="email-subject">
              Subject
            </label>
            <input
              id="email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your email subject"
              className="w-full rounded-lg border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Body */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="email-body">
              Body
            </label>
            <textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Write your email content here..."
              className="w-full resize-none rounded-lg border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Recipients */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="email-recipients">
              Recipients
            </label>
            <div className="flex gap-2">
              <input
                id="email-recipients"
                type="email"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={handleRecipientKeyDown}
                placeholder="email@example.com"
                className="flex-1 rounded-lg border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                id="add-recipient-btn"
                onClick={addRecipient}
                className="flex items-center gap-1.5 rounded-lg border bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Plus className="size-3.5" />
                Add
              </button>
            </div>

            {/* CSV upload */}
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Upload className="size-3.5" />
              <span>Upload CSV / TXT file</span>
              <input type="file" accept=".csv,.txt" className="sr-only" onChange={handleFileDrop} />
            </label>

            {/* Recipient chips */}
            {recipients.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recipients.map((r) => (
                  <span
                    key={r}
                    className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                  >
                    {r}
                    <button
                      type="button"
                      onClick={() => removeRecipient(r)}
                      className="ml-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Date/Time */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="email-schedule-at">
              Send at
            </label>
            <input
              id="email-schedule-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
              className="w-full rounded-lg border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring [color-scheme:dark]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              id="compose-cancel-btn"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="compose-submit-btn"
              disabled={isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isPending ? "Scheduling…" : `Schedule to ${recipients.length || 0} recipient${recipients.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
