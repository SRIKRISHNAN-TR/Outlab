import { useQuery } from "@tanstack/react-query";
import { Mail, Plus } from "lucide-react";
import { emailsApi } from "@/lib/api/emails";
import { EmailTable } from "../components/EmailTable";
import { EmailStats } from "../components/EmailStats";
import { EmptyState } from "@/components/EmptyState";
import { useCompose } from "@/lib/compose-context";

export function AllEmailsPage() {
  const { openCompose } = useCompose();

  const { data: emails = [], isLoading, isError } = useQuery({
    queryKey: ["emails", "all"],
    queryFn: emailsApi.list,
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">All Emails</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your complete email history
          </p>
        </div>
        <button
          id="compose-btn-all"
          onClick={openCompose}
          className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" />
          Compose
        </button>
      </div>

      <EmailStats emails={emails} />

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
      ) : isError ? (
        <div className="py-16 text-center text-sm text-destructive">Failed to load emails</div>
      ) : emails.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No emails yet"
          description="Schedule your first email campaign to get started."
          action={
            <button
              id="compose-btn-empty"
              onClick={openCompose}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="size-4" />
              Schedule Email
            </button>
          }
        />
      ) : (
        <EmailTable emails={emails} />
      )}
    </div>
  );
}
