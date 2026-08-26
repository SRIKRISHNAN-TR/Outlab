import { CalendarClock, Mail, Send } from "lucide-react";
import { Link } from "@tanstack/react-router";

const NAV = [
  { to: "/dashboard", label: "All emails", icon: Mail, exact: true },
  { to: "/dashboard/scheduled", label: "Scheduled", icon: CalendarClock, exact: false },
  { to: "/dashboard/sent", label: "Sent", icon: Send, exact: false },
] as const;

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Mail className="size-4" />
      </span>
      <span className="text-sm font-semibold tracking-tight">ReachInbox</span>
    </div>
  );
}

function NavList() {
  return (
    <nav className="mt-6 flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, exact }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact }}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&.active]:bg-sidebar-accent [&.active]:text-sidebar-accent-foreground"
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-sidebar px-3 py-4 md:block">
      <Brand />
      <NavList />
    </aside>
  );
}
