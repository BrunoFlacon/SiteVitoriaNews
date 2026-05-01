import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { getHubClient, HUB_POSTS_TABLES, tryFromTables } from "../_shared/hub.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const slug = url.searchParams.get("slug");
    if (!id && !slug) return errorResponse("É necessário passar id ou slug", 400);

    const hub = getHubClient();

    const { data, error, table } = await tryFromTables<unknown>(
      hub,
      HUB_POSTS_TABLES,
      async (t) => {
        const q = hub.from(t).select("*").limit(1);
        const res = id ? await q.eq("id", id).maybeSingle() : await q.eq("slug", slug).maybeSingle();
        return res as { data: unknown | null; error: unknown };
      },
    );

    if (error || !data) {
      const e = error as { code?: string; message?: string } | null;
      return errorResponse("Post não encontrado", 404, { detail: e?.message ?? "não encontrado" });
    }

    return jsonResponse({ table, item: data });
  } catch (e) {
    console.error("[hub-get-post] exception", e);
    return errorResponse(e instanceof Error ? e.message : "Erro desconhecido", 500);
  }
});
