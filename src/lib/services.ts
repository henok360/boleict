import { supabase } from "@/integrations/supabase/client";

export type ServiceItem = {
  id: string;
  code: string;
  category: string;
  category_name: string;
  name_en: string;
  name_am: string | null;
  uom: string;
  default_price: number;
  sort_order: number;
  active: boolean;
};

export const CATEGORY_LABELS: Record<string, string> = {
  A: "A — Network maintenance",
  B: "B — Printer maintenance",
  C: "C — Photocopy maintenance",
  D: "D — Computer maintenance",
};

export async function fetchServiceItems(): Promise<ServiceItem[]> {
  const { data } = await supabase
    .from("service_items")
    .select("id, code, category, category_name, name_en, name_am, uom, default_price, sort_order, active")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });
  return (data ?? []) as unknown as ServiceItem[];
}

export function formatETB(value: number) {
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;
}
