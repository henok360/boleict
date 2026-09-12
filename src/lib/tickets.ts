import { supabase } from "@/integrations/supabase/client";

export type TicketStatus =
  | "submitted"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "confirmed"
  | "closed"
  | "rejected";

export async function notify(userIds: (string | null | undefined)[], ticketId: string, message: string) {
  const rows = userIds
    .filter((id): id is string => Boolean(id))
    .map((user_id) => ({ user_id, ticket_id: ticketId, message }));
  if (rows.length) await supabase.from("notifications").insert(rows);
}

export async function logEvent(ticketId: string, authorId: string, message: string, kind = "comment") {
  await supabase.from("ticket_events").insert({
    ticket_id: ticketId,
    author_id: authorId,
    message,
    kind,
  });
}

export async function fetchTeamLeaderIds() {
  const { data } = await supabase.from("user_roles").select("user_id").eq("role", "team_leader");
  return (data ?? []).map((r) => r.user_id);
}

export async function fetchEngineerIds() {
  const { data } = await supabase.from("user_roles").select("user_id").eq("role", "engineer");
  return (data ?? []).map((r) => r.user_id);
}
