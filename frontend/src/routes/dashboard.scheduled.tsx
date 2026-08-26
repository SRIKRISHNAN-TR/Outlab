import { createFileRoute } from "@tanstack/react-router";
import { ScheduledPage } from "@/pages/ScheduledPage";

export const Route = createFileRoute("/dashboard/scheduled")({
  component: ScheduledPage,
});
