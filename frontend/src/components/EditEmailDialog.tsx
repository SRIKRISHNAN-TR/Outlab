import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { emailsApi } from "@/lib/api/emails";
import type { EmailRecord } from "@/lib/types";

interface EditEmailDialogProps {
  email: EmailRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEmailDialog({ email, open, onOpenChange }: EditEmailDialogProps) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    if (email) {
      setSubject(email.subject);
      setBody(email.body);
      const iso = email.scheduledAt ? new Date(email.scheduledAt).toISOString().slice(0, 16) : "";
      setScheduledAt(iso);
    }
  }, [email]);

  const { mutate: updateEmail, isPending } = useMutation({
    mutationFn: (data: { id: string; subject: string; body: string; scheduledAt: string }) =>
      emailsApi.update(data.id, {
        subject: data.subject,
        body: data.body,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Scheduled email updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? "Failed to update email");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    if (!subject.trim()) return toast.error("Subject is required");
    if (!body.trim()) return toast.error("Body is required");
    if (!scheduledAt) return toast.error("Schedule date/time is required");

    updateEmail({
      id: email.id,
      subject: subject.trim(),
      body: body.trim(),
      scheduledAt,
    });
  }

  if (!open || !email) return null;

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
          <h2 className="text-base font-semibold text-foreground">Edit Scheduled Email</h2>
          <button
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
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="edit-email-subject">
              Subject
            </label>
            <input
              id="edit-email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Body */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="edit-email-body">
              Body
            </label>
            <textarea
              id="edit-email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Schedule Date/Time */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="edit-email-schedule-at">
              Send at
            </label>
            <input
              id="edit-email-schedule-at"
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
              onClick={() => onOpenChange(false)}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
