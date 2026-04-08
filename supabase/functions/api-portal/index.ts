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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId, supabase } = await authenticate(req);
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── PORTAL STATS (dashboard) ───
    if (req.method === "GET" && action === "stats") {
      // Get member linked to this user (by email)
      const { data: userData } = await supabase.auth.getUser();
      const email = userData?.user?.email;
      if (!email) return err("No email found", 400);

      const { data: member } = await supabase
        .from("members")
        .select("id")
        .eq("email", email)
        .eq("status", "ativo")
        .maybeSingle();

      if (!member) return err("Member not found", 404);

      const [activeRes, pendingRes] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("member_transactions")
          .select("id", { count: "exact", head: true })
          .eq("member_id", member.id)
          .eq("status", "em aberto"),
      ]);

      return json({
        active_count: activeRes.count ?? 0,
        pending_count: pendingRes.count ?? 0,
        member_id: member.id,
      });
    }

    // ─── PORTAL MEMBER TRANSACTIONS ───
    if (req.method === "GET" && action === "my_transactions") {
      const memberId = url.searchParams.get("member_id");
      if (!memberId) return err("Missing member_id");

      const limit = parseInt(url.searchParams.get("limit") ?? "200");
      const { data, error } = await supabase
        .from("member_transactions")
        .select("id, data, tipo, descricao, valor, status")
        .eq("member_id", memberId)
        .order("data", { ascending: false })
        .limit(limit);

      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── PORTAL LODGE INFO ───
    if (req.method === "GET" && action === "lodge_info") {
      const [configRes, countRes] = await Promise.all([
        supabase.from("lodge_config")
          .select("lodge_name, lodge_number, orient, potencia, logotipo_url, endereco, telefone, email_institucional")
          .limit(1)
          .maybeSingle(),
        supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      ]);

      return json({
        lodge: configRes.data,
        active_count: countRes.count ?? 0,
      });
    }

    // ─── PORTAL ANNUAL SUMMARY ───
    if (req.method === "GET" && action === "annual_summary") {
      const year = url.searchParams.get("year") ?? new Date().getFullYear().toString();
      const { data, error } = await supabase
        .from("member_transactions")
        .select("data, tipo, valor, status")
        .gte("data", `${year}-01-01`)
        .lte("data", `${year}-12-31`)
        .order("data", { ascending: true })
        .limit(1000);

      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── NOTIFICATIONS ───
    if (req.method === "GET" && action === "notifications") {
      const memberId = url.searchParams.get("member_id");
      if (!memberId) return err("Missing member_id");

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── MARK NOTIFICATION READ ───
    if (req.method === "PUT" && action === "mark_read") {
      const body = await req.json();
      const ids: string[] = body.ids;
      if (!ids || ids.length === 0) return err("Missing ids");

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", ids);

      if (error) return err(error.message, 500);
      return json({ success: true });
    }

    return err("Unknown action", 404);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return err(msg, 401);
    return err(msg, 500);
  }
});
