import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Plus } from "lucide-react";
import { emailsApi } from "@/lib/api/emails";
import { EmailTable } from "../components/EmailTable";
import { EmptyState } from "../components/EmptyState";
import { useCompose } from "@/lib/compose-context";

export function ScheduledPage() {
  const { openCompose } = useCompose();

  const { data: emails = [], isLoading, isError } = useQuery({
    queryKey: ["emails", "scheduled"],
    queryFn: emailsApi.scheduled,
    refetchInterval: 10_000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Scheduled</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Queued and pending delivery
          </p>
        </div>
        <button
          id="compose-btn-scheduled"
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
          icon={CalendarClock}
          title="No scheduled emails"
          description="All scheduled emails will appear here once you compose one."
          action={
            <button
              id="compose-btn-scheduled-empty"
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
