import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authApi } from "@/lib/api/auth";
import { DashboardLayout } from "../pages/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const user = await authApi.me();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  component: DashboardLayout,
});
