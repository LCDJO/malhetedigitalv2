import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function err(message: string, status = 400) {
  return json({ error: message }, status);
}

async function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { userId: user.id, supabase };
}

async function requireSuperAdmin(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.rpc("is_superadmin", { _user_id: userId });
  if (!data) throw new Error("Forbidden");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId, supabase } = await authenticate(req);
    await requireSuperAdmin(supabase, userId);

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── ADMIN DASHBOARD STATS ───
    if (req.method === "GET" && action === "stats") {
      const [tenantsRes, usersRes, membersRes] = await Promise.all([
        supabase.from("tenants").select("id, is_active"),
        supabase.from("tenant_users").select("id", { count: "exact", head: true }),
        supabase.from("members").select("id", { count: "exact", head: true }),
      ]);

      const tenants = tenantsRes.data ?? [];
      return json({
        totalTenants: tenants.length,
        activeTenants: tenants.filter((t: any) => t.is_active).length,
        totalUsers: usersRes.count ?? 0,
        totalMembers: membersRes.count ?? 0,
      });
    }

    // ─── LIST TENANTS (with configs, plans, member counts) ───
    if (req.method === "GET" && action === "list_tenants") {
      const [tenantsRes, configsRes, plansRes, subsRes, membersRes] = await Promise.all([
        supabase.from("tenants").select("*").order("created_at", { ascending: false }),
        supabase.from("lodge_config").select("*"),
        supabase.from("plans").select("*").eq("is_active", true).order("price"),
        supabase.from("subscriptions").select("id, tenant_id, plan_id, status").eq("status", "active"),
        supabase.from("members").select("tenant_id"),
      ]);

      return json({
        tenants: tenantsRes.data ?? [],
        configs: configsRes.data ?? [],
        plans: plansRes.data ?? [],
        subscriptions: subsRes.data ?? [],
        members: membersRes.data ?? [],
      });
    }

    // ─── CREATE TENANT ───
    if (req.method === "POST" && action === "create_tenant") {
      const body = await req.json();
      if (!body.name || !body.slug) return err("name and slug are required");
      
      const { data, error } = await supabase.from("tenants").insert(body).select("id").single();
      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "CREATE_TENANT",
        target_table: "tenants",
        target_id: data.id,
        details: { name: body.name, via: "api-admin" },
      });

      return json({ id: data.id }, 201);
    }

    // ─── UPDATE TENANT ───
    if (req.method === "PUT" && action === "update_tenant") {
      const body = await req.json();
      const id = body.id;
      if (!id) return err("Missing id");
      const { id: _, ...rest } = body;
      
      const { error } = await supabase.from("tenants").update(rest).eq("id", id);
      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "UPDATE_TENANT",
        target_table: "tenants",
        target_id: id,
        details: { via: "api-admin" },
      });

      return json({ success: true });
    }

    // ─── DELETE (SOFT) TENANT ───
    if (req.method === "DELETE" && action === "delete_tenant") {
      const id = url.searchParams.get("id");
      if (!id) return err("Missing id");

      const now = new Date();
      const purgeDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const { error } = await supabase.from("tenants").update({
        deleted_at: now.toISOString(),
        purge_at: purgeDate.toISOString(),
        is_active: false,
      }).eq("id", id);

      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "DELETE_TENANT",
        target_table: "tenants",
        target_id: id,
        details: { via: "api-admin" },
      });

      return json({ success: true });
    }

    // ─── RESTORE TENANT ───
    if (req.method === "PUT" && action === "restore_tenant") {
      const body = await req.json();
      const id = body.id;
      if (!id) return err("Missing id");

      const { error } = await supabase.from("tenants").update({
        deleted_at: null,
        purge_at: null,
        is_active: true,
      }).eq("id", id);

      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "RESTORE_TENANT",
        target_table: "tenants",
        target_id: id,
        details: { via: "api-admin" },
      });

      return json({ success: true });
    }

    // ─── MANAGE SUBSCRIPTIONS ───
    if (req.method === "PUT" && action === "manage_subscription") {
      const body = await req.json();
      const { tenant_id, plan_id, subscription_id, operation } = body;

      if (operation === "update" && subscription_id) {
        const { error } = await supabase.from("subscriptions").update({ plan_id }).eq("id", subscription_id);
        if (error) return err(error.message, 500);
      } else if (operation === "create" && tenant_id && plan_id) {
        const { data: ownerData } = await supabase
          .from("tenant_users")
          .select("user_id")
          .eq("tenant_id", tenant_id)
          .eq("role", "owner")
          .limit(1)
          .maybeSingle();

        const uid = ownerData?.user_id || tenant_id;
        const { error } = await supabase.from("subscriptions").insert({
          tenant_id, plan_id, user_id: uid, status: "active",
        });
        if (error) return err(error.message, 500);
      } else if (operation === "cancel" && subscription_id) {
        const { error } = await supabase.from("subscriptions").update({ status: "canceled" }).eq("id", subscription_id);
        if (error) return err(error.message, 500);
      }

      return json({ success: true });
    }

    // ─── LIST PLANS ───
    if (req.method === "GET" && action === "list_plans") {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .is("tenant_id", null)
        .order("price", { ascending: true });
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── CREATE PLAN ───
    if (req.method === "POST" && action === "create_plan") {
      const body = await req.json();
      if (!body.name) return err("name is required");

      const { data, error } = await supabase.from("plans").insert({ ...body, tenant_id: null }).select("id").single();
      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "CREATE_PLAN",
        target_table: "plans",
        target_id: data.id,
        details: { name: body.name, via: "api-admin" },
      });

      return json({ id: data.id }, 201);
    }

    // ─── UPDATE PLAN ───
    if (req.method === "PUT" && action === "update_plan") {
      const body = await req.json();
      const id = body.id;
      if (!id) return err("Missing id");
      const { id: _, ...rest } = body;

      const { error } = await supabase.from("plans").update(rest).eq("id", id);
      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "UPDATE_PLAN",
        target_table: "plans",
        target_id: id,
        details: { via: "api-admin" },
      });

      return json({ success: true });
    }

    // ─── DELETE PLAN ───
    if (req.method === "DELETE" && action === "delete_plan") {
      const id = url.searchParams.get("id");
      if (!id) return err("Missing id");

      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "DELETE_PLAN",
        target_table: "plans",
        target_id: id,
        details: { via: "api-admin" },
      });

      return json({ success: true });
    }

    // ─── LIST POTENCIAS ───
    if (req.method === "GET" && action === "list_potencias") {
      const { data, error } = await supabase.from("potencias").select("*").order("nome");
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── CREATE POTENCIA ───
    if (req.method === "POST" && action === "create_potencia") {
      const body = await req.json();
      if (!body.nome?.trim()) return err("nome is required");
      const { data, error } = await supabase.from("potencias").insert({ nome: body.nome.trim(), sigla: body.sigla?.trim() || "" }).select("id").single();
      if (error) return err(error.message, 500);
      return json({ id: data.id }, 201);
    }

    // ─── UPDATE POTENCIA ───
    if (req.method === "PUT" && action === "update_potencia") {
      const body = await req.json();
      if (!body.id) return err("Missing id");
      const { id, ...rest } = body;
      const { error } = await supabase.from("potencias").update(rest).eq("id", id);
      if (error) return err(error.message, 500);
      return json({ success: true });
    }

    // ─── DELETE POTENCIA ───
    if (req.method === "DELETE" && action === "delete_potencia") {
      const id = url.searchParams.get("id");
      if (!id) return err("Missing id");
      const { error } = await supabase.from("potencias").update({ ativo: false }).eq("id", id);
      if (error) return err(error.message, 500);
      return json({ success: true });
    }

    // ─── LIST RITOS ───
    if (req.method === "GET" && action === "list_ritos") {
      const { data, error } = await supabase.from("ritos").select("*").order("nome");
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── CREATE RITO ───
    if (req.method === "POST" && action === "create_rito") {
      const body = await req.json();
      if (!body.nome?.trim()) return err("nome is required");
      const { data, error } = await supabase.from("ritos").insert({ nome: body.nome.trim(), descricao: body.descricao?.trim() || "" }).select("id").single();
      if (error) return err(error.message, 500);
      return json({ id: data.id }, 201);
    }

    // ─── UPDATE RITO ───
    if (req.method === "PUT" && action === "update_rito") {
      const body = await req.json();
      if (!body.id) return err("Missing id");
      const { id, ...rest } = body;
      const { error } = await supabase.from("ritos").update(rest).eq("id", id);
      if (error) return err(error.message, 500);
      return json({ success: true });
    }

    // ─── DELETE RITO ───
    if (req.method === "DELETE" && action === "delete_rito") {
      const id = url.searchParams.get("id");
      if (!id) return err("Missing id");
      const { error } = await supabase.from("ritos").update({ ativo: false }).eq("id", id);
      if (error) return err(error.message, 500);
      return json({ success: true });
    }

    // ─── LIST POTENCIA_RITOS ───
    if (req.method === "GET" && action === "list_potencia_ritos") {
      const { data, error } = await supabase
        .from("potencia_ritos")
        .select("id, potencia_id, rito_id, ativo, created_at, potencias(id, nome, sigla), ritos(id, nome)")
        .order("created_at", { ascending: false });
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── CREATE POTENCIA_RITO ───
    if (req.method === "POST" && action === "create_potencia_rito") {
      const body = await req.json();
      if (!body.potencia_id || !body.rito_id) return err("potencia_id and rito_id are required");
      const { data, error } = await supabase
        .from("potencia_ritos")
        .insert({ potencia_id: body.potencia_id, rito_id: body.rito_id })
        .select("id")
        .single();
      if (error) return err(error.message, 500);
      return json({ id: data.id }, 201);
    }

    // ─── DELETE POTENCIA_RITO ───
    if (req.method === "DELETE" && action === "delete_potencia_rito") {
      const id = url.searchParams.get("id");
      if (!id) return err("Missing id");
      const { error } = await supabase.from("potencia_ritos").delete().eq("id", id);
      if (error) return err(error.message, 500);
      return json({ success: true });
    }

    // ─── LIST REGRAS ───
    if (req.method === "GET" && action === "list_regras") {
      const { data, error } = await supabase
        .from("regras")
        .select("*, potencias(id, nome, sigla)")
        .order("created_at", { ascending: false });
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── CREATE REGRA ───
    if (req.method === "POST" && action === "create_regra") {
      const body = await req.json();
      if (!body.nome?.trim()) return err("nome is required");
      if (!body.tipo) return err("tipo is required");
      if (!body.entidade) return err("entidade is required");
      const { data, error } = await supabase.from("regras").insert({
        nome: body.nome.trim(),
        descricao: body.descricao?.trim() || null,
        tipo: body.tipo,
        entidade: body.entidade,
        regra_json: body.regra_json || {},
        potencia_id: body.potencia_id || null,
      }).select("id").single();
      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "CREATE_REGRA",
        target_table: "regras",
        target_id: data.id,
        details: { nome: body.nome, via: "api-admin" },
      });

      return json({ id: data.id }, 201);
    }

    // ─── UPDATE REGRA ───
    if (req.method === "PUT" && action === "update_regra") {
      const body = await req.json();
      if (!body.id) return err("Missing id");
      const { id, ...rest } = body;
      const { error } = await supabase.from("regras").update(rest).eq("id", id);
      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "UPDATE_REGRA",
        target_table: "regras",
        target_id: id,
        details: { via: "api-admin" },
      });

      return json({ success: true });
    }

    // ─── DELETE REGRA ───
    if (req.method === "DELETE" && action === "delete_regra") {
      const id = url.searchParams.get("id");
      if (!id) return err("Missing id");
      const { error } = await supabase.from("regras").update({ ativo: false }).eq("id", id);
      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "DELETE_REGRA",
        target_table: "regras",
        target_id: id,
        details: { via: "api-admin" },
      });

      return json({ success: true });
    }

    return err("Unknown action", 404);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return err(msg, 401);
    if (msg === "Forbidden") return err(msg, 403);
    return err(msg, 500);
  }
});
