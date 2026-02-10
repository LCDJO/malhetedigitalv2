import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // GET: Check if bootstrap is needed (no users exist)
  if (req.method === "GET") {
    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ needs_bootstrap: (count ?? 0) === 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // POST: Create the first admin user + lodge config (only if no roles exist)
  if (req.method === "POST") {
    // Double-check no roles exist
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true });

    if ((count ?? 0) > 0) {
      return new Response(
        JSON.stringify({ error: "O sistema já foi inicializado." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, full_name, lodge_name, lodge_number, orient } = await req.json();

    // Validate required fields
    if (!email || !password || !full_name || !lodge_name || !lodge_number || !orient) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate field lengths
    if (full_name.length > 100 || email.length > 255 || lodge_name.length > 150 || lodge_number.length > 20 || orient.length > 100) {
      return new Response(
        JSON.stringify({ error: "Um ou mais campos excedem o tamanho máximo permitido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter no mínimo 6 caracteres." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Formato de email inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user with auto-confirm
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim() },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "administrador" });

    if (roleError) {
      return new Response(
        JSON.stringify({ error: roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create lodge config
    const { error: lodgeError } = await supabaseAdmin
      .from("lodge_config")
      .insert({
        lodge_name: lodge_name.trim(),
        lodge_number: lodge_number.trim(),
        orient: orient.trim(),
      });

    if (lodgeError) {
      return new Response(
        JSON.stringify({ error: lodgeError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the bootstrap action
    await supabaseAdmin.from("audit_log").insert({
      user_id: userId,
      user_name: full_name.trim(),
      action: "BOOTSTRAP_SYSTEM",
      target_table: "user_roles",
      target_id: userId,
      details: {
        email: email.trim().toLowerCase(),
        role: "administrador",
        lodge_name: lodge_name.trim(),
        lodge_number: lodge_number.trim(),
        orient: orient.trim(),
      },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Sistema inicializado com sucesso." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
