import { useState } from "react";
import { Outlet, useRouteContext } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "../components/AppHeader";
import { ComposeEmailDialog } from "../components/ComposeEmailDialog";
import { ComposeContext } from "@/lib/compose-context";

export function DashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <ComposeContext.Provider value={{ openCompose: () => setComposeOpen(true) }}>
      <div className="flex h-screen overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader onOpenNav={() => setMobileNavOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>

      <ComposeEmailDialog open={composeOpen} onOpenChange={setComposeOpen} />
      <Toaster richColors position="top-right" />
    </ComposeContext.Provider>
  );
}
