import { Menu } from "lucide-react";
import { UserMenu } from "./UserMenu";

export function AppHeader({ onOpenNav }: { onOpenNav: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-surface/80 px-4 backdrop-blur">
      <button
        id="mobile-nav-btn"
        className="flex size-8 items-center justify-center rounded-lg hover:bg-accent md:hidden"
        onClick={onOpenNav}
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </button>
      <span className="text-sm font-medium text-muted-foreground md:hidden">ReachInbox</span>
      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  );
}
