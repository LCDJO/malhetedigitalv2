import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    // ── Authentication check ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const userEmail = user.email as string;

    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only allow sending to the authenticated user's own email
    if (email !== userEmail) {
      return new Response(JSON.stringify({ error: "Só é possível enviar código para seu próprio e-mail." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // ── Rate limiting: 1 code per 60 seconds ──
    const { data: recentCodes } = await supabaseAdmin
      .from("email_verification_codes")
      .select("created_at")
      .eq("email", email)
      .eq("used", false)
      .gte("created_at", new Date(Date.now() - 60000).toISOString())
      .limit(1);

    if (recentCodes && recentCodes.length > 0) {
      return new Response(
        JSON.stringify({ error: "Aguarde 60 segundos antes de solicitar um novo código." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Invalidar códigos anteriores não usados
    await supabaseAdmin
      .from("email_verification_codes")
      .update({ used: true })
      .eq("email", email)
      .eq("used", false);

    // Gerar novo código com expiração de 10 minutos
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin
      .from("email_verification_codes")
      .insert({
        user_id: userId,
        email,
        code,
        expires_at: expiresAt,
      });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enviar email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Malhete Ads <noreply@malhetedigital.com.br>",
        to: [email],
        subject: "Código de Verificação — Malhete Ads",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fafafa; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #1a1a2e; font-size: 22px; margin: 0;">Malhete Ads</h1>
              <p style="color: #666; font-size: 14px; margin: 4px 0 0;">Portal do Anunciante</p>
            </div>
            <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 15px; margin: 0 0 16px;">Olá! Use o código abaixo para verificar seu e-mail:</p>
              <div style="text-align: center; margin: 20px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #c8a45a; background: #fdf6e3; padding: 12px 24px; border-radius: 8px; display: inline-block;">${code}</span>
              </div>
              <p style="color: #888; font-size: 13px; margin: 16px 0 0; text-align: center;">
                Este código expira em <strong>10 minutos</strong>.
              </p>
              <p style="color: #aaa; font-size: 12px; margin: 12px 0 0; text-align: center;">
                Se você não solicitou este código, ignore este e-mail.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errBody = await emailResponse.text();
      console.error("Resend error:", errBody);
      return new Response(JSON.stringify({ error: "Falha ao enviar e-mail. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
