import { createFileRoute } from "@tanstack/react-router";
import { AllEmailsPage } from "../pages/AllEmailsPage";

export const Route = createFileRoute("/dashboard/")({
  component: AllEmailsPage,
});
