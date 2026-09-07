import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useCurrentUser, ROLE_LABELS, type Role } from "@/hooks/useCurrentUser";
import {
  deleteAccount,
  getAccessKeys,
  listAccounts,
  resetUserPassword,
  updateAccessKeys,
} from "@/lib/admin.functions";
import { Alert, Button, Card, Input, Label, SectionTitle } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration | Bole Sub City IT Support" },
      {
        name: "description",
        content: "Super admin controls for accounts, passwords and the 4-digit account creation keys.",
      },
      { property: "og:title", content: "Administration | Bole Sub City IT Support" },
      { property: "og:description", content: "Manage accounts and account creation keys." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { data: me } = useCurrentUser();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [keys, setKeys] = useState({ user_key: "", engineer_key: "", team_leader_key: "" });
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const isSuper = me?.role === "super_admin";

  const { data: savedKeys } = useQuery({
    queryKey: ["access-keys"],
    enabled: isSuper,
    queryFn: () => getAccessKeys(),
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    enabled: isSuper,
    queryFn: () => listAccounts(),
  });

  useEffect(() => {
    if (savedKeys) {
      setKeys({
        user_key: savedKeys.user_key,
        engineer_key: savedKeys.engineer_key,
        team_leader_key: savedKeys.team_leader_key,
      });
    }
  }, [savedKeys]);

  if (!isSuper) {
    return <Alert>This area is restricted to the super admin.</Alert>;
  }

  async function saveKeys(e: React.FormEvent) {
    e.preventDefault();
    const result = await updateAccessKeys({ data: keys });
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    queryClient.invalidateQueries({ queryKey: ["access-keys"] });
    setMessage({ tone: "success", text: "Access keys updated. They apply to new accounts only." });
  }

  async function doReset(userId: string) {
    const result = await resetUserPassword({ data: { userId, newPassword } });
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    setResetFor(null);
    setNewPassword("");
    setMessage({ tone: "success", text: "Password reset successfully." });
  }

  async function doDelete(userId: string, name: string) {
    if (!confirm(`Permanently delete the account of ${name}?`)) return;
    const result = await deleteAccount({ data: { userId } });
    if (!result.ok) return setMessage({ tone: "error", text: result.error });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    setMessage({ tone: "success", text: `${name}'s account was deleted.` });
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Administration</h1>
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Card>
        <SectionTitle hint="Anyone creating an account must enter the key for their account type. Changes apply to new accounts only.">
          Account creation keys
        </SectionTitle>
        <form onSubmit={saveKeys} className="grid gap-4 sm:grid-cols-4">
          <div>
            <Label htmlFor="k1">Staff user key</Label>
            <Input
              id="k1"
              maxLength={4}
              inputMode="numeric"
              value={keys.user_key}
              onChange={(e) => setKeys({ ...keys, user_key: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="k2">IT engineer key</Label>
            <Input
              id="k2"
              maxLength={4}
              inputMode="numeric"
              value={keys.engineer_key}
              onChange={(e) => setKeys({ ...keys, engineer_key: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="k3">Team leader key</Label>
            <Input
              id="k3"
              maxLength={4}
              inputMode="numeric"
              value={keys.team_leader_key}
              onChange={(e) => setKeys({ ...keys, team_leader_key: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit">Save keys</Button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionTitle hint="Reset passwords or remove accounts from the system.">Accounts</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Username</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Office</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(accounts ?? []).map((a) => (
                <tr key={a.id}>
                  <td className="py-3 pr-3 font-medium">{a.full_name}</td>
                  <td className="py-3 pr-3">{a.username}</td>
                  <td className="py-3 pr-3">{ROLE_LABELS[a.role as Role]}</td>
                  <td className="py-3 pr-3">{a.department || "\u2014"}</td>
                  <td className="py-3">
                    {resetFor === a.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          placeholder="New password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-40"
                        />
                        <Button size="sm" onClick={() => doReset(a.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setResetFor(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setResetFor(a.id)}>
                          Reset password
                        </Button>
                        {a.id !== me?.id ? (
                          <Button size="sm" variant="danger" onClick={() => doDelete(a.id, a.full_name)}>
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
