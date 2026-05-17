import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TITAN_API = "https://api.titan.email/v1";

interface Payload {
  action: "get_config" | "save_config" | "test_connection" | "list_mailboxes" | "create_mailbox" | "delete_mailbox" | "send_email";
  tenant_id: string;
  config?: Record<string, unknown>;
  mailbox?: { email: string; password: string; first_name?: string; last_name?: string };
  email?: { to: string; subject: string; html?: string; text?: string };
}

async function titanFetch(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`${TITAN_API}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* keep text */ }
  return { ok: res.ok, status: res.status, body };
}

async function sendViaSmtp(cfg: {
  smtp_host: string; smtp_port: number; smtp_user: string; smtp_password: string;
  from_name: string; from_email: string;
  to: string; subject: string; html?: string; text?: string;
}) {
  const payload = {
    from: { name: cfg.from_name || cfg.from_email, email: cfg.from_email || cfg.smtp_user },
    to: [{ email: cfg.to }],
    subject: cfg.subject,
    html: cfg.html ?? cfg.text ?? "",
    text: cfg.text ?? "",
  };
  return payload;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const payload = (await req.json()) as Payload;
    if (!payload?.action || !payload?.tenant_id) {
      return new Response(JSON.stringify({ error: "missing action/tenant_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: isSuper } = await admin.rpc("is_superadmin", { _user_id: userId });
    const { data: isAdm } = await admin.rpc("is_tenant_admin", { _user_id: userId, _tenant_id: payload.tenant_id });
    if (!isSuper && !isAdm) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!isSuper) {
      const { data: enabled } = await admin.rpc("has_module_enabled", { _tenant_id: payload.tenant_id, _module: "email_servers" });
      if (!enabled) {
        return new Response(JSON.stringify({ error: "module_disabled" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (payload.action === "get_config") {
      const { data } = await admin
        .from("tenant_email_integrations")
        .select("id, provider, domain, smtp_host, smtp_port, smtp_user, from_name, from_email, enabled, updated_at")
        .eq("tenant_id", payload.tenant_id)
        .eq("provider", "titan")
        .maybeSingle();
      return new Response(JSON.stringify({ config: data ?? null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (payload.action === "save_config") {
      const c = payload.config ?? {};
      const row = {
        tenant_id: payload.tenant_id,
        provider: "titan",
        domain: String(c.domain ?? ""),
        api_token: String(c.api_token ?? ""),
        smtp_host: String(c.smtp_host ?? "smtp.titan.email"),
        smtp_port: Number(c.smtp_port ?? 587),
        smtp_user: String(c.smtp_user ?? ""),
        smtp_password: String(c.smtp_password ?? ""),
        from_name: String(c.from_name ?? ""),
        from_email: String(c.from_email ?? ""),
        enabled: Boolean(c.enabled ?? false),
      };
      const { data: existing } = await admin
        .from("tenant_email_integrations")
        .select("api_token, smtp_password")
        .eq("tenant_id", payload.tenant_id).eq("provider", "titan").maybeSingle();
      if (!row.api_token && existing?.api_token) row.api_token = existing.api_token;
      if (!row.smtp_password && existing?.smtp_password) row.smtp_password = existing.smtp_password;

      const { error } = await admin
        .from("tenant_email_integrations")
        .upsert(row, { onConflict: "tenant_id,provider" });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: cfg } = await admin
      .from("tenant_email_integrations")
      .select("*")
      .eq("tenant_id", payload.tenant_id).eq("provider", "titan").maybeSingle();

    if (!cfg) {
      return new Response(JSON.stringify({ error: "not_configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (payload.action === "test_connection") {
      if (!cfg.api_token) return new Response(JSON.stringify({ error: "missing_token" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const r = await titanFetch(`/domains/${encodeURIComponent(cfg.domain)}`, cfg.api_token);
      return new Response(JSON.stringify({ ok: r.ok, status: r.status, body: r.body }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (payload.action === "list_mailboxes") {
      const r = await titanFetch(`/domains/${encodeURIComponent(cfg.domain)}/accounts`, cfg.api_token);
      return new Response(JSON.stringify(r), { status: r.ok ? 200 : r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (payload.action === "create_mailbox" && payload.mailbox) {
      const r = await titanFetch(`/domains/${encodeURIComponent(cfg.domain)}/accounts`, cfg.api_token, {
        method: "POST",
        body: JSON.stringify({
          email: payload.mailbox.email,
          password: payload.mailbox.password,
          first_name: payload.mailbox.first_name ?? "",
          last_name: payload.mailbox.last_name ?? "",
        }),
      });
      return new Response(JSON.stringify(r), { status: r.ok ? 200 : r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (payload.action === "delete_mailbox" && payload.mailbox?.email) {
      const r = await titanFetch(`/domains/${encodeURIComponent(cfg.domain)}/accounts/${encodeURIComponent(payload.mailbox.email)}`, cfg.api_token, { method: "DELETE" });
      return new Response(JSON.stringify(r), { status: r.ok ? 200 : r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (payload.action === "send_email" && payload.email) {
      const built = await sendViaSmtp({
        smtp_host: cfg.smtp_host, smtp_port: cfg.smtp_port,
        smtp_user: cfg.smtp_user, smtp_password: cfg.smtp_password,
        from_name: cfg.from_name, from_email: cfg.from_email,
        to: payload.email.to, subject: payload.email.subject,
        html: payload.email.html, text: payload.email.text,
      });
      const r = await titanFetch(`/transactional/send`, cfg.api_token, {
        method: "POST",
        body: JSON.stringify(built),
      });
      return new Response(JSON.stringify(r), { status: r.ok ? 200 : r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "unknown_action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("titan-email error:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
