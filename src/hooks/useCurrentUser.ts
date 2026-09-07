import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "user" | "engineer" | "team_leader" | "super_admin";

export const ROLE_LABELS: Record<Role, string> = {
  user: "Staff user",
  engineer: "IT support engineer",
  team_leader: "Team leader",
  super_admin: "Super admin",
};

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return null;
      const [{ data: profile }, { data: roleRow }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
      ]);
      return {
        id: user.id,
        profile,
        role: (roleRow?.role ?? "user") as Role,
      };
    },
  });
}
