import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getUser();
    if (claimsErr || !claims.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin using service client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin } = await adminClient.rpc("is_admin", {
      _user_id: claims.user.id,
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST users
    if (req.method === "GET" && action === "list") {
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, full_name, avatar_url, is_active, created_at")
        .order("full_name");

      // Get roles
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("user_id, role");

      // Get emails from auth
      const { data: authUsers } = await adminClient.auth.admin.listUsers({
        perPage: 1000,
      });

      const emailMap: Record<string, string> = {};
      authUsers?.users?.forEach((u: { id: string; email?: string }) => {
        if (u.email) emailMap[u.id] = u.email;
      });

      const roleMap: Record<string, string> = {};
      roles?.forEach((r: { user_id: string; role: string }) => {
        roleMap[r.user_id] = r.role;
      });

      const users = (profiles ?? []).map((p: { id: string; full_name: string; avatar_url: string | null; is_active: boolean; created_at: string }) => ({
        ...p,
        email: emailMap[p.id] || "",
        role: roleMap[p.id] || null,
      }));

      return new Response(JSON.stringify(users), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE user
    if (req.method === "POST" && action === "create") {
      const body = await req.json();
      const { email, full_name, password, role } = body;

      if (!email || !full_name || !password || !role) {
        return new Response(
          JSON.stringify({ error: "Campos obrigatórios: email, full_name, password, role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create auth user
      const { data: newUser, error: createErr } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name },
        });

      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Assign role
      if (newUser?.user) {
        await adminClient.from("user_roles").insert({
          user_id: newUser.user.id,
          role,
          assigned_by: claims.user.id,
        });
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser?.user?.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE user
    if (req.method === "PUT" && action === "update") {
      const body = await req.json();
      const { user_id, full_name, role, is_active } = body;

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update profile
      const updates: Record<string, unknown> = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (is_active !== undefined) updates.is_active = is_active;

      if (Object.keys(updates).length > 0) {
        await adminClient.from("profiles").update(updates).eq("id", user_id);
      }

      // Update role
      if (role !== undefined) {
        // Delete existing roles and insert new one
        await adminClient.from("user_roles").delete().eq("user_id", user_id);
        if (role) {
          await adminClient.from("user_roles").insert({
            user_id,
            role,
            assigned_by: claims.user.id,
          });
        }
      }

      // If deactivating, also ban the user in auth
      if (is_active !== undefined) {
        await adminClient.auth.admin.updateUserById(user_id, {
          ban_duration: is_active ? "none" : "876600h", // ~100 years
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
