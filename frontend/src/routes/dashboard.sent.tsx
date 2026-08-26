import { createFileRoute } from "@tanstack/react-router";
import { SentPage } from "@/pages/SentPage";

export const Route = createFileRoute("/dashboard/sent")({
  component: SentPage,
});
