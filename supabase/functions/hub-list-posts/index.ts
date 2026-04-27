import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { getHubClient, HUB_POSTS_TABLES, tryFromTables } from "../_shared/hub.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100);
    const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10), 0);
    const category = url.searchParams.get("category");
    const breaking = url.searchParams.get("breaking") === "true";

    const hub = getHubClient();

    const { data, error, table } = await tryFromTables<unknown[]>(
      hub,
      HUB_POSTS_TABLES,
      async (t) => {
        let q = hub.from(t).select("*").order("created_at", { ascending: false });
        // best-effort filters — silently ignored if column doesn't exist
        if (category) q = q.eq("category", category);
        if (breaking) q = q.eq("is_breaking", true);
        const res = await q.range(offset, offset + limit - 1);
        return res as { data: unknown[] | null; error: unknown };
      },
    );

    if (error || !data) {
      console.error("[hub-list-posts] error", error);
      return errorResponse("Falha ao buscar posts no Hub", 502, { detail: String(error) });
    }

    return jsonResponse({ table, count: data.length, items: data });
  } catch (e) {
    console.error("[hub-list-posts] exception", e);
    return errorResponse(e instanceof Error ? e.message : "Erro desconhecido", 500);
  }
});
