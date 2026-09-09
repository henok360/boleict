import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  UserCheck,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  Bell,
  History,
  Users,
  ArrowRight,
  Building2,
  Clock3,
  BarChart3,
} from "lucide-react";
import { Button, Card } from "@/components/ui-kit";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bole Sub City Work Flow Management System" },
      {
        name: "description",
        content:
          "Official IT support desk for Bole Sub City Administration. Submit technical requests, track progress and confirm completed work.",
      },
      { property: "og:title", content: "Bole Sub City Work Flow Management System" },
      {
        property: "og:description",
        content: "Submit, track and resolve IT support requests across Bole Sub City offices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const steps = [
  {
    icon: ClipboardList,
    n: "01",
    t: "Request submitted",
    d: "Staff describe the problem, office and urgency in a guided form.",
  },
  {
    icon: UserCheck,
    n: "02",
    t: "Team leader review",
    d: "Every request is reviewed and assigned to the right engineer.",
  },
  {
    icon: Wrench,
    n: "03",
    t: "Engineer works",
    d: "The engineer accepts, posts progress updates and marks work done.",
  },
  {
    icon: CheckCircle2,
    n: "04",
    t: "Confirm & close",
    d: "The requester confirms the fix, the team leader closes the ticket.",
  },
];

const features = [
  {
    icon: ShieldCheck,
    t: "Role-based access",
    d: "Separate, secure workspaces for staff, engineers, team leaders and the administrator.",
  },
  {
    icon: Bell,
    t: "Live notifications",
    d: "Everyone involved is alerted the moment a request changes hands or status.",
  },
  {
    icon: History,
    t: "Full audit history",
    d: "Every action on a ticket is recorded — who did what, and when.",
  },
  {
    icon: Users,
    t: "Account control",
    d: "Registration pass keys, password resets and account removal managed centrally.",
  },
  {
    icon: Clock3,
    t: "Priority handling",
    d: "Urgent issues surface first so critical services stay running.",
  },
  {
    icon: BarChart3,
    t: "Clear dashboards",
    d: "Each role sees the numbers that matter: open, in progress, awaiting, closed.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-surface-header text-primary-foreground shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-display text-base font-semibold leading-tight">ቦሌ ክፍለ ከተማ አስተዳደር</p>
              <p className="text-xs opacity-80">Work Flow Management System</p>
            </div>
          </div>
          <Link to="/auth">
            <Button variant="accent" size="sm">
              Staff sign in
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-header text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide">
            <Building2 className="h-3.5 w-3.5 text-accent" />
            Official service desk · Information Technology Directorate
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl">
             የኢንፎርሜሽን ቴክኖሎጂ
             አገልግሎት መከታተያ ሲስተም
          </h1>
          <p className="mt-4 max-w-2xl text-base opacity-85 sm:text-lg">
            End-to-End Incident Resolution and Service Continuity Management — one accountable
            channel from the moment a problem is reported until it is confirmed fixed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth">
              <Button variant="accent" size="md">
                Submit a request
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button
                variant="outline"
                size="md"
                className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              >
                Track my requests
              </Button>
            </Link>
          </div>

          {/* Stat strip */}
          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/15 bg-white/15 sm:grid-cols-4">
            {[
              { v: "4-step", l: "Accountable workflow" },
              { v: "100%", l: "Requests reviewed" },
              { v: "Live", l: "Status & notifications" },
              { v: "Secure", l: "Pass-key registration" },
            ].map((s) => (
              <div key={s.l} className="bg-surface-header px-5 py-4">
                <p className="font-display text-2xl font-bold text-accent">{s.v}</p>
                <p className="mt-0.5 text-xs opacity-75">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">The process</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            How a request moves through the system
          </h2>
          <p className="mt-2 text-muted-foreground">
            No request is ever lost or skipped — each one follows the same transparent path with a
            named owner at every stage.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {steps.map((s) => (
            <Card key={s.n} className="relative overflow-hidden transition-shadow hover:shadow-lg">
              <span className="absolute right-4 top-4 font-display text-4xl font-bold text-muted">
                {s.n}
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Built for the administration
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
              A professional desk for every office
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.t} className="flex gap-4 transition-shadow hover:shadow-lg">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
                  <f.icon className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h3 className="font-semibold">{f.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-2xl bg-surface-header px-6 py-12 text-center text-primary-foreground sm:px-12">
          <h2 className="mx-auto max-w-xl font-display text-2xl font-bold sm:text-3xl">
            Ready to report an issue?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm opacity-85">
            Sign in with your staff account to submit a request and follow it through to completion.
          </p>
          <Link to="/auth">
            <Button variant="accent" size="md" className="mt-6">
              Go to sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>Bole Sub City Administration &middot; Information Technology Directorate</p>
          <p>Internal use only — authorized staff accounts required</p>
        </div>
      </footer>
    </div>
  );
}
