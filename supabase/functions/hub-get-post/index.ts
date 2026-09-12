import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { getHubClient, HUB_POSTS_TABLES, tryFromTables, isHubUnavailable } from "../_shared/hub.ts";

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

    if (error) {
      // Qualquer erro do Hub (504, timeout, tabela faltando, DNS) significa
      // "Hub indisponível" → degrada graciosamente em vez de responder 404/500.
      // Isso evita erros em cascata no dashboard (API Gateway) quando o Hub
      // está fora. O supabase-js retorna { data, error } sem lançar exceção
      // para erros HTTP, então `error` aqui já cobre o caso de gateway 504.
      console.warn("[hub-get-post] hub error; degradando", error);
      return jsonResponse({ table: null, item: null, hub_empty: true });
    }

    if (!data) {
      // Hub respondeu com sucesso, mas não há post com este id/slug → 404 legítimo.
      return errorResponse("Post não encontrado", 404);
    }

    return jsonResponse({ table, item: data });
  } catch (e) {
    if (isHubUnavailable(e)) {
      return jsonResponse({ table: null, item: null, hub_empty: true });
    }
    console.error("[hub-get-post] exception", e);
    return errorResponse("Erro interno", 500);
  }
});
