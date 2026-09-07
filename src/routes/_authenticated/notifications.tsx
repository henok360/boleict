import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button, Card, SectionTitle } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | Bole Sub City IT Support" },
      { name: "description", content: "Updates on your Bole Sub City IT support requests." },
      { property: "og:title", content: "Notifications | Bole Sub City IT Support" },
      { property: "og:description", content: "Updates on your IT support requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const queryClient = useQueryClient();
  const { data: items } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  async function markAllRead() {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unread-count"] });
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <SectionTitle hint="Every change on your requests appears here.">Notifications</SectionTitle>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Mark all read
        </Button>
      </div>
      <ul className="divide-y divide-border">
        {(items ?? []).map((n) => (
          <li key={n.id} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className={n.read ? "text-sm text-muted-foreground" : "text-sm font-medium"}>{n.message}</p>
              <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            {n.ticket_id ? (
              <Link to="/tickets/$id" params={{ id: n.ticket_id }}>
                <Button variant="outline" size="sm">
                  Open
                </Button>
              </Link>
            ) : null}
          </li>
        ))}
        {!items?.length ? <li className="py-6 text-sm text-muted-foreground">No notifications yet.</li> : null}
      </ul>
    </Card>
  );
}
