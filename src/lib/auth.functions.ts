import { createServerFn } from "@tanstack/react-start";

export type SignupRole = "user" | "engineer" | "team_leader" | "super_admin";

export const USERNAME_DOMAIN = "bolesubcity.local";

function emailFor(username: string) {
  return `${username.trim().toLowerCase()}@${USERNAME_DOMAIN}`;
}

export const getSignupOptions = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin");
  return { superAdminExists: (count ?? 0) > 0 };
});

export const signUpAccount = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      username: string;
      password: string;
      fullName: string;
      department?: string;
      phone?: string;
      role: SignupRole;
      passKey: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const username = data.username.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      return { ok: false as const, error: "Username must be 3-30 characters (letters, numbers, . _ -)." };
    }
    if (data.password.length < 6) {
      return { ok: false as const, error: "Password must be at least 6 characters." };
    }
    if (!data.fullName.trim()) {
      return { ok: false as const, error: "Full name is required." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count: superCount } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");
    const superAdminExists = (superCount ?? 0) > 0;

    if (data.role === "super_admin") {
      if (superAdminExists) {
        return { ok: false as const, error: "A super admin already exists for this system." };
      }
    } else {
      const { data: keys } = await supabaseAdmin
        .from("access_keys")
        .select("user_key, engineer_key, team_leader_key")
        .eq("id", 1)
        .maybeSingle();
      if (!keys) return { ok: false as const, error: "Access keys are not configured yet." };
      const expected =
        data.role === "user"
          ? keys.user_key
          : data.role === "engineer"
            ? keys.engineer_key
            : keys.team_leader_key;
      if (!data.passKey || data.passKey.trim() !== expected) {
        return { ok: false as const, error: "Invalid access key for the selected role." };
      }
    }

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existing) return { ok: false as const, error: "That username is already taken." };

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: emailFor(username),
      password: data.password,
      email_confirm: true,
      user_metadata: { username, full_name: data.fullName },
    });
    if (createError || !created.user) {
      return { ok: false as const, error: createError?.message ?? "Could not create the account." };
    }

    const userId = created.user.id;
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      username,
      full_name: data.fullName.trim(),
      department: data.department?.trim() || null,
      phone: data.phone?.trim() || null,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { ok: false as const, error: profileError.message };
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { ok: false as const, error: "Could not assign the role. " + roleError.message };
    }

    return { ok: true as const, email: emailFor(username) };
  });
