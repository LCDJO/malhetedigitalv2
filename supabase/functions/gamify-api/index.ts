import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-tenant-id",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return { user: data.user, supabase };
}

function getTenantId(req: Request): string | null {
  return req.headers.get("x-tenant-id");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.replace(/^\/gamify-api\/?/, "").split("/").filter(Boolean);
  const resource = pathParts[0];
  const resourceId = pathParts[1];
  const method = req.method;

  const auth = await authenticate(req);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);

  const { user, supabase } = auth;
  const tenantId = getTenantId(req);

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Middleware: validate tenant access for tenant-scoped resources
  if (resource !== "tenants" || method !== "POST") {
    if (!tenantId) return jsonResponse({ error: "x-tenant-id header required" }, 400);

    const { data: isMember } = await adminClient.rpc("is_tenant_member", {
      _user_id: user.id,
      _tenant_id: tenantId,
    });
    if (!isMember) return jsonResponse({ error: "Forbidden: not a member of this tenant" }, 403);
  }

  try {
    switch (resource) {
      // ── TENANTS ──
      case "tenants": {
        if (method === "GET" && !resourceId) {
          const { data } = await supabase.from("tenants").select("*");
          return jsonResponse({ data });
        }
        if (method === "GET" && resourceId) {
          const { data } = await supabase.from("tenants").select("*").eq("id", resourceId).single();
          return jsonResponse({ data });
        }
        if (method === "POST") {
          const body = await req.json();
          const { data, error } = await supabase.from("tenants").insert(body).select().single();
          if (error) return jsonResponse({ error: error.message }, 400);
          // Auto-add creator as owner
          await adminClient.from("tenant_users").insert({
            tenant_id: data.id,
            user_id: user.id,
            role: "owner",
          });
          return jsonResponse({ data }, 201);
        }
        if (method === "PATCH" && resourceId) {
          const body = await req.json();
          const { data, error } = await supabase.from("tenants").update(body).eq("id", resourceId).select().single();
          if (error) return jsonResponse({ error: error.message }, 400);
          return jsonResponse({ data });
        }
        break;
      }

      // ── PLANS ──
      case "plans": {
        if (method === "GET") {
          const { data } = await supabase.from("plans").select("*").eq("tenant_id", tenantId);
          return jsonResponse({ data });
        }
        if (method === "POST") {
          const body = await req.json();
          const { data, error } = await supabase.from("plans").insert({ ...body, tenant_id: tenantId }).select().single();
          if (error) return jsonResponse({ error: error.message }, 400);
          return jsonResponse({ data }, 201);
        }
        if (method === "PATCH" && resourceId) {
          const body = await req.json();
          const { data, error } = await supabase.from("plans").update(body).eq("id", resourceId).eq("tenant_id", tenantId).select().single();
          if (error) return jsonResponse({ error: error.message }, 400);
          return jsonResponse({ data });
        }
        if (method === "DELETE" && resourceId) {
          await supabase.from("plans").delete().eq("id", resourceId).eq("tenant_id", tenantId);
          return jsonResponse({ success: true });
        }
        break;
      }

      // ── SUBSCRIPTIONS ──
      case "subscriptions": {
        if (method === "GET") {
          const { data } = await supabase.from("subscriptions").select("*, plans(name, price)").eq("tenant_id", tenantId);
          return jsonResponse({ data });
        }
        if (method === "POST") {
          const body = await req.json();
          const { data, error } = await supabase.from("subscriptions").insert({ ...body, tenant_id: tenantId }).select().single();
          if (error) return jsonResponse({ error: error.message }, 400);
          return jsonResponse({ data }, 201);
        }
        if (method === "PATCH" && resourceId) {
          const body = await req.json();
          const { data, error } = await supabase.from("subscriptions").update(body).eq("id", resourceId).eq("tenant_id", tenantId).select().single();
          if (error) return jsonResponse({ error: error.message }, 400);
          return jsonResponse({ data });
        }
        break;
      }

      // ── WALLETS ──
      case "wallets": {
        if (method === "GET") {
          const userId = url.searchParams.get("user_id");
          let query = supabase.from("wallets").select("*").eq("tenant_id", tenantId);
          if (userId) query = query.eq("user_id", userId);
          const { data } = await query;
          return jsonResponse({ data });
        }
        if (method === "POST") {
          const body = await req.json();
          const { data, error } = await supabase.from("wallets").insert({ ...body, tenant_id: tenantId }).select().single();
          if (error) return jsonResponse({ error: error.message }, 400);
          return jsonResponse({ data }, 201);
        }
        break;
      }

      // ── WALLET TRANSACTIONS ──
      case "wallet-transactions": {
        if (method === "GET") {
          const walletId = url.searchParams.get("wallet_id");
          let query = supabase.from("wallet_transactions").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
          if (walletId) query = query.eq("wallet_id", walletId);
          const { data } = await query;
          return jsonResponse({ data });
        }
        if (method === "POST") {
          const body = await req.json();
          const { data, error } = await supabase.from("wallet_transactions").insert({ ...body, tenant_id: tenantId }).select().single();
          if (error) return jsonResponse({ error: error.message }, 400);
          // Update wallet balance
          if (body.wallet_id && body.amount) {
            const delta = body.type === "credit" ? body.amount : -body.amount;
            await adminClient.rpc("update_wallet_balance", { _wallet_id: body.wallet_id, _delta: delta }).catch(() => {});
          }
          return jsonResponse({ data }, 201);
        }
        break;
      }

      // ── AFFILIATES ──
      case "affiliates": {
        if (method === "GET") {
          const { data } = await supabase.from("affiliate_relationships").select("*").eq("tenant_id", tenantId);
          return jsonResponse({ data });
        }
        if (method === "POST") {
          const body = await req.json();
          const { data, error } = await supabase.from("affiliate_relationships").insert({ ...body, tenant_id: tenantId }).select().single();
          if (error) return jsonResponse({ error: error.message }, 400);
          return jsonResponse({ data }, 201);
        }
        break;
      }

      // ── XP LOGS ──
      case "xp-logs": {
        if (method === "GET") {
          const userId = url.searchParams.get("user_id");
          let query = supabase.from("xp_logs").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
          if (userId) query = query.eq("user_id", userId);
          const { data } = await query;
          return jsonResponse({ data });
        }
        if (method === "POST") {
          const body = await req.json();
          const { data, error } = await supabase.from("xp_logs").insert({ ...body, tenant_id: tenantId }).select().single();
          if (error) return jsonResponse({ error: error.message }, 400);
          return jsonResponse({ data }, 201);
        }
        break;
      }

      // ── RANKINGS ──
      case "rankings": {
        if (method === "GET") {
          const period = url.searchParams.get("period");
          let query = supabase.from("ranking_snapshots").select("*").eq("tenant_id", tenantId).order("rank", { ascending: true });
          if (period) query = query.eq("period", period);
          const { data } = await query;
          return jsonResponse({ data });
        }
        break;
      }

      // ── TENANT USERS ──
      case "members": {
        if (method === "GET") {
          const { data } = await supabase.from("tenant_users").select("*, profiles(full_name, avatar_url)").eq("tenant_id", tenantId);
          return jsonResponse({ data });
        }
        if (method === "POST") {
          const body = await req.json();
          const { data, error } = await supabase.from("tenant_users").insert({ ...body, tenant_id: tenantId }).select().single();
          if (error) return jsonResponse({ error: error.message }, 400);
          return jsonResponse({ data }, 201);
        }
        if (method === "PATCH" && resourceId) {
          const body = await req.json();
          const { data, error } = await supabase.from("tenant_users").update(body).eq("id", resourceId).eq("tenant_id", tenantId).select().single();
          if (error) return jsonResponse({ error: error.message }, 400);
          return jsonResponse({ data });
        }
        if (method === "DELETE" && resourceId) {
          await supabase.from("tenant_users").delete().eq("id", resourceId).eq("tenant_id", tenantId);
          return jsonResponse({ success: true });
        }
        break;
      }

      default:
        return jsonResponse({ error: `Unknown resource: ${resource}` }, 404);
    }
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
});
