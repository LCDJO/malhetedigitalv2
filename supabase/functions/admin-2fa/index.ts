import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base32encode } from "https://deno.land/std@0.208.0/encoding/base32.ts";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function hmacSha1(key: Uint8Array, msg: Uint8Array): Promise<Uint8Array> {
  return crypto.subtle
    .importKey("raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"])
    .then((k) => crypto.subtle.sign("HMAC", k, msg))
    .then((sig) => new Uint8Array(sig));
}

function generateTOTP(secret: Uint8Array, timeStep = 30): Promise<string> {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  const counterBuf = new Uint8Array(8);
  const view = new DataView(counterBuf.buffer);
  view.setBigUint64(0, BigInt(counter));
  return hmacSha1(secret, counterBuf).then((hmac) => {
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      (((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)) %
      1000000;
    return code.toString().padStart(6, "0");
  });
}

function decodeBase32(str: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanStr = str.toUpperCase().replace(/=+$/, "");
  const bits: number[] = [];
  for (const c of cleanStr) {
    const val = alphabet.indexOf(c);
    if (val === -1) throw new Error("Invalid base32");
    for (let i = 4; i >= 0; i--) bits.push((val >> i) & 1);
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i * 8 + j];
    bytes[i] = byte;
  }
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email || "user@app.com";
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Any authenticated user can manage their own 2FA — no role restriction

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // STATUS — check if 2FA is enabled
    if (action === "status") {
      const { data } = await adminClient
        .from("user_2fa")
        .select("is_enabled")
        .eq("user_id", userId)
        .maybeSingle();

      return new Response(
        JSON.stringify({ enabled: data?.is_enabled ?? false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SETUP — generate a new TOTP secret
    if (action === "setup") {
      const secretBytes = crypto.getRandomValues(new Uint8Array(20));
      const secretB32 = base32encode(secretBytes);
      const issuer = "MalheteDigital";
      const otpAuthUrl = `otpauth://totp/${issuer}:${encodeURIComponent(userEmail)}?secret=${secretB32}&issuer=${issuer}&digits=6&period=30`;

      // Store secret (not enabled yet)
      await adminClient.from("user_2fa").upsert(
        {
          user_id: userId,
          totp_secret: secretB32,
          is_enabled: false,
        },
        { onConflict: "user_id" }
      );

      return new Response(
        JSON.stringify({ secret: secretB32, otpauth_url: otpAuthUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // VERIFY — validate a TOTP code and enable 2FA
    if (action === "verify") {
      const body = await req.json();
      const code = body.code as string;

      if (!code || code.length !== 6) {
        return new Response(JSON.stringify({ error: "Código inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: tfaRecord } = await adminClient
        .from("user_2fa")
        .select("totp_secret")
        .eq("user_id", userId)
        .maybeSingle();

      if (!tfaRecord) {
        return new Response(JSON.stringify({ error: "2FA não configurado" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const secretBytes = decodeBase32(tfaRecord.totp_secret);
      const expectedCode = await generateTOTP(secretBytes);

      if (code !== expectedCode) {
        return new Response(JSON.stringify({ error: "Código incorreto" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate backup codes
      const backupCodes: string[] = [];
      for (let i = 0; i < 8; i++) {
        const bytes = crypto.getRandomValues(new Uint8Array(4));
        backupCodes.push(
          Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
        );
      }

      await adminClient
        .from("user_2fa")
        .update({ is_enabled: true, backup_codes: backupCodes })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ success: true, backup_codes: backupCodes }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // VALIDATE — validate code on login (called from frontend)
    if (action === "validate") {
      const body = await req.json();
      const code = body.code as string;
      const targetUserId = body.user_id as string || userId;

      const { data: tfaRecord } = await adminClient
        .from("user_2fa")
        .select("totp_secret, is_enabled, backup_codes")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (!tfaRecord || !tfaRecord.is_enabled) {
        return new Response(
          JSON.stringify({ valid: true, reason: "2FA not enabled" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const secretBytes = decodeBase32(tfaRecord.totp_secret);
      const expectedCode = await generateTOTP(secretBytes);

      if (code === expectedCode) {
        return new Response(
          JSON.stringify({ valid: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check backup codes
      if (tfaRecord.backup_codes?.includes(code)) {
        const remaining = tfaRecord.backup_codes.filter((c: string) => c !== code);
        await adminClient
          .from("user_2fa")
          .update({ backup_codes: remaining })
          .eq("user_id", targetUserId);
        return new Response(
          JSON.stringify({ valid: true, used_backup: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: false, error: "Código inválido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DISABLE
    if (action === "disable") {
      await adminClient
        .from("user_2fa")
        .update({ is_enabled: false, totp_secret: "", backup_codes: [] })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
