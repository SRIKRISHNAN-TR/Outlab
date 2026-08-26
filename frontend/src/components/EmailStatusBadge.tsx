import { cn } from "@/lib/utils";
import type { EmailStatus } from "@/lib/types";

const styles: Record<EmailStatus, string> = {
  scheduled: "bg-info/10 text-info border-info/20",
  sending: "bg-warning/15 text-warning-foreground border-warning/30",
  sent: "bg-success/10 text-success border-success/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const labels: Record<EmailStatus, string> = {
  scheduled: "Scheduled",
  sending: "Sending",
  sent: "Sent",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function EmailStatusBadge({ status }: { status: EmailStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}
