import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Card } from "@/components/ui-kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bole Sub City IT Support Desk" },
      {
        name: "description",
        content:
          "Official IT support desk for Bole Sub City Administration. Submit technical requests, track progress and confirm completed work.",
      },
      { property: "og:title", content: "Bole Sub City IT Support Desk" },
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

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface-header text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent font-display text-sm font-bold text-accent-foreground">
              BSC
            </span>
            <div>
              <p className="font-display text-base font-semibold leading-tight">Bole Sub City</p>
              <p className="text-xs opacity-80">IT Support Management System</p>
            </div>
          </div>
          <Link to="/auth">
            <Button variant="accent" size="sm">
              Staff sign in
            </Button>
          </Link>
        </div>
      </header>

      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h1 className="max-w-2xl font-display text-3xl font-bold text-foreground sm:text-4xl">
            One support desk for every Bole Sub City office
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Report a computer, network or system problem, follow it through review, assignment and repair,
            and confirm the work when your office is back up and running.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/auth">
              <Button>Submit a request</Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline">Track my requests</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-xl font-semibold">How a request moves</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {[
            { n: "1", t: "Request submitted", d: "Staff describe the problem, office and urgency." },
            { n: "2", t: "Team leader review", d: "Every request is reviewed and assigned to an engineer." },
            { n: "3", t: "Engineer works", d: "The engineer accepts, posts progress and marks work done." },
            { n: "4", t: "Confirm & close", d: "The requester confirms, the team leader closes the ticket." },
          ].map((s) => (
            <Card key={s.n}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                {s.n}
              </span>
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground">
          Bole Sub City Administration &middot; Information Technology Directorate
        </div>
      </footer>
    </div>
  );
}
