import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string" || code.length < 4) {
      return new Response(
        JSON.stringify({ error: "Código inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Look up the code
    const { data: totemCode, error: lookupError } = await supabase
      .from("totem_codes")
      .select("id, tenant_id, label, is_active, expires_at")
      .eq("code", code.trim())
      .single();

    if (lookupError || !totemCode) {
      return new Response(
        JSON.stringify({ error: "Código não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!totemCode.is_active) {
      return new Response(
        JSON.stringify({ error: "Código desativado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (totemCode.expires_at && new Date(totemCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Código expirado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tenant data
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, lodge_number, orient, potencia, logo_url")
      .eq("id", totemCode.tenant_id)
      .eq("is_active", true)
      .single();

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ error: "Loja não encontrada ou inativa" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return config for the totem
    const config = {
      code: code.trim(),
      tenantId: tenant.id,
      lodgeName: tenant.name,
      lodgeNumber: tenant.lodge_number ? `nº ${tenant.lodge_number}` : "",
      orient: tenant.orient,
      potencia: tenant.potencia,
      logoUrl: tenant.logo_url,
      supabaseUrl,
      supabaseAnonKey: anonKey,
    };

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("totem-activate error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
