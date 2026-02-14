import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getUser();
    if (claimsErr || !claims.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check caller permissions
    const { data: isSuperadmin } = await adminClient.rpc("is_superadmin", {
      _user_id: claims.user.id,
    });
    const { data: isAdminUser } = await adminClient.rpc("is_admin", {
      _user_id: claims.user.id,
    });

    if (!isSuperadmin && !isAdminUser) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const tenantId = url.searchParams.get("tenant_id");

    // ─── LIST ────────────────────────────────────────────────
    if (req.method === "GET" && action === "list") {
      // Get auth emails
      const { data: authUsers } = await adminClient.auth.admin.listUsers({
        perPage: 1000,
      });
      const emailMap: Record<string, string> = {};
      authUsers?.users?.forEach((u: { id: string; email?: string }) => {
        if (u.email) emailMap[u.id] = u.email;
      });

      // Get all roles
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("user_id, role");
      const roleMap: Record<string, string> = {};
      roles?.forEach((r: { user_id: string; role: string }) => {
        roleMap[r.user_id] = r.role;
      });

      if (tenantId) {
        // ── TENANT-SCOPED: only users belonging to this tenant ──
        if (!isSuperadmin) {
          // Verify caller belongs to this tenant
          const { data: isMember } = await adminClient.rpc("is_tenant_member", {
            _user_id: claims.user.id,
            _tenant_id: tenantId,
          });
          if (!isMember) {
            return new Response(JSON.stringify({ error: "Forbidden" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        const { data: tenantUsers } = await adminClient
          .from("tenant_users")
          .select("user_id, role, is_active, created_at")
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false });

        if (!tenantUsers || tenantUsers.length === 0) {
          return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const userIds = tenantUsers.map((tu: { user_id: string }) => tu.user_id);

        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, full_name, avatar_url, is_active, created_at")
          .in("id", userIds);

        const profileMap: Record<string, { full_name: string; avatar_url: string | null; is_active: boolean; created_at: string }> = {};
        profiles?.forEach((p: { id: string; full_name: string; avatar_url: string | null; is_active: boolean; created_at: string }) => {
          profileMap[p.id] = p;
        });

        const users = tenantUsers.map((tu: { user_id: string; role: string; is_active: boolean; created_at: string }) => ({
          id: tu.user_id,
          full_name: profileMap[tu.user_id]?.full_name || "—",
          avatar_url: profileMap[tu.user_id]?.avatar_url || null,
          email: emailMap[tu.user_id] || "",
          role: roleMap[tu.user_id] || null,
          tenant_role: tu.role,
          is_active: tu.is_active && (profileMap[tu.user_id]?.is_active ?? true),
          created_at: tu.created_at,
        }));

        return new Response(JSON.stringify(users), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // ── GLOBAL: all platform users (superadmin only) ──
        if (!isSuperadmin) {
          return new Response(JSON.stringify({ error: "Forbidden: apenas SuperAdmin pode listar todos os usuários" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, full_name, avatar_url, is_active, created_at")
          .order("full_name");

        // Get tenant associations
        const { data: tenantAssocs } = await adminClient
          .from("tenant_users")
          .select("user_id, tenant_id, role");

        const { data: tenants } = await adminClient
          .from("tenants")
          .select("id, name");

        const tenantNameMap: Record<string, string> = {};
        tenants?.forEach((t: { id: string; name: string }) => {
          tenantNameMap[t.id] = t.name;
        });

        const userTenantsMap: Record<string, { tenant_id: string; tenant_name: string; tenant_role: string }[]> = {};
        tenantAssocs?.forEach((ta: { user_id: string; tenant_id: string; role: string }) => {
          if (!userTenantsMap[ta.user_id]) userTenantsMap[ta.user_id] = [];
          userTenantsMap[ta.user_id].push({
            tenant_id: ta.tenant_id,
            tenant_name: tenantNameMap[ta.tenant_id] || "—",
            tenant_role: ta.role,
          });
        });

        const users = (profiles ?? []).map((p: { id: string; full_name: string; avatar_url: string | null; is_active: boolean; created_at: string }) => ({
          ...p,
          email: emailMap[p.id] || "",
          role: roleMap[p.id] || null,
          tenants: userTenantsMap[p.id] || [],
        }));

        return new Response(JSON.stringify(users), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ─── CREATE ──────────────────────────────────────────────
    if (req.method === "POST" && action === "create") {
      const body = await req.json();
      const { email, full_name, password, role, tenant_id: bodyTenantId, tenant_role } = body;

      if (!email || !full_name || !password || !role) {
        return new Response(
          JSON.stringify({ error: "Campos obrigatórios: email, full_name, password, role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Only superadmin can assign superadmin role
      if (role === "superadmin" && !isSuperadmin) {
        return new Response(
          JSON.stringify({ error: "Apenas SuperAdmin pode atribuir esse perfil" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create auth user
      const { data: newUser, error: createErr } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name },
        });

      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Assign global role
      if (newUser?.user) {
        await adminClient.from("user_roles").insert({
          user_id: newUser.user.id,
          role,
          assigned_by: claims.user.id,
        });

        // Associate to tenant if specified
        if (bodyTenantId) {
          await adminClient.from("tenant_users").insert({
            user_id: newUser.user.id,
            tenant_id: bodyTenantId,
            role: tenant_role || "member",
            is_active: true,
          });
        }
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser?.user?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── UPDATE ──────────────────────────────────────────────
    if (req.method === "PUT" && action === "update") {
      const body = await req.json();
      const { user_id, full_name, role, is_active, tenant_id: bodyTenantId, tenant_role } = body;

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Only superadmin can assign superadmin role
      if (role === "superadmin" && !isSuperadmin) {
        return new Response(
          JSON.stringify({ error: "Apenas SuperAdmin pode atribuir esse perfil" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update profile
      const updates: Record<string, unknown> = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (is_active !== undefined) updates.is_active = is_active;

      if (Object.keys(updates).length > 0) {
        await adminClient.from("profiles").update(updates).eq("id", user_id);
      }

      // Update global role
      if (role !== undefined) {
        await adminClient.from("user_roles").delete().eq("user_id", user_id);
        if (role) {
          await adminClient.from("user_roles").insert({
            user_id,
            role,
            assigned_by: claims.user.id,
          });
        }
      }

      // Update tenant association
      if (bodyTenantId && tenant_role !== undefined) {
        const { data: existing } = await adminClient
          .from("tenant_users")
          .select("id")
          .eq("user_id", user_id)
          .eq("tenant_id", bodyTenantId)
          .maybeSingle();

        if (existing) {
          await adminClient
            .from("tenant_users")
            .update({ role: tenant_role })
            .eq("id", existing.id);
        } else {
          await adminClient.from("tenant_users").insert({
            user_id,
            tenant_id: bodyTenantId,
            role: tenant_role,
            is_active: true,
          });
        }
      }

      // If deactivating, also ban the user in auth
      if (is_active !== undefined) {
        await adminClient.auth.admin.updateUserById(user_id, {
          ban_duration: is_active ? "none" : "876600h",
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── ADD TO TENANT ───────────────────────────────────────
    if (req.method === "POST" && action === "add_to_tenant") {
      const body = await req.json();
      const { user_id, tenant_id: targetTenantId, tenant_role: tRole } = body;

      if (!user_id || !targetTenantId) {
        return new Response(
          JSON.stringify({ error: "user_id e tenant_id são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await adminClient.from("tenant_users").insert({
        user_id,
        tenant_id: targetTenantId,
        role: tRole || "member",
        is_active: true,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── REMOVE FROM TENANT ──────────────────────────────────
    if (req.method === "DELETE" && action === "remove_from_tenant") {
      const body = await req.json();
      const { user_id, tenant_id: targetTenantId } = body;

      if (!user_id || !targetTenantId) {
        return new Response(
          JSON.stringify({ error: "user_id e tenant_id são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await adminClient
        .from("tenant_users")
        .delete()
        .eq("user_id", user_id)
        .eq("tenant_id", targetTenantId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
