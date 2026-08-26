import { createFileRoute } from "@tanstack/react-router";
import { authApi } from "@/lib/api/auth";
import { LoginPage } from "@/pages/LoginPage";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
