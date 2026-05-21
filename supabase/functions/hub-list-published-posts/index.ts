import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { getHubClient, HUB_PUBLISHED_TABLE, isHubUnavailable } from "../_shared/hub.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "30", 10), 100);
    const platform = url.searchParams.get("platform");

    const hub = getHubClient();
    let q = hub.from(HUB_PUBLISHED_TABLE).select("*").order("published_at", { ascending: false }).limit(limit);
    if (platform) q = q.eq("platform", platform);
    const { data, error } = await q;

    if (error) {
      if (isHubUnavailable(error)) {
        return jsonResponse({ items: [], hub_empty: true });
      }
      console.error("[hub-list-published-posts] error", error);
      return errorResponse("Falha ao buscar publicações", 502);
    }

    return jsonResponse({ items: data ?? [] });
  } catch (e) {
    if (isHubUnavailable(e)) {
      return jsonResponse({ items: [], hub_empty: true });
    }
    console.error("[hub-list-published-posts] exception", e);
    return errorResponse("Erro interno", 500);
  }
});
