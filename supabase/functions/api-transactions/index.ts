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
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { userId: user.id, supabase };
}

async function requireAdmin(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.rpc("is_admin", { _user_id: userId });
  if (!data) throw new Error("Forbidden");
}

function sanitizeTransaction(body: Record<string, unknown>) {
  const allowed: Record<string, unknown> = {};
  const fields = [
    "member_id", "tipo", "descricao", "valor", "data", "status",
    "created_by", "conta_plano_id", "forma_pagamento", "referencia_mes",
    "categoria", "data_vencimento", "aprovado_por",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) allowed[f] = body[f];
  }
  return allowed;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId, supabase } = await authenticate(req);
    await requireAdmin(supabase, userId);

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── LIST (with optional filters) ───
    if (req.method === "GET" && action === "list") {
      const memberId = url.searchParams.get("member_id");
      const status = url.searchParams.get("status");
      const limit = parseInt(url.searchParams.get("limit") || "500");
      const startDate = url.searchParams.get("start_date");
      const endDate = url.searchParams.get("end_date");

      let query = supabase.from("member_transactions").select("*");
      if (memberId) query = query.eq("member_id", memberId);
      if (status) query = query.eq("status", status);
      if (startDate) query = query.gte("data", startDate);
      if (endDate) query = query.lte("data", endDate);
      query = query.order("data", { ascending: true }).limit(limit);

      const { data, error } = await query;
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── LIST RECENT ───
    if (req.method === "GET" && action === "recent") {
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const { data, error } = await supabase
        .from("member_transactions")
        .select("id, data, tipo, descricao, valor, status, member_id")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── LIST ACTIVE MEMBERS (for comboboxes) ───
    if (req.method === "GET" && action === "active_members") {
      const fields = url.searchParams.get("fields") || "id, full_name, cim";
      const { data, error } = await supabase
        .from("members")
        .select(fields)
        .eq("status", "ativo")
        .order("full_name");
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── LIST PLANO CONTAS ───
    if (req.method === "GET" && action === "plano_contas") {
      const tipo = url.searchParams.get("tipo");
      let query = supabase.from("plano_contas")
        .select("id, codigo, nome, tipo")
        .eq("ativo", true)
        .order("codigo", { ascending: true });
      if (tipo) query = query.eq("tipo", tipo);
      const { data, error } = await query;
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── CREATE ───
    if (req.method === "POST" && action === "create") {
      const body = await req.json();
      if (!body.member_id) return err("member_id é obrigatório.");
      const payload = sanitizeTransaction(body);
      const { data, error } = await supabase
        .from("member_transactions")
        .insert(payload)
        .select("id")
        .single();
      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: body.status === "pago" ? "CREATE_CREDIT" : "CREATE_DEBIT",
        target_table: "member_transactions",
        target_id: data.id,
        details: { member_id: body.member_id, tipo: body.tipo, valor: body.valor, via: "api-transactions" },
      });

      return json({ id: data.id }, 201);
    }

    // ─── BATCH CREATE ───
    if (req.method === "POST" && action === "batch_create") {
      const body = await req.json();
      if (!Array.isArray(body.rows) || body.rows.length === 0) return err("rows array é obrigatório.");
      const rows = body.rows.map(sanitizeTransaction);
      const { data, error } = await supabase.from("member_transactions").insert(rows).select("id");
      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "CREATE_BATCH",
        target_table: "member_transactions",
        details: { count: data.length, via: "api-transactions", ...body.audit_details },
      });

      return json({ count: data.length }, 201);
    }

    // ─── UPDATE ───
    if (req.method === "PUT" && action === "update") {
      const body = await req.json();
      const id = body.id || url.searchParams.get("id");
      if (!id) return err("Missing id");
      const payload = sanitizeTransaction(body);
      delete (payload as any).member_id; // prevent changing member
      const { error } = await supabase.from("member_transactions").update(payload).eq("id", id);
      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "UPDATE_TRANSACTION",
        target_table: "member_transactions",
        target_id: id,
        details: { changes: payload, via: "api-transactions" },
      });

      return json({ success: true });
    }

    // ─── BATCH UPDATE STATUS ───
    if (req.method === "PUT" && action === "batch_update_status") {
      const body = await req.json();
      if (!Array.isArray(body.ids) || !body.status) return err("ids e status são obrigatórios.");
      const { error } = await supabase
        .from("member_transactions")
        .update({ status: body.status })
        .in("id", body.ids);
      if (error) return err(error.message, 500);
      return json({ success: true, count: body.ids.length });
    }

    // ─── CANCEL (reverse transaction) ───
    if (req.method === "POST" && action === "cancel") {
      const body = await req.json();
      if (!body.transaction_id || !body.motivo) return err("transaction_id e motivo são obrigatórios.");

      // Get original transaction
      const { data: original, error: fetchErr } = await supabase
        .from("member_transactions")
        .select("*")
        .eq("id", body.transaction_id)
        .single();
      if (fetchErr || !original) return err("Transação não encontrada.", 404);

      const isDebito = original.status === "em_aberto";

      // Create reverse transaction
      const { error: insertErr } = await supabase.from("member_transactions").insert({
        member_id: original.member_id,
        tipo: original.tipo,
        descricao: `[CANCELAMENTO] ${original.descricao} — Motivo: ${body.motivo}`,
        valor: original.valor,
        status: isDebito ? "pago" : "em_aberto",
        data: new Date().toISOString().slice(0, 10),
        conta_plano_id: original.conta_plano_id,
        created_by: userId,
      });
      if (insertErr) return err(insertErr.message, 500);

      // Mark original as cancelled
      const { error: updateErr } = await supabase
        .from("member_transactions")
        .update({ descricao: `[CANCELADO] ${original.descricao}` })
        .eq("id", body.transaction_id);
      if (updateErr) return err(updateErr.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "cancelamento_lancamento",
        target_table: "member_transactions",
        target_id: body.transaction_id,
        details: { motivo: body.motivo, valor: original.valor, tipo: original.tipo, via: "api-transactions" },
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
