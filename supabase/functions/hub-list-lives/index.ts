import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { getHubClient, HUB_LIVES_TABLE, isHubUnavailable } from "../_shared/hub.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 50);

    const hub = getHubClient();
    let q = hub.from(HUB_LIVES_TABLE).select("*").order("scheduled_at", { ascending: false }).limit(limit);
    if (type) q = q.eq("content_type", type);
    const { data, error } = await q;

    if (error) {
      console.warn("[hub-list-lives] sem dados; retornando vazio", error);
      return jsonResponse({ items: [], hub_empty: true, degraded: true });
    }

    return jsonResponse({ items: data ?? [] });
  } catch (e) {
    if (isHubUnavailable(e)) {
      return jsonResponse({ items: [], hub_empty: true });
    }
    console.error("[hub-list-lives] exception", e);
    return errorResponse("Erro interno", 500);
  }
});
