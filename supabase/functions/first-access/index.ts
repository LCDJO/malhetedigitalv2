import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Normalize CPF to formatted version
    const cleanCpf = cpf.replace(/\D/g, "");
    const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Look up member by CPF + CIM
    const { data: member, error: memberError } = await adminClient
      .from("members")
      .select("id, email, full_name, force_password_change, cim")
      .eq("cpf", formattedCpf)
      .eq("status", "ativo")
      .maybeSingle();

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: "Membro não encontrado com este CPF." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate CIM
    if (!member.cim || member.cim.trim().toLowerCase() !== cim.trim().toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "CIM não confere com o cadastro." }),
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
