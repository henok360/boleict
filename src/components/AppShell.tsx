import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, ROLE_LABELS } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui-kit";
import logoAsset from "@/assets/bole-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: unread } = useQuery({
    queryKey: ["unread-count", me?.id],
    enabled: Boolean(me?.id),
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("read", false);
      return count ?? 0;
    },
  });

  useEffect(() => {
    if (!me?.id) return;
    const channel = supabase
      .channel("app-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${me.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread-count"] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me?.id, queryClient]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const links: { to: string; label: string }[] = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/tickets/new", label: "New request" },
    { to: "/notifications", label: `Notifications${unread ? ` (${unread})` : ""}` },
  ];
  if (me?.role === "super_admin") links.push({ to: "/admin", label: "Administration" });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface-header text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img
              src={logoAsset.url}
              alt="Bole Sub City Administration logo"
              className="h-10 w-10 rounded-full bg-white object-cover shadow-sm ring-2 ring-accent/60"
            />
            <span>
              <span className="block font-display text-base font-semibold leading-tight">
                Bole Sub City
              </span>
              <span className="block text-xs opacity-80">IT Support Management System</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:block text-right">
              <span className="block font-medium">{me?.profile?.full_name ?? "\u2014"}</span>
              <span className="block text-xs opacity-80">{me ? ROLE_LABELS[me.role] : ""}</span>
            </span>
            <Button variant="accent" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
        <nav className="border-t border-primary-foreground/15">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "whitespace-nowrap px-3 py-2 text-sm font-medium opacity-80 hover:opacity-100",
                  pathname === l.to && "border-b-2 border-accent opacity-100",
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted-foreground">
        Bole Sub City Administration &middot; Information Technology Directorate
      </footer>
    </div>
  );
}
