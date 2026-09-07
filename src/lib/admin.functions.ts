import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertSuperAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "super_admin",
  });
  if (error || !data) throw new Error("Forbidden: super admin only.");
}

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, username, full_name, department, phone, created_at")
      .order("created_at", { ascending: false });
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    return (profiles ?? []).map((p) => ({
      ...p,
      role: roles?.find((r) => r.user_id === p.id)?.role ?? "user",
    }));
  });

export const getAccessKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("access_keys")
      .select("user_key, engineer_key, team_leader_key, updated_at")
      .eq("id", 1)
      .maybeSingle();
    return data;
  });

export const updateAccessKeys = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { user_key: string; engineer_key: string; team_leader_key: string }) => data)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context as any);
    for (const value of [data.user_key, data.engineer_key, data.team_leader_key]) {
      if (!/^\d{4}$/.test(value)) return { ok: false as const, error: "Each key must be exactly 4 digits." };
    }
    const set = new Set([data.user_key, data.engineer_key, data.team_leader_key]);
    if (set.size !== 3) return { ok: false as const, error: "The three keys must be different." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("access_keys")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; newPassword: string }) => data)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context as any);
    if (data.newPassword.length < 6)
      return { ok: false as const, error: "Password must be at least 6 characters." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.newPassword,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context as any);
    if (data.userId === context.userId)
      return { ok: false as const, error: "You cannot delete your own super admin account." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
