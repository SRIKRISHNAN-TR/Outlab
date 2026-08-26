import { useQuery } from "@tanstack/react-query";
import { LogOut, User } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { useRouter } from "@tanstack/react-router";

export function UserMenu() {
  const router = useRouter();

  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    staleTime: 5 * 60_000,
  });

  const handleLogout = async () => {
    await authApi.logout();
    router.navigate({ to: "/login" });
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="hidden flex-col items-end md:flex">
        <span className="text-xs font-medium text-foreground">{user.name}</span>
        <span className="text-xs text-muted-foreground">{user.email}</span>
      </div>
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="size-8 rounded-full object-cover ring-1 ring-border"
        />
      ) : (
        <div className="flex size-8 items-center justify-center rounded-full bg-accent ring-1 ring-border">
          <User className="size-4 text-muted-foreground" />
        </div>
      )}
      <button
        id="logout-btn"
        onClick={handleLogout}
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        aria-label="Log out"
        title="Log out"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
