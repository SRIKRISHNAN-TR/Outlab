import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Redirect root to dashboard
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});
