import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { fetchEngineerIds, fetchTeamLeaderIds, logEvent, notify } from "@/lib/tickets";
import { Alert, Button, Card, Input, Label, SectionTitle, Select, Textarea } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/tickets/new")({
  head: () => ({
    meta: [
      { title: "New support request | Bole Sub City IT" },
      {
        name: "description",
        content: "Submit a new IT support request to the Bole Sub City support desk.",
      },
      { property: "og:title", content: "New support request | Bole Sub City IT" },
      { property: "og:description", content: "Report an IT problem to the Bole Sub City support desk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewTicket,
});

function NewTicket() {
  const { data: me } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "hardware",
    priority: "medium",
    location: "",
  });

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setBusy(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("tickets")
      .insert({ ...form, created_by: me.id })
      .select("id, reference")
      .single();
    if (insertError || !data) {
      setBusy(false);
      setError(insertError?.message ?? "Could not submit the request.");
      return;
    }
    await logEvent(data.id, me.id, "Request submitted for team leader review.", "status");
    const [leaders, engineers] = await Promise.all([fetchTeamLeaderIds(), fetchEngineerIds()]);
    await notify(leaders, data.id, `New request ${data.reference} awaiting your review.`);
    await notify(
      engineers,
      data.id,
      `New request ${data.reference}: "${form.title}" was submitted and is awaiting assignment.`,
    );
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
    setBusy(false);
    navigate({ to: "/tickets/$id", params: { id: data.id } });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <SectionTitle hint="Your request goes to the team leader first, who assigns an engineer.">
          New IT support request
        </SectionTitle>
        {error ? (
          <div className="mb-4">
            <Alert>{error}</Alert>
          </div>
        ) : null}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="t">Subject</Label>
            <Input id="t" value={form.title} onChange={set("title")} required placeholder="e.g. Printer not responding" />
          </div>
          <div>
            <Label htmlFor="d">Describe the problem</Label>
            <Textarea id="d" value={form.description} onChange={set("description")} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="c">Category</Label>
              <Select id="c" value={form.category} onChange={set("category")}>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="network">Network / internet</option>
                <option value="account">Account / access</option>
                <option value="printer">Printer</option>
                <option value="general">Other</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="pr">Urgency</Label>
              <Select id="pr" value={form.priority} onChange={set("priority")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="lo">Office / room</Label>
              <Input id="lo" value={form.location} onChange={set("location")} placeholder="e.g. Block B, room 204" />
            </div>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Submitting..." : "Submit request"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
