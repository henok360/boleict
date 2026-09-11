import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { fetchTeamLeaderIds, logEvent, notify } from "@/lib/tickets";
import {
  Alert,
  Button,
  Card,
  Label,
  PriorityBadge,
  SectionTitle,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/tickets/$id")({
  head: () => ({
    meta: [
      { title: "Request details | Bole Sub City IT Support" },
      { name: "description", content: "Full history, assignment and progress of an IT support request." },
      { property: "og:title", content: "Request details | Bole Sub City IT Support" },
      { property: "og:description", content: "Follow an IT support request from review to closure." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TicketDetail,
});

function TicketDetail() {
  const { id } = Route.useParams();
  const { data: me } = useCurrentUser();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [engineerId, setEngineerId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: ticket, refetch } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data } = await supabase.from("tickets").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["ticket-events", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("ticket_events")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });
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

  const { data: engineers } = useQuery({
    queryKey: ["engineers"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id").eq("role", "engineer");
      return (data ?? []).map((r) => r.user_id);
    },
  });

  const nameOf = (uid: string | null) =>
    profiles?.find((p) => p.id === uid)?.full_name ?? (uid ? "Unknown" : "\u2014");

  if (!ticket || !me) return <p className="text-sm text-muted-foreground">Loading request...</p>;

  const isOwner = ticket!.created_by === me!.id;
  const isAssignee = ticket!.assigned_to === me!.id;
  const isLeader = me.role === "team_leader" || me.role === "super_admin";

  async function refreshAll() {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ["ticket-events", id] });
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
  }

  async function update(
    patch: Database["public"]["Tables"]["tickets"]["Update"],
    log: string,
    recipients: (string | null)[],
  ) {
    setError(null);
    const { error: updateError } = await supabase.from("tickets").update(patch).eq("id", id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await logEvent(id, me!.id, log, "status");
    await notify(recipients, id, `${ticket!.reference}: ${log}`);
    await refreshAll();
  }

  async function assign() {
    if (!engineerId) {
      setError("Choose an engineer first.");
      return;
    }
    await update(
      {
        assigned_to: engineerId,
        assigned_by: me!.id,
        assigned_at: new Date().toISOString(),
        status: "assigned",
      },
      `Assigned to ${nameOf(engineerId)} by the team leader.`,
      [engineerId, ticket!.created_by],
    );
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    await logEvent(id, me!.id, comment.trim(), "comment");
    const leaders = await fetchTeamLeaderIds();
    await notify(
      [...new Set([ticket!.created_by, ticket!.assigned_to, ...leaders].filter((u) => u && u !== me!.id))],
      id,
      `${ticket!.reference}: new update from ${me!.profile?.full_name}.`,
    );
    setComment("");
    await refreshAll();
  }

  const leaderIdsPromise = () => fetchTeamLeaderIds();

  return (
    <div className="space-y-5">
      <Link to="/dashboard" className="text-sm text-muted-foreground underline">
        &larr; Back to dashboard
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{ticket!.reference}</p>
            <h1 className="font-display text-2xl font-bold">{ticket.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Raised by {nameOf(ticket!.created_by)} on {new Date(ticket.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm">{ticket.description}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Category</dt>
            <dd className="capitalize">{ticket.category}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Location</dt>
            <dd>{ticket.location || "\u2014"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Engineer</dt>
            <dd>{nameOf(ticket!.assigned_to)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Assigned by</dt>
            <dd>{nameOf(ticket.assigned_by)}</dd>
          </div>
        </dl>
      </Card>

      {error ? <Alert>{error}</Alert> : null}

      <Card>
        <SectionTitle hint="Actions available to you at this stage.">Workflow</SectionTitle>
        <div className="flex flex-wrap items-end gap-3">
          {isLeader && ["submitted", "assigned", "rejected"].includes(ticket.status) ? (
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-64">
                <Label htmlFor="eng">Assign IT support engineer</Label>
                <Select id="eng" value={engineerId} onChange={(e) => setEngineerId(e.target.value)}>
                  <option value="">Select engineer</option>
                  {(engineers ?? []).map((uid) => (
                    <option key={uid} value={uid}>
                      {nameOf(uid)}
                    </option>
                  ))}
                </Select>
              </div>
              <Button onClick={assign}>{ticket!.assigned_to ? "Reassign" : "Assign"}</Button>
              {ticket.status === "submitted" ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    update({ status: "rejected" }, "Request rejected by the team leader.", [ticket!.created_by])
                  }
                >
                  Reject
                </Button>
              ) : null}
            </div>
          ) : null}

          {isAssignee && ticket.status === "assigned" ? (
            <Button
              onClick={async () =>
                update(
                  { status: "accepted" },
                  `Assignment accepted by ${me!.profile?.full_name}.`,
                  [ticket!.created_by, ...(await leaderIdsPromise())],
                )
              }
            >
              Accept assignment
            </Button>
          ) : null}

          {isAssignee && ticket.status === "accepted" ? (
            <Button
              onClick={async () =>
                update({ status: "in_progress" }, "Work started on this request.", [
                  ticket!.created_by,
                  ...(await leaderIdsPromise()),
                ])
              }
            >
              Start work
            </Button>
          ) : null}

          {isAssignee && ["accepted", "in_progress"].includes(ticket.status) ? (
            <Button
              variant="accent"
              onClick={async () =>
                update(
                  { status: "completed", completed_at: new Date().toISOString() },
                  "Engineer marked the work as completed. Awaiting user confirmation.",
                  [ticket!.created_by, ...(await leaderIdsPromise())],
                )
              }
            >
              Mark work completed
            </Button>
          ) : null}

          {isOwner && ticket.status === "completed" ? (
            <div className="w-full space-y-3">
              <div>
                <Label>Rate the service you received (0 to 5 stars)</Label>
                <div className="flex items-center gap-3">
                  <StarRating value={rating} onChange={setRating} size="lg" />
                  <span className="text-sm text-muted-foreground">
                    {rating} star{rating === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={async () =>
                    update(
                      {
                        status: "confirmed",
                        confirmed_at: new Date().toISOString(),
                        rating,
                        rated_at: new Date().toISOString(),
                        rated_by: me!.id,
                      } as Database["public"]["Tables"]["tickets"]["Update"],
                      `User confirmed the work is complete and rated the service ${rating} out of 5 stars.`,
                      [ticket!.assigned_to, ...(await leaderIdsPromise())],
                    )
                  }
                >
                  Confirm completion
                </Button>
                <Button
                  variant="outline"
                  onClick={async () =>
                    update({ status: "in_progress" }, "User reported the issue is not yet resolved.", [
                      ticket!.assigned_to,
                      ...(await leaderIdsPromise())),
                    ])
                  }
                >
                  Not resolved yet
                </Button>
              </div>
            </div>
          ) : null}


          {isLeader && ticket.status === "confirmed" ? (
            <Button
              onClick={() =>
                update({ status: "closed", closed_at: new Date().toISOString() }, "Ticket closed by the team leader.", [
                  ticket!.created_by,
                  ticket!.assigned_to,
                ])
              }
            >
              Close ticket
            </Button>
          ) : null}

          {ticket.status === "closed" ? (
            <p className="text-sm text-muted-foreground">This ticket is closed. No further action is needed.</p>
          ) : null}
        </div>
      </Card>

      <Card>
        <SectionTitle hint="Every assignment, response and status change.">History &amp; responses</SectionTitle>
        <ol className="space-y-3 border-l border-border pl-4">
          {(events ?? []).map((ev) => (
            <li key={ev.id}>
              <p className="text-xs text-muted-foreground">
                {nameOf(ev.author_id)} &middot; {new Date(ev.created_at).toLocaleString()}
                {ev.kind === "status" ? " · status update" : ""}
              </p>
              <p className="text-sm">{ev.message}</p>
            </li>
          ))}
          {!events?.length ? <li className="text-sm text-muted-foreground">No activity yet.</li> : null}
        </ol>

        {(isOwner || isAssignee || isLeader) && ticket.status !== "closed" ? (
          <form onSubmit={postComment} className="mt-5 space-y-2">
            <Label htmlFor="cm">Post a response or progress update</Label>
            <Textarea id="cm" value={comment} onChange={(e) => setComment(e.target.value)} />
            <Button type="submit">Post update</Button>
          </form>
        ) : null}
      </Card>
    </div>
  );
}
