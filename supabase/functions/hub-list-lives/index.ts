import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { getHubClient, HUB_LIVES_TABLE } from "../_shared/hub.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type"); // live | podcast
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 50);

    const hub = getHubClient();
    let q = hub.from(HUB_LIVES_TABLE).select("*").order("scheduled_at", { ascending: false }).limit(limit);
    if (type) q = q.eq("content_type", type);
    const { data, error } = await q;

    if (error) {
      console.error("[hub-list-lives] error", error);
      return errorResponse("Falha ao buscar lives", 502, { detail: error.message });
    }

    return jsonResponse({ items: data ?? [] });
  } catch (e) {
    console.error("[hub-list-lives] exception", e);
    return errorResponse(e instanceof Error ? e.message : "Erro desconhecido", 500);
  }
});
