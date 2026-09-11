import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { getHubClient, HUB_CATEGORIES_TABLE, isHubUnavailable } from "../_shared/hub.ts";

/**
 * Lista as categorias/publicações do Hub.
 * Responde sempre com JSON shape { items: [...] } para o frontend,
 * degradando graciosamente quando o Hub estiver indisponível.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500);

    const hub = getHubClient();
    const { data, error } = await hub
      .from(HUB_CATEGORIES_TABLE)
      .select("*")
      .order("name", { ascending: true })
      .limit(limit);

    if (error) {
      console.warn("[hub-list-categories] sem dados; retornando vazio", error);
      return jsonResponse({ items: [], hub_empty: true, degraded: true });
    }

    return jsonResponse({ items: data ?? [] });
  } catch (e) {
    if (isHubUnavailable(e)) {
      console.warn("[hub-list-categories] Hub indisponível; retornando vazio");
      return jsonResponse({ items: [], hub_empty: true });
    }
    console.error("[hub-list-categories] exception", e);
    return errorResponse("Erro interno", 500);
  }
});