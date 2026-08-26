import type { EmailRecord } from "@/lib/types";
import { CalendarClock, CheckCircle, Send, XCircle } from "lucide-react";

interface EmailStatsProps {
  emails: EmailRecord[];
}

export function EmailStats({ emails }: EmailStatsProps) {
  const scheduled = emails.filter((e) => e.status === "scheduled" || e.status === "sending").length;
  const sent = emails.filter((e) => e.status === "sent").length;
  const failed = emails.filter((e) => e.status === "failed").length;
  const total = emails.length;

  const stats = [
    { label: "Total", value: total, icon: Send, color: "text-muted-foreground" },
    { label: "Scheduled", value: scheduled, icon: CalendarClock, color: "text-info" },
    { label: "Sent", value: sent, icon: CheckCircle, color: "text-success" },
    { label: "Failed", value: failed, icon: XCircle, color: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-xl border bg-card p-4"
        >
          <div className={`${color}`}>
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
