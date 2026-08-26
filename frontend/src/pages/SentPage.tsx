import { useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { emailsApi } from "@/lib/api/emails";
import { EmailTable } from "@/components/EmailTable";
import { EmptyState } from "@/components/EmptyState";
import { useCompose } from "@/lib/compose-context";
import { Plus } from "lucide-react";

export function SentPage() {
  const { openCompose } = useCompose();

  const { data: emails = [], isLoading, isError } = useQuery({
    queryKey: ["emails", "sent"],
    queryFn: emailsApi.sent,
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Sent</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Delivered and failed emails
          </p>
        </div>
        <button
          id="compose-btn-sent"
          onClick={openCompose}
          className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" />
          Compose
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
      ) : isError ? (
        <div className="py-16 text-center text-sm text-destructive">Failed to load</div>
      ) : emails.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No sent emails"
          description="Emails that have been delivered or failed will appear here."
        />
      ) : (
        <EmailTable emails={emails} />
      )}
    </div>
  );
}
