import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { email, password, full_name } = await req.json();

  if (!email || !password || !full_name) {
    return new Response(
      JSON.stringify({ error: "email, password e full_name são obrigatórios." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if user already exists by listing users with this email
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
  );

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    // Update password
    await supabaseAdmin.auth.admin.updateUserById(userId, { password, email_confirm: true });
  } else {
    // Create new user
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
    userId = authData.user.id;
  }

  // Check if already has superadmin role
  const { data: existingRole } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "superadmin")
    .maybeSingle();

  if (!existingRole) {
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "superadmin" });

    if (roleError) {
      return new Response(
        JSON.stringify({ error: roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Ensure profile exists
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    await supabaseAdmin.from("profiles").insert({
      id: userId,
      full_name: full_name.trim(),
    });
  }

  // Log
  await supabaseAdmin.from("audit_log").insert({
    user_id: userId,
    user_name: full_name.trim(),
    action: "SEED_SUPERADMIN",
    target_table: "user_roles",
    target_id: userId,
    details: { email: email.trim().toLowerCase(), role: "superadmin" },
  });

  return new Response(
    JSON.stringify({ success: true, user_id: userId }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
