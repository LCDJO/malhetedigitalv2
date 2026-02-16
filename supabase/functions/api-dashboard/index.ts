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
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) throw new Error("Unauthorized");
  return { userId: data.claims.sub as string, supabase };
}

async function requireAdmin(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.rpc("is_admin", { _user_id: userId });
  if (!data) throw new Error("Forbidden");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId, supabase } = await authenticate(req);
    await requireAdmin(supabase, userId);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── DASHBOARD STATS ───
    if (req.method === "GET" && action === "stats") {
      const [activeRes, inactiveRes, allRes, inadRes] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("members").select("id", { count: "exact", head: true }).neq("status", "ativo"),
        supabase.from("members").select("id, degree, master_installed").eq("status", "ativo"),
        supabase.from("member_transactions").select("member_id").eq("status", "em_aberto"),
      ]);
      return json({
        active_count: activeRes.count ?? 0,
        inactive_count: inactiveRes.count ?? 0,
        members: allRes.data ?? [],
        overdue_member_ids: [...new Set((inadRes.data ?? []).map((t: any) => t.member_id))],
      });
    }

    // ─── TRANSACTIONS FOR REPORTS ───
    if (req.method === "GET" && action === "transactions") {
      const startDate = url.searchParams.get("start_date");
      const endDate = url.searchParams.get("end_date");
      const statuses = url.searchParams.get("statuses")?.split(",") || ["pago", "em_aberto"];

      let query = supabase
        .from("member_transactions")
        .select("id, tipo, valor, descricao, data, status, member_id, categoria, created_at, conta_plano_id, forma_pagamento, created_by");
      if (startDate) query = query.gte("data", startDate);
      if (endDate) query = query.lte("data", endDate);
      query = query.in("status", statuses).order("data", { ascending: true });

      const { data, error } = await query;
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── MEMBERS LIST (for reports/dashboard) ───
    if (req.method === "GET" && action === "members") {
      const fields = url.searchParams.get("fields") || "id, full_name, cim, status, degree";
      const statusFilter = url.searchParams.get("status");
      let query = supabase.from("members").select(fields).order("full_name");
      if (statusFilter) query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── FINANCIAL SUMMARY (FinanceiroGeral) ───
    if (req.method === "GET" && action === "financial_summary") {
      const startDate = url.searchParams.get("start_date");
      const endDate = url.searchParams.get("end_date");

      let query = supabase
        .from("member_transactions")
        .select("id, tipo, valor, descricao, data, status, member_id, categoria, conta_plano_id, forma_pagamento, created_by, created_at, data_vencimento, referencia_mes, aprovado_por");
      if (startDate) query = query.gte("data", startDate);
      if (endDate) query = query.lte("data", endDate);
      query = query.order("data", { ascending: false });

      const { data, error } = await query;
      if (error) return err(error.message, 500);
      return json(data);
    }

    return err("Unknown action", 404);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return err(msg, 401);
    if (msg === "Forbidden") return err(msg, 403);
    return err(msg, 500);
  }
});
