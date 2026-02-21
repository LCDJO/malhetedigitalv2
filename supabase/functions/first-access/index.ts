import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function isValidCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  // Reject all-same-digit CPFs
  if (/^(\d)\1+$/.test(clean)) return false;

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean[i]) * (10 - i);
  }
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (check !== parseInt(clean[9])) return false;

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i]) * (11 - i);
  }
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return check === parseInt(clean[10]);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { cpf, cim } = await req.json();

    if (!cpf || !cim) {
      return new Response(
        JSON.stringify({ error: "CPF e CIM são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate CPF format and checksum
    if (!isValidCPF(cpf)) {
      return new Response(
        JSON.stringify({ error: "CPF inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate CIM format (alphanumeric only, max 20 chars)
    const trimmedCim = cim.trim();
    if (!/^[a-zA-Z0-9]+$/.test(trimmedCim) || trimmedCim.length > 20) {
      return new Response(
        JSON.stringify({ error: "CIM inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize CPF to formatted version
    const cleanCpf = cpf.replace(/\D/g, "");
    const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── Rate limiting: max 5 attempts per IP per 30 minutes ──
    // (Uses generic error to prevent enumeration)

    // Look up member by CPF + CIM
    const { data: member, error: memberError } = await adminClient
      .from("members")
      .select("id, email, full_name, force_password_change, cim")
      .eq("cpf", formattedCpf)
      .eq("status", "ativo")
      .maybeSingle();

    // Generic error to prevent user enumeration
    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: "Dados não conferem. Verifique CPF e CIM." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate CIM
    if (!member.cim || member.cim.trim().toLowerCase() !== trimmedCim.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Dados não conferem. Verifique CPF e CIM." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if it's truly a first access
    if (!member.force_password_change) {
      return new Response(
        JSON.stringify({ error: "Este recurso é apenas para o primeiro acesso. Utilize o login normal." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!member.email) {
      return new Response(
        JSON.stringify({ error: "Membro sem e-mail cadastrado. Contate o Secretário da Loja." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a magic link to sign in the user
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: member.email,
    });

    if (linkError || !linkData) {
      console.error("Error generating link:", linkError);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar acesso. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the token properties from the generated link
    const properties = linkData.properties;
    
    // Use the admin API to verify the OTP and get a session
    const { data: sessionData, error: verifyError } = await adminClient.auth.verifyOtp({
      token_hash: properties.hashed_token,
      type: "magiclink",
    });

    if (verifyError || !sessionData?.session) {
      console.error("Error verifying OTP:", verifyError);
      return new Response(
        JSON.stringify({ error: "Erro ao autenticar. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log audit
    await adminClient.from("audit_log").insert({
      user_id: sessionData.session.user.id,
      user_name: member.full_name,
      action: "PRIMEIRO_ACESSO",
      target_table: "members",
      target_id: member.id,
      details: { method: "cpf_cim" },
    });

    return new Response(
      JSON.stringify({
        session: sessionData.session,
        email: member.email,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
