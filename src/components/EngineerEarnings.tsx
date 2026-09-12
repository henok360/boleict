import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, SectionTitle } from "@/components/ui-kit";
import { formatETB } from "@/lib/services";

type PricedTicket = {
  assigned_to: string | null;
  service_price: number | null;
  price_locked_at: string | null;
  status: string;
};

export type EarningRow = {
  id: string;
  name: string;
  department: string | null;
  jobs: number;
  confirmedTotal: number;
  pendingTotal: number;
};

export function useEngineerEarnings() {
  return useQuery({
    queryKey: ["engineer-earnings"],
    queryFn: async (): Promise<EarningRow[]> => {
      const [{ data: tickets }, { data: engineerRoles }, { data: profiles }] = await Promise.all([
        supabase.from("tickets").select("assigned_to, service_price, price_locked_at, status"),
        supabase.from("user_roles").select("user_id").eq("role", "engineer"),
        supabase.from("profiles").select("id, full_name, department"),
      ]);

      const rows = ((tickets ?? []) as unknown as PricedTicket[]).filter((t) => t.service_price !== null);
      const ids = new Set<string>((engineerRoles ?? []).map((r) => r.user_id));
      rows.forEach((r) => r.assigned_to && ids.add(r.assigned_to));

      return [...ids]
        .map((id) => {
          const mine = rows.filter((r) => r.assigned_to === id);
          const locked = mine.filter((r) => r.price_locked_at);
          const pending = mine.filter((r) => !r.price_locked_at);
          const profile = profiles?.find((p) => p.id === id);
          return {
            id,
            name: profile?.full_name ?? "Unknown",
            department: profile?.department ?? null,
            jobs: locked.length,
            confirmedTotal: locked.reduce((s, r) => s + Number(r.service_price ?? 0), 0),
            pendingTotal: pending.reduce((s, r) => s + Number(r.service_price ?? 0), 0),
          };
        })
        .sort((a, b) => b.confirmedTotal - a.confirmedTotal);
    },
  });
}

export function EngineerEarningsCard({
  title = "Completed work — financial summary",
  hint = "Total service price of work completed by each IT engineer. Confirmed totals are locked once the staff user approves the work.",
  onlyEngineerId,
}: {
  title?: string;
  hint?: string;
  onlyEngineerId?: string | undefined;
}) {
  const { data } = useEngineerEarnings();
  const rows = (data ?? []).filter((r) => !onlyEngineerId || r.id === onlyEngineerId);
  const grandTotal = rows.reduce((s, r) => s + r.confirmedTotal, 0);
  const grandPending = rows.reduce((s, r) => s + r.pendingTotal, 0);

  return (
    <Card>
      <SectionTitle hint={hint}>{title}</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2 pr-3">IT engineer</th>
              <th className="py-2 pr-3">Office</th>
              <th className="py-2 pr-3">Approved jobs</th>
              <th className="py-2 pr-3">Awaiting approval</th>
              <th className="py-2">Confirmed total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-3 pr-3 font-medium">{r.name}</td>
                <td className="py-3 pr-3">{r.department || "\u2014"}</td>
                <td className="py-3 pr-3">{r.jobs}</td>
                <td className="py-3 pr-3 text-muted-foreground">{formatETB(r.pendingTotal)}</td>
                <td className="py-3 font-display font-bold">{formatETB(r.confirmedTotal)}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No priced work yet.
                </td>
              </tr>
            ) : null}
          </tbody>
          {rows.length ? (
            <tfoot className="border-t border-border">
              <tr>
                <td className="py-3 pr-3 font-semibold" colSpan={3}>
                  Grand total
                </td>
                <td className="py-3 pr-3 text-muted-foreground">{formatETB(grandPending)}</td>
                <td className="py-3 font-display text-base font-bold">{formatETB(grandTotal)}</td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </Card>
  );
}
