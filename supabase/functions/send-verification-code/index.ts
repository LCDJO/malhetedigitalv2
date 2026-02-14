import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { user_id, email } = await req.json();

    if (!user_id || !email) {
      return new Response(JSON.stringify({ error: "user_id e email são obrigatórios." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
        user_id,
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
