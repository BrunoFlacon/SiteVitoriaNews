import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

let cached: SupabaseClient | null = null;

/**
 * Cliente Supabase do Hub (Social Canvas) usando service role.
 * NUNCA expor no frontend. Usado apenas dentro de edge functions.
 */
export function getHubClient(): SupabaseClient {
  if (cached) return cached;
  const url = Deno.env.get("HUB_SUPABASE_URL");
  const key = Deno.env.get("HUB_SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error("HUB_SUPABASE_URL ou HUB_SUPABASE_SERVICE_ROLE_KEY ausente");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Tabelas candidatas do Hub para artigos publicados, em ordem de preferência. */
export const HUB_POSTS_TABLES = ["articles", "posts"] as const;
export const HUB_PUBLISHED_TABLE = "published_posts";
export const HUB_LIVES_TABLE = "stories_lives";
export const HUB_CATEGORIES_TABLE = "categories";

/**
 * Tenta buscar de uma lista de tabelas e retorna o primeiro resultado bem-sucedido.
 * Útil porque o Hub pode usar `articles` ou `posts` dependendo da versão.
 */
export async function tryFromTables<T = unknown>(
  client: SupabaseClient,
  tables: readonly string[],
  builder: (tableName: string) => Promise<{ data: T | null; error: unknown }>,
): Promise<{ data: T | null; error: unknown; table: string | null }> {
  let lastError: unknown = null;
  for (const t of tables) {
    try {
      const res = await builder(t);
      if (!res.error && res.data) {
        return { data: res.data, error: null, table: t };
      }
      lastError = res.error;
    } catch (e) {
      lastError = e;
    }
  }
  return { data: null, error: lastError, table: null };
}
