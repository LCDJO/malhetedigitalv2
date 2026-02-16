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

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── GET LODGE CONFIG ───
    if (req.method === "GET" && action === "get") {
      const { data, error } = await supabase
        .from("lodge_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── UPDATE LODGE CONFIG ───
    if (req.method === "PUT" && action === "update") {
      const body = await req.json();
      const id = body.id;
      if (!id) return err("Missing id");

      // Remove id from update payload
      const { id: _, ...rest } = body;
      const { error } = await supabase.from("lodge_config").update(rest).eq("id", id);
      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "UPDATE_LODGE_CONFIG",
        target_table: "lodge_config",
        target_id: id,
        details: { via: "api-config" },
      });

      return json({ success: true });
    }

    // ─── LIST PLANO CONTAS ───
    if (req.method === "GET" && action === "plano_contas") {
      const { data, error } = await supabase
        .from("plano_contas")
        .select("*")
        .order("codigo", { ascending: true });
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── CREATE PLANO CONTA ───
    if (req.method === "POST" && action === "create_conta") {
      const body = await req.json();
      if (!body.codigo || !body.nome || !body.tipo) return err("codigo, nome e tipo são obrigatórios.");
      const { data, error } = await supabase.from("plano_contas").insert({
        codigo: body.codigo,
        nome: body.nome,
        tipo: body.tipo,
        conta_pai_id: body.conta_pai_id || null,
        ativo: body.ativo !== false,
      }).select("id").single();
      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "CREATE_PLANO_CONTA",
        target_table: "plano_contas",
        target_id: data.id,
        details: { codigo: body.codigo, nome: body.nome, via: "api-config" },
      });

      return json({ id: data.id }, 201);
    }

    // ─── UPDATE PLANO CONTA ───
    if (req.method === "PUT" && action === "update_conta") {
      const body = await req.json();
      const id = body.id || url.searchParams.get("id");
      if (!id) return err("Missing id");
      const { error } = await supabase.from("plano_contas").update({
        codigo: body.codigo,
        nome: body.nome,
        tipo: body.tipo,
        ativo: body.ativo,
        conta_pai_id: body.conta_pai_id || null,
      }).eq("id", id);
      if (error) return err(error.message, 500);
      return json({ success: true });
    }

    // ─── DELETE PLANO CONTA ───
    if (req.method === "DELETE" && action === "delete_conta") {
      const id = url.searchParams.get("id");
      if (!id) return err("Missing id");
      const { error } = await supabase.from("plano_contas").delete().eq("id", id);
      if (error) return err(error.message, 500);
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
