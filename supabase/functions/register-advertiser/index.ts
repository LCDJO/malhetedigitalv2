import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sanitizeError(msg: string): string {
  if (msg.includes("unique") || msg.includes("duplicate key")) return "Este documento já está cadastrado.";
  if (msg.includes("foreign key")) return "Referência inválida.";
  if (msg.includes("row-level security")) return "Acesso negado.";
  return "Erro ao processar solicitação. Tente novamente.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ── Auth check: require authenticated user ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { company_name, trading_name, document_type, document_number, email, phone, website, representative_name, representative_cpf, representative_phone, representative_email, representative_address } = await req.json();

    if (!company_name || !document_number || !email) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios faltando." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabaseAdmin.from("advertisers").insert({
      user_id: user.id, // Use authenticated user, not client-provided
      company_name,
      trading_name: trading_name || null,
      document_type: document_type || "cnpj",
      document_number,
      email,
      phone: phone || null,
      website: website || null,
      representative_name: representative_name || null,
      representative_cpf: representative_cpf || null,
      representative_phone: representative_phone || null,
      representative_email: representative_email || null,
      representative_address: representative_address || null,
      status: "pendente",
    }).select().single();

    if (error) {
      console.error("register-advertiser error:", error.message);
      return new Response(JSON.stringify({ error: sanitizeError(error.message) }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, advertiser: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("register-advertiser unexpected:", err.message);
    return new Response(JSON.stringify({ error: "Erro interno do servidor." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
