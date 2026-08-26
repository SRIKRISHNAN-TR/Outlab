import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Plus, Upload, Calendar, Clock, Timer } from "lucide-react";
import { emailsApi } from "@/lib/api/emails";

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatPreviewDate(date: string, time: string): string {
  if (!date || !time) return "—";
  try {
    const d = new Date(`${date}T${time}`);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

export function ComposeEmailDialog({ open, onOpenChange }: ComposeEmailDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const today = new Date();
  const defaultDate = today.toISOString().split("T")[0];
  const defaultTime = "10:00";

  const [sendDate, setSendDate] = useState(defaultDate);
  const [sendTime, setSendTime] = useState(defaultTime);
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(200);

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
    setRecipients([]);
    setRecipientInput("");
    setFileName(null);
    setSendDate(defaultDate);
    setSendTime(defaultTime);
    setDelaySeconds(2);
    setHourlyLimit(200);
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

  async function parseFile(file: File) {
    const text = await file.text();
    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
    const unique = [...new Set(emails.map((e) => e.toLowerCase()))].filter(
      (e) => !recipients.includes(e)
    );
    setRecipients((prev) => [...prev, ...unique]);
    setFileName(file.name);
    toast.success(`Added ${unique.length} recipient(s) from ${file.name}`);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return toast.error("Subject is required");
    if (!body.trim()) return toast.error("Email body is required");
    if (recipients.length === 0) return toast.error("Add at least one recipient");
    if (!sendDate || !sendTime) return toast.error("Schedule date and time are required");

    const scheduledDate = new Date(`${sendDate}T${sendTime}`);
    if (scheduledDate <= new Date()) return toast.error("Schedule time must be in the future");

    schedule({
      subject: subject.trim(),
      body: body.trim(),
      recipients,
      scheduledAt: scheduledDate.toISOString(),
      delaySeconds,
      hourlyLimit,
    });
  }

  if (!open) return null;

  const canSubmit = recipients.length > 0;
  const previewDate = formatPreviewDate(sendDate, sendTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog — matches app dark theme */}
      <div
        className="relative z-10 w-full max-w-xl rounded-2xl border border-white/10 bg-card shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
        style={{ maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-semibold text-foreground">Compose New Email</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Create and schedule a batch of emails.</p>
          </div>
          <button
            id="compose-close-btn"
            type="button"
            onClick={() => onOpenChange(false)}
            className="ml-4 flex size-7 items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          <form id="compose-form" onSubmit={handleSubmit}>

            {/* ── EMAIL DETAILS ── */}
            <div className="px-6 pt-5 pb-4">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">
                Email Details
              </p>

              {/* Subject */}
              <div className="mb-4">
                <label htmlFor="email-subject" className="mb-1.5 block text-sm font-medium text-foreground">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  id="email-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="w-full rounded-lg border border-white/10 bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
              </div>

              {/* Body */}
              <div>
                <label htmlFor="email-body" className="mb-1.5 block text-sm font-medium text-foreground">
                  Email Body <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="email-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="Write your email..."
                  className="w-full resize-none rounded-lg border border-white/10 bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
              </div>
            </div>

            {/* ── RECIPIENTS ── */}
            <div className="px-6 pb-4">
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">
                  Recipients
                </p>

                {/* Manual input row */}
                <div className="flex gap-2 mb-3">
                  <input
                    id="email-recipients"
                    type="email"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyDown={handleRecipientKeyDown}
                    placeholder="email@example.com"
                    className="flex-1 rounded-lg border border-white/10 bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  />
                  <button
                    type="button"
                    id="add-recipient-btn"
                    onClick={addRecipient}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <Plus className="size-3.5" />
                    Add
                  </button>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                    dragging
                      ? "border-primary/60 bg-primary/10"
                      : fileName
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-white/10 bg-input/40 hover:border-white/20 hover:bg-input/60"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-secondary">
                      <Upload className="size-4 text-muted-foreground" />
                    </div>
                    {fileName ? (
                      <>
                        <p className="text-sm font-medium text-emerald-400">{fileName}</p>
                        <p className="text-xs text-emerald-500/80">{recipients.filter(r => r.includes("@")).length} loaded</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Drag and drop a CSV or TXT file, or{" "}
                          <span className="text-primary underline underline-offset-2">browse files</span>
                        </p>
                      </>
                    )}
                    <span className="rounded border border-white/10 bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground font-medium">
                      CSV · TXT
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    className="sr-only"
                    onChange={handleFileInput}
                  />
                </div>

                {/* Recipient chips */}
                {recipients.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {recipients.map((r) => (
                      <span
                        key={r}
                        className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground"
                      >
                        {r}
                        <button
                          type="button"
                          onClick={() => removeRecipient(r)}
                          className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── SCHEDULING ── */}
            <div className="px-6 pb-5">
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">
                  Scheduling
                </p>

                {/* Start sending at */}
                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Start sending at
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <input
                        id="email-send-date"
                        type="date"
                        value={sendDate}
                        onChange={(e) => setSendDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full rounded-lg border border-white/10 bg-input pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors [color-scheme:dark]"
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <input
                        id="email-send-time"
                        type="time"
                        value={sendTime}
                        onChange={(e) => setSendTime(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-input pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* Delay Between Emails */}
                <div className="mb-4">
                  <label htmlFor="email-delay" className="mb-1.5 block text-sm font-medium text-foreground">
                    Delay Between Emails
                  </label>
                  <div className="relative">
                    <input
                      id="email-delay"
                      type="number"
                      min={1}
                      max={3600}
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/10 bg-input px-3 py-2.5 pr-20 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      seconds
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Minimum delay between individual email sends.</p>
                </div>

                {/* Hourly Limit */}
                <div className="mb-5">
                  <label htmlFor="email-hourly-limit" className="mb-1.5 block text-sm font-medium text-foreground">
                    Hourly Limit
                  </label>
                  <div className="relative">
                    <input
                      id="email-hourly-limit"
                      type="number"
                      min={1}
                      max={10000}
                      value={hourlyLimit}
                      onChange={(e) => setHourlyLimit(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/10 bg-input px-3 py-2.5 pr-20 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      per hour
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Maximum emails that can be sent during one hour.</p>
                </div>

                {/* Schedule Preview */}
                <div className="rounded-xl border border-white/10 bg-input/50 px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
                    Schedule Preview
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" /> Start time
                    </span>
                    <span className="font-mono text-xs text-foreground">{previewDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3.5" /> Delay
                    </span>
                    <span className="font-mono text-xs text-foreground">{delaySeconds}s between emails</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Timer className="size-3.5" /> Hourly limit
                    </span>
                    <span className="font-mono text-xs text-foreground">{hourlyLimit} emails/hr</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between bg-card">
          <span className="text-xs text-muted-foreground">
            {!canSubmit
              ? "Add recipients or upload a list to continue"
              : `${recipients.length} recipient(s) ready`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="compose-cancel-btn"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="compose-form"
              id="compose-submit-btn"
              disabled={isPending || !canSubmit}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Scheduling…" : "Schedule Emails"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
