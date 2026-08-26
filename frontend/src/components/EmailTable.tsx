import { format, formatDistanceToNow } from "date-fns";
import type { EmailRecord } from "@/lib/types";
import { EmailStatusBadge } from "./EmailStatusBadge";

interface EmailTableProps {
  emails: EmailRecord[];
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${format(d, "MMM d, h:mm a")} (${formatDistanceToNow(d, { addSuffix: true })})`;
}

export function EmailTable({ emails }: EmailTableProps) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recipients</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Scheduled At</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {emails.map((email) => (
              <tr
                key={email.id}
                className="group transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <div className="max-w-xs">
                    <p className="font-medium text-foreground truncate">{email.subject}</p>
                    {email.error && (
                      <p className="mt-0.5 text-xs text-destructive truncate" title={email.error}>
                        {email.error}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {email.recipients.slice(0, 3).map((r) => (
                      <span
                        key={r}
                        className="inline-flex rounded bg-accent px-1.5 py-0.5 text-xs text-accent-foreground"
                        title={r}
                      >
                        {r.split("@")[0]}
                      </span>
                    ))}
                    {email.recipients.length > 3 && (
                      <span className="inline-flex rounded bg-accent px-1.5 py-0.5 text-xs text-muted-foreground">
                        +{email.recipients.length - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(email.scheduledAt)}
                </td>
                <td className="px-4 py-3">
                  <EmailStatusBadge status={email.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
