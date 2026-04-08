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

/** Authenticate request and return { userId, supabase (user-scoped client) } */
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

/** Check if user has admin/superadmin role */
async function requireAdmin(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.rpc("is_admin", { _user_id: userId });
  if (!data) throw new Error("Forbidden");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, supabase } = await authenticate(req);

    // Service-role client for operations that need elevated privileges
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── LIST ───
    if (req.method === "GET" && action === "list") {
      await requireAdmin(supabase, userId);
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("full_name");
      if (error) return err(error.message, 500);
      return json(data);
    }

    // ─── GET ONE ───
    if (req.method === "GET" && action === "get") {
      await requireAdmin(supabase, userId);
      const id = url.searchParams.get("id");
      if (!id) return err("Missing id");
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) return err(error.message, 500);
      if (!data) return err("Not found", 404);
      return json(data);
    }

    // ─── CREATE ───
    if (req.method === "POST" && action === "create") {
      await requireAdmin(supabase, userId);
      const body = await req.json();

      // Validate required fields
      if (!body.full_name?.trim()) return err("full_name é obrigatório.");

      const payload = sanitizeMemberPayload(body);

      const { data, error } = await supabase
        .from("members")
        .insert(payload)
        .select("id")
        .single();
      if (error) {
        if (error.message.includes("unique")) return err("CPF ou CIM já cadastrado.", 409);
        return err(error.message, 500);
      }

      // Audit log
      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "CREATE_MEMBER",
        target_table: "members",
        target_id: data.id,
        details: { full_name: payload.full_name, via: "api-members" },
      });

      return json({ id: data.id }, 201);
    }

    // ─── BULK CREATE (CSV import) ───
    if (req.method === "POST" && action === "bulk_create") {
      await requireAdmin(supabase, userId);
      const body = await req.json();
      if (!Array.isArray(body.members) || body.members.length === 0) {
        return err("members array é obrigatório.");
      }

      const payloads = body.members.map(sanitizeMemberPayload);
      const { data, error } = await supabase
        .from("members")
        .insert(payloads)
        .select("id");
      if (error) {
        if (error.message.includes("unique")) return err("CPFs ou CIMs duplicados encontrados.", 409);
        return err(error.message, 500);
      }

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "IMPORT_MEMBERS_CSV",
        target_table: "members",
        details: { count: data.length, via: "api-members" },
      });

      return json({ imported: data.length, ids: data.map((d: { id: string }) => d.id) }, 201);
    }

    // ─── UPDATE ───
    if (req.method === "PUT" && action === "update") {
      await requireAdmin(supabase, userId);
      const body = await req.json();
      const id = body.id || url.searchParams.get("id");
      if (!id) return err("Missing id");
      if (!body.full_name?.trim()) return err("full_name é obrigatório.");

      const payload = sanitizeMemberPayload(body);
      const { error } = await supabase
        .from("members")
        .update(payload)
        .eq("id", id);
      if (error) {
        if (error.message.includes("unique")) return err("CPF ou CIM já cadastrado para outro irmão.", 409);
        return err(error.message, 500);
      }

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "UPDATE_MEMBER",
        target_table: "members",
        target_id: id,
        details: { full_name: payload.full_name, via: "api-members" },
      });

      return json({ success: true });
    }

    // ─── DELETE ───
    if (req.method === "DELETE" && action === "delete") {
      await requireAdmin(supabase, userId);
      const id = url.searchParams.get("id");
      if (!id) return err("Missing id");

      // Get member info before deletion for audit
      const { data: member } = await supabase
        .from("members")
        .select("full_name")
        .eq("id", id)
        .maybeSingle();

      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", id);
      if (error) return err(error.message, 500);

      await serviceClient.from("audit_log").insert({
        user_id: userId,
        action: "DELETE_MEMBER",
        target_table: "members",
        target_id: id,
        details: { full_name: member?.full_name, via: "api-members" },
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

/** Sanitize and extract only allowed fields from a member payload */
function sanitizeMemberPayload(body: Record<string, unknown>) {
  return {
    full_name: String(body.full_name || "").trim(),
    cpf: body.cpf ? String(body.cpf).trim() : null,
    cim: body.cim ? String(body.cim).trim() : null,
    email: body.email ? String(body.email).trim() : null,
    phone: body.phone ? String(body.phone).trim() : null,
    birth_date: body.birth_date ? String(body.birth_date) : null,
    address: body.address ? String(body.address).trim() : null,
    degree: String(body.degree || "aprendiz"),
    master_installed: Boolean(body.master_installed),
    status: String(body.status || "ativo"),
    initiation_date: body.initiation_date ? String(body.initiation_date) : null,
    elevation_date: body.elevation_date ? String(body.elevation_date) : null,
    exaltation_date: body.exaltation_date ? String(body.exaltation_date) : null,
    notes: body.notes ? String(body.notes).trim() : null,
    avatar_url: body.avatar_url ? String(body.avatar_url) : null,
  };
}
