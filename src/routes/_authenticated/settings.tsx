import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, ROLE_LABELS } from "@/hooks/useCurrentUser";
import { Alert, Button, Card, Input, Label, SectionTitle } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Profile settings | Bole Sub City IT Support" },
      { name: "description", content: "Change your password and view your permanent account username." },
      { property: "og:title", content: "Profile settings | Bole Sub City IT Support" },
      { property: "og:description", content: "Manage your Bole Sub City IT support account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { data: me } = useCurrentUser();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password.length < 6) return setMessage({ tone: "error", text: "Password must be at least 6 characters." });
    if (password !== confirm) return setMessage({ tone: "error", text: "The two passwords do not match." });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMessage({ tone: "error", text: error.message });
    setPassword("");
    setConfirm("");
    setMessage({ tone: "success", text: "Your password has been updated." });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-2xl font-bold">Profile settings</h1>
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Card>
        <SectionTitle hint="Your username is permanent and cannot be changed by anyone, including administrators.">
          Account
        </SectionTitle>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Username</dt>
            <dd className="font-medium">{me?.profile?.username ?? "\u2014"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Full name</dt>
            <dd>{me?.profile?.full_name ?? "\u2014"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Role</dt>
            <dd>{me ? ROLE_LABELS[me.role] : "\u2014"}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <SectionTitle hint="Choose a new password of at least 6 characters.">Change password</SectionTitle>
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <Label htmlFor="np">New password</Label>
            <Input
              id="np"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <Label htmlFor="cp">Confirm new password</Label>
            <Input
              id="cp"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Update password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
