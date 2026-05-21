import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { getHubClient } from "../_shared/hub.ts";

// Validação de entrada — protege contra payloads inválidos / injeção
const Body = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  source: z
    .enum(["newsletter", "group_whatsapp", "group_telegram", "paywall", "lead_magnet", "other"])
    .default("newsletter"),
  campaign_slug: z.string().trim().max(120).optional(),
  utm: z.record(z.string()).optional(),
  consent: z.object({
    accept_terms: z.boolean(),
    marketing: z.boolean().default(false),
    policy_version: z.string().default("1.0"),
  }),
});

// hash leve para anonimizar IP/UA antes de gravar (LGPD)
async function sha256(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// rate limit em memória (não funciona em multi-instance, mas serve para começar)
const recent = new Map<string, number>();
const RL_WINDOW_MS = 60_000;
const RL_MAX = 5;
function rateLimited(key: string): boolean {
  const now = Date.now();
  for (const [k, t] of recent) if (now - t > RL_WINDOW_MS) recent.delete(k);
  const hits = [...recent.keys()].filter((k) => k.startsWith(key + ":")).length;
  if (hits >= RL_MAX) return true;
  recent.set(`${key}:${now}`, now);
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Método não permitido", 405);

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (rateLimited(ip)) return errorResponse("Muitas tentativas, tente novamente em alguns instantes", 429);

    const raw = await req.json().catch(() => null);
    const parsed = Body.safeParse(raw);
    if (!parsed.success) {
      return errorResponse("Dados inválidos", 400);
    }
    const { email, name, phone, source, campaign_slug, utm, consent } = parsed.data;
    if (!consent.accept_terms) return errorResponse("Aceite dos termos é obrigatório", 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Resolve campanha (opcional)
    let campaignId: string | null = null;
    let campaignLinks: { whatsapp_url: string | null; telegram_url: string | null } | null = null;
    if (campaign_slug) {
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("id, whatsapp_url, telegram_url, is_active")
        .eq("slug", campaign_slug)
        .maybeSingle();
      if (campaign?.is_active) {
        campaignId = campaign.id;
        campaignLinks = { whatsapp_url: campaign.whatsapp_url, telegram_url: campaign.telegram_url };
      }
    }

    const ipHash = await sha256(ip);
    const uaHash = await sha256(req.headers.get("user-agent") ?? "unknown");

    // Upsert lead
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .upsert(
        {
          email: email.toLowerCase(),
          name,
          phone,
          source,
          campaign_id: campaignId,
          consent: { ...consent, recorded_at: new Date().toISOString() },
          utm: utm ?? {},
          ip_hash: ipHash,
          ua_hash: uaHash,
        },
        { onConflict: campaignId ? "email,campaign_id" : "email" },
      )
      .select()
      .single();

    if (leadErr || !lead) {
      console.error("[lead-capture] insert lead", leadErr);
      return errorResponse("Não foi possível registrar o lead", 500, { detail: leadErr?.message });
    }

    // Evento de opt-in
    await supabase.from("lead_events").insert({
      lead_id: lead.id,
      type: "opt_in",
      payload: { source, campaign_slug, utm },
    });

    // Sincroniza com o Hub (best-effort — não bloqueia resposta se falhar)
    try {
      const hub = getHubClient();
      await hub.from("portal_subscribers").upsert(
        {
          email: email.toLowerCase(),
          name,
          phone,
          plan_type: "free",
          metadata: { source, campaign_slug, utm, lead_id: lead.id },
        },
        { onConflict: "email" },
      );
      await supabase.from("leads").update({ hub_synced_at: new Date().toISOString() }).eq("id", lead.id);
      await supabase.from("lead_events").insert({ lead_id: lead.id, type: "sync_hub", payload: {} });
    } catch (e) {
      console.error("[lead-capture] hub sync failed", e);
      await supabase.from("lead_events").insert({
        lead_id: lead.id,
        type: "sync_failed",
        payload: { error: e instanceof Error ? e.message : String(e) },
      });
    }

    return jsonResponse({
      ok: true,
      lead_id: lead.id,
      campaign: campaignLinks,
    });
  } catch (e) {
    console.error("[lead-capture] exception", e);
    return errorResponse(e instanceof Error ? e.message : "Erro desconhecido", 500);
  }
});
