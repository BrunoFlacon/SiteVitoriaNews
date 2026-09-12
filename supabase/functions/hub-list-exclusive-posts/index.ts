import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { getHubClient, HUB_POSTS_TABLES, tryFromTables, isHubUnavailable } from "../_shared/hub.ts";

/**
 * Server-side gated endpoint for subscriber-exclusive content.
 * Requires:
 *  1. A valid Supabase JWT (Authorization: Bearer <token>)
 *  2. An active/trialing subscription for that user in the `subscribers` table
 *
 * If either check fails, returns 401/403 with NO exclusive data.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1) Auth — extract JWT
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return errorResponse("Autenticação obrigatória", 401);
    }
    const token = auth.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const sbAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    let userId: string | undefined;
    try {
      const { data: claimsData, error: claimsErr } = await sbAuth.auth.getClaims(token);
      userId = claimsData?.claims?.sub;
      if (claimsErr) {
        console.warn("[hub-list-exclusive-posts] getClaims", claimsErr);
      }
    } catch (e) {
      console.warn("[hub-list-exclusive-posts] getClaims exception", e);
    }
    if (!userId) {
      return errorResponse("Sessão inválida", 401);
    }

    // 2) Subscription check (service-role so RLS doesn't block)
    const sbSvc = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: sub, error: subErr } = await sbSvc
      .from("subscribers")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    if (subErr) {
      console.error("[hub-list-exclusive-posts] sub lookup", subErr);
      return errorResponse("Erro ao verificar assinatura", 500);
    }

    const active =
      sub &&
      ["active", "trialing"].includes(String(sub.status)) &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

    if (!active) {
      return errorResponse("Assinatura ativa requerida", 403);
    }

    // 3) Fetch exclusive content
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);

    const hub = getHubClient();
    const { data, error, table } = await tryFromTables<unknown[]>(
      hub,
      HUB_POSTS_TABLES,
      async (t) => {
        const res = await hub
          .from(t)
          .select("*")
          .order("created_at", { ascending: false })
          .range(0, limit - 1);
        return res as { data: unknown[] | null; error: unknown };
      },
    );

    if (error) {
      // Hub indisponível (504/timeout/DNS/tabela ausente) → degrada graciosamente
      // com lista vazia em vez de 502, evitando erros no dashboard quando o
      // Hub está fora do ar.
      if (isHubUnavailable(error)) {
        console.warn("[hub-list-exclusive-posts] hub indisponível; degradando", error);
        return jsonResponse({ table: null, items: [], hub_empty: true });
      }
      console.error("[hub-list-exclusive-posts] error", error);
      return errorResponse("Falha ao buscar conteúdo exclusivo", 502);
    }

    return jsonResponse({ table, count: data?.length ?? 0, items: data ?? [] });
  } catch (e) {
    console.error("[hub-list-exclusive-posts] exception", e);
    return errorResponse("Erro interno", 500);
  }
});
