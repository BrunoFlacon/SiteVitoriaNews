import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

const Body = z.object({
  fingerprint: z.string().trim().min(8).max(128),
  categories: z.object({
    necessary: z.literal(true),
    analytics: z.boolean(),
    marketing: z.boolean(),
    third_party: z.boolean(),
  }),
  policy_version: z.string().default("1.0"),
});

async function sha256(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Método não permitido", 405);

  try {
    const raw = await req.json().catch(() => null);
    const parsed = Body.safeParse(raw);
    if (!parsed.success) {
      return errorResponse("Consentimento inválido", 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Resolve usuário se vier autenticado
    let userId: string | null = null;
    const auth = req.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const token = auth.replace("Bearer ", "");
      try {
        const sb = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: auth } } },
        );
        const { data } = await sb.auth.getClaims(token);
        userId = data?.claims?.sub ?? null;
      } catch {
        // segue como anônimo
      }
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";

    const { error } = await supabase.from("consent_logs").insert({
      user_id: userId,
      fingerprint: parsed.data.fingerprint,
      categories: parsed.data.categories,
      policy_version: parsed.data.policy_version,
      ip_hash: await sha256(ip),
      ua_hash: await sha256(ua),
    });

    if (error) {
      console.error("[consent-log] insert", error);
      return errorResponse("Falha ao registrar consentimento", 500);
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    console.error("[consent-log] exception", e);
    return errorResponse("Erro interno", 500);
  }
});
