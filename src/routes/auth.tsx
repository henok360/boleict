import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSignupOptions, signUpAccount, USERNAME_DOMAIN, type SignupRole } from "@/lib/auth.functions";
import { Alert, Button, Card, Input, Label, Select } from "@/components/ui-kit";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | Bole Sub City IT Support" },
      {
        name: "description",
        content:
          "Sign in or register for the Bole Sub City IT support desk to submit and track technical support requests.",
      },
      { property: "og:title", content: "Sign in | Bole Sub City IT Support" },
      {
        property: "og:description",
        content: "Staff access to the Bole Sub City IT support management system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: options } = useQuery({
    queryKey: ["signup-options"],
    queryFn: () => getSignupOptions(),
  });

  const [form, setForm] = useState({
    username: "",
    password: "",
    fullName: "",
    department: "",
    phone: "",
    role: "user" as SignupRole,
    passKey: "",
  });

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: `${form.username.trim().toLowerCase()}@${USERNAME_DOMAIN}`,
      password: form.password,
    });
    setBusy(false);
    if (signInError) {
      setError("Incorrect username or password.");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signUpAccount({ data: form });
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: result.email,
      password: form.password,
    });
    setBusy(false);
    if (signInError) {
      setMode("signin");
      setError("Account created. Please sign in.");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface-header px-4 py-2 text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div>
            <p className="font-display text-sm font-semibold leading-tight">Bole Sub City</p>
            <p className="text-[11px] opacity-80">Work Flow Management System</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-6">
        <Card className="p-4">
          <div className="mb-4 flex rounded-md bg-muted p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 rounded px-3 py-1.5 text-sm font-medium ${
                  mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {error ? (
            <div className="mb-3">
              <Alert>{error}</Alert>
            </div>
          ) : null}

          {mode === "signin" ? (
            <form onSubmit={signIn} className="space-y-3">
              <div>
                <Label htmlFor="u">Username</Label>
                <Input id="u" value={form.username} onChange={set("username")} required autoComplete="username" />
              </div>
              <div>
                <Label htmlFor="p">Password</Label>
                <Input
                  id="p"
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          ) : (
            <form onSubmit={signUp} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fn">Full name</Label>
                  <Input id="fn" value={form.fullName} onChange={set("fullName")} required />
                </div>
                <div>
                  <Label htmlFor="un">Username</Label>
                  <Input id="un" value={form.username} onChange={set("username")} required />
                </div>
                <div>
                  <Label htmlFor="dp">Office / department</Label>
                  <Input id="dp" value={form.department} onChange={set("department")} />
                </div>
                <div>
                  <Label htmlFor="ph">Phone</Label>
                  <Input id="ph" value={form.phone} onChange={set("phone")} />
                </div>
              </div>
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input
                  id="pw"
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label htmlFor="rl">Account type</Label>
                <Select id="rl" value={form.role} onChange={set("role")}>
                  <option value="user">Staff user</option>
                  <option value="engineer">IT support engineer</option>
                  <option value="team_leader">Team leader</option>
                  {options && !options.superAdminExists ? (
                    <option value="super_admin">Super admin (first-time setup)</option>
                  ) : null}
                </Select>
              </div>
              {form.role !== "super_admin" ? (
                <div>
                  <Label htmlFor="pk">4-digit access key</Label>
                  <Input
                    id="pk"
                    inputMode="numeric"
                    maxLength={4}
                    value={form.passKey}
                    onChange={set("passKey")}
                    placeholder="Provided by the super admin"
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Each account type has its own key. Accounts cannot be created without it.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Only one super admin can exist. This option disappears once it is created.
                </p>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Creating account..." : "Create account"}
              </Button>
            </form>
          )}
        </Card>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          <Link to="/" className="underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
