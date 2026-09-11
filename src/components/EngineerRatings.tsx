import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, SectionTitle } from "@/components/ui-kit";
import { RatingSummary, StarRating } from "@/components/StarRating";

type RatedTicket = { assigned_to: string | null; rating: number | null };

export type EngineerRatingRow = {
  id: string;
  name: string;
  department: string | null;
  total: number;
  count: number;
  average: number;
  breakdown: Record<number, number>;
};

export function useEngineerRatings() {
  return useQuery({
    queryKey: ["engineer-ratings"],
    queryFn: async (): Promise<EngineerRatingRow[]> => {
      const [{ data: rated }, { data: engineerRoles }, { data: profiles }] = await Promise.all([
        supabase.from("tickets").select("assigned_to, rating").not("rating", "is", null),
        supabase.from("user_roles").select("user_id").eq("role", "engineer"),
        supabase.from("profiles").select("id, full_name, department"),
      ]);

      const rows = (rated ?? []) as unknown as RatedTicket[];
      const ids = new Set<string>((engineerRoles ?? []).map((r) => r.user_id));
      rows.forEach((r) => r.assigned_to && ids.add(r.assigned_to));

      return [...ids]
        .map((id) => {
          const mine = rows.filter((r) => r.assigned_to === id && r.rating !== null);
          const total = mine.reduce((sum, r) => sum + (r.rating ?? 0), 0);
          const breakdown: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          mine.forEach((r) => (breakdown[r.rating as number] = (breakdown[r.rating as number] ?? 0) + 1));
          const profile = profiles?.find((p) => p.id === id);
          return {
            id,
            name: profile?.full_name ?? "Unknown",
            department: profile?.department ?? null,
            total,
            count: mine.length,
            average: mine.length ? total / mine.length : 0,
            breakdown,
          };
        })
        .sort((a, b) => b.total - a.total || b.average - a.average);
    },
  });
}

export function EngineerRatingsCard({
  title = "Engineer satisfaction ratings",
  hint = "Stars collected from staff users each time they confirm completed work.",
  onlyEngineerId,
}: {
  title?: string;
  hint?: string;
  onlyEngineerId?: string | undefined;
}) {
  const { data } = useEngineerRatings();
  const rows = (data ?? []).filter((r) => !onlyEngineerId || r.id === onlyEngineerId);

  return (
    <Card>
      <SectionTitle hint={hint}>{title}</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2 pr-3">IT engineer</th>
              <th className="py-2 pr-3">Office</th>
              <th className="py-2 pr-3">Average</th>
              <th className="py-2 pr-3">Total stars</th>
              <th className="py-2 pr-3">Ratings</th>
              <th className="py-2 pr-3">5★</th>
              <th className="py-2 pr-3">4★</th>
              <th className="py-2 pr-3">3★</th>
              <th className="py-2 pr-3">2★</th>
              <th className="py-2 pr-3">1★</th>
              <th className="py-2">0★</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-3 pr-3 font-medium">{r.name}</td>
                <td className="py-3 pr-3">{r.department || "\u2014"}</td>
                <td className="py-3 pr-3">
                  <RatingSummary average={r.average} count={r.count} />
                </td>
                <td className="py-3 pr-3 font-display font-bold">{r.total}</td>
                <td className="py-3 pr-3">{r.count}</td>
                {[5, 4, 3, 2, 1, 0].map((s) => (
                  <td key={s} className="py-3 pr-3 text-muted-foreground">
                    {r.breakdown[s] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-sm text-muted-foreground">
                  No engineer ratings yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <StarRating value={5} size="sm" /> 5 stars is the highest satisfaction score.
      </p>
    </Card>
  );
}
