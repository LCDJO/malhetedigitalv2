import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const {
      // Lodge info
      lodge_name,
      lodge_number,
      potencia,
      orient,
      cep,
      rua,
      numero_endereco,
      complemento,
      bairro,
      cidade,
      estado,
      telefone,
      // Admin user info
      full_name,
      email,
      password,
    } = body;

    // Validate required fields
    if (!lodge_name?.trim() || !lodge_number?.trim() || !potencia?.trim() || !orient?.trim()) {
      return new Response(JSON.stringify({ error: "Informações da Loja são obrigatórias." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!full_name?.trim() || !email?.trim() || !password) {
      return new Response(JSON.stringify({ error: "Informações do administrador são obrigatórias." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "A senha deve ter no mínimo 6 caracteres." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: false,
      user_metadata: { full_name: full_name.trim() },
    });

    if (authError) {
      const msg = authError.message.includes("already been registered")
        ? "Este email já está cadastrado."
        : authError.message;
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // Build address string
    const addressParts = [rua, numero_endereco, complemento, bairro, cidade, estado, cep].filter(Boolean);
    const endereco = addressParts.join(", ");

    // Build slug from lodge name
    const slug = lodge_name.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // 2. Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: lodge_name.trim(),
        slug,
        lodge_number: lodge_number.trim(),
        potencia: potencia.trim(),
        orient: orient.trim(),
        endereco,
        telefone: telefone?.trim() || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (tenantError) {
      // Rollback: delete the user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Erro ao criar a Loja: " + tenantError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenantId = tenant.id;

    // 3. Create lodge_config
    const { error: configError } = await supabaseAdmin
      .from("lodge_config")
      .insert({
        tenant_id: tenantId,
        lodge_name: lodge_name.trim(),
        lodge_number: lodge_number.trim(),
        orient: orient.trim(),
        potencia: potencia.trim(),
        endereco,
        telefone: telefone?.trim() || null,
      });

    if (configError) {
      console.error("lodge_config error:", configError);
    }

    // 4. Link user to tenant as owner
    const { error: tuError } = await supabaseAdmin
      .from("tenant_users")
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        role: "owner",
        is_active: true,
      });

    if (tuError) {
      console.error("tenant_users error:", tuError);
    }

    // 5. Assign administrador role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "administrador",
        assigned_by: userId,
      });

    if (roleError) {
      console.error("user_roles error:", roleError);
    }

    // 6. Send confirmation email (resend since we created with email_confirm: false)
    const { error: resendError } = await supabaseAdmin.auth.resend({
      type: "signup",
      email: email.trim(),
    });

    if (resendError) {
      console.error("resend email error:", resendError);
    }

    return new Response(
      JSON.stringify({ success: true, tenant_id: tenantId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("register-lodge error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
