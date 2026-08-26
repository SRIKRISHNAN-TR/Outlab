import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { EmailRecord } from "@/lib/types";
import { EmailStatusBadge } from "./EmailStatusBadge";
import { emailsApi } from "@/lib/api/emails";
import { EditEmailDialog } from "./EditEmailDialog";

interface EmailTableProps {
  emails: EmailRecord[];
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${format(d, "MMM d, h:mm a")} (${formatDistanceToNow(d, { addSuffix: true })})`;
}

export function EmailTable({ emails }: EmailTableProps) {
  const queryClient = useQueryClient();
  const [editingEmail, setEditingEmail] = useState<EmailRecord | null>(null);

  const { mutate: deleteEmail } = useMutation({
    mutationFn: emailsApi.delete,
    onSuccess: () => {
      toast.success("Scheduled email deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? "Failed to delete email");
    },
  });

  const handleDelete = (email: EmailRecord) => {
    if (confirm(`Are you sure you want to delete the scheduled email "${email.subject}"?`)) {
      deleteEmail(email.id);
    }
  };

  return (
    <>
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recipients</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Scheduled At</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
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
                  <td className="px-4 py-3 text-right">
                    {email.status === "scheduled" ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingEmail(email)}
                          className="flex size-7 items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit scheduled email"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(email)}
                          className="flex size-7 items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete/Cancel scheduled email"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EditEmailDialog
        email={editingEmail}
        open={Boolean(editingEmail)}
        onOpenChange={(open) => {
          if (!open) setEditingEmail(null);
        }}
      />
    </>
  );
}
