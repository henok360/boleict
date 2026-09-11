import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, ROLE_LABELS } from "@/hooks/useCurrentUser";
import { Button, Card, PriorityBadge, SectionTitle, Select, Stat, StatusBadge } from "@/components/ui-kit";
import { EngineerRatingsCard } from "@/components/EngineerRatings";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Bole Sub City IT Support" },
      {
        name: "description",
        content: "Role-based dashboard for tracking Bole Sub City IT support requests end to end.",
      },
      { property: "og:title", content: "Dashboard | Bole Sub City IT Support" },
      { property: "og:description", content: "Track IT support requests across Bole Sub City offices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: me } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: tickets } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const { data } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, username, department");
      return data ?? [];
    },
  });

  const nameOf = (id: string | null) =>
    profiles?.find((p) => p.id === id)?.full_name ?? (id ? "Unknown" : "\u2014");

  const scoped = useMemo(() => {
    if (!me || !tickets) return [];
    if (me.role === "user") return tickets.filter((t) => t.created_by === me.id);
    if (me.role === "engineer") return tickets.filter((t) => t.assigned_to === me.id);
    return tickets;
  }, [me, tickets]);

  const shown = scoped.filter((t) => statusFilter === "all" || t.status === statusFilter);

  const count = (s: string) => scoped.filter((t) => t.status === s).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {me?.role === "user" ? "My support requests" : me?.role === "engineer" ? "My assigned work" : "Support desk overview"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {me?.profile?.full_name} &middot; {me ? ROLE_LABELS[me.role] : ""}
          </p>
        </div>
        <Link to="/tickets/new">
          <Button>New request</Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Total" value={scoped.length} />
        {me?.role === "team_leader" || me?.role === "super_admin" ? (
          <>
            <Stat label="Awaiting review" value={count("submitted")} />
            <Stat label="With engineers" value={count("assigned") + count("accepted") + count("in_progress")} />
            <Stat label="Confirmed, to close" value={count("confirmed")} />
            <Stat label="Closed" value={count("closed")} />
          </>
        ) : me?.role === "engineer" ? (
          <>
            <Stat label="New assignments" value={count("assigned")} />
            <Stat label="Accepted" value={count("accepted")} />
            <Stat label="In progress" value={count("in_progress")} />
            <Stat label="Completed" value={count("completed") + count("confirmed") + count("closed")} />
          </>
        ) : (
          <>
            <Stat label="Awaiting review" value={count("submitted")} />
            <Stat label="Being worked on" value={count("assigned") + count("accepted") + count("in_progress")} />
            <Stat label="Waiting my confirmation" value={count("completed")} />
            <Stat label="Closed" value={count("closed")} />
          </>
        )}
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SectionTitle
            hint={
              me?.role === "team_leader"
                ? "Review new requests, assign engineers and close confirmed work."
                : me?.role === "engineer"
                  ? "Accept assignments, post progress and mark work completed."
                  : "Follow each request through to completion."
            }
          >
            Requests
          </SectionTitle>
          <div className="w-52">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="submitted">Awaiting review</option>
              <option value="assigned">Assigned</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Work completed</option>
              <option value="confirmed">Confirmed by user</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Ref</th>
                <th className="py-2 pr-3">Subject</th>
                <th className="py-2 pr-3">Requester</th>
                <th className="py-2 pr-3">Engineer</th>
                <th className="py-2 pr-3">Urgency</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Updated</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((t) => (
                <tr key={t.id}>
                  <td className="py-3 pr-3 font-mono text-xs">{t.reference}</td>
                  <td className="py-3 pr-3 font-medium">{t.title}</td>
                  <td className="py-3 pr-3">{nameOf(t.created_by)}</td>
                  <td className="py-3 pr-3">{nameOf(t.assigned_to)}</td>
                  <td className="py-3 pr-3">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="py-3 pr-3 text-xs text-muted-foreground">
                    {new Date(t.updated_at).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <Link to="/tickets/$id" params={{ id: t.id }}>
                      <Button variant="outline" size="sm">
                        Open
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {!shown.length ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No requests to show.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {me && me.role !== "user" ? (
        <EngineerRatingsCard
          title={me.role === "engineer" ? "My satisfaction ratings" : "IT engineer satisfaction ratings"}
          hint={
            me.role === "engineer"
              ? "Stars staff users gave you when confirming your completed work."
              : "Stars collected from staff users each time they confirm completed work."
          }
          onlyEngineerId={me.role === "engineer" ? me.id : undefined}
        />
      ) : null}
    </div>

  );
}
