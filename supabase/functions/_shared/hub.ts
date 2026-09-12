import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const HUB_TIMEOUT_MS = 3000;

/**
 * fetch com timeout — evita que uma chamada ao Hub fique presa ~25s
 * (o timeout padrão do supabase-js) quando o Hub está lento ou fora do ar.
 * Isso previne aquecimento de CPU/memória nas edge functions e erros
 * em cascata no dashboard.
 */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), HUB_TIMEOUT_MS);
  const { signal, ...rest } = init ?? {};
  return fetch(input, { ...rest, signal: ctrl.signal })
    .then((res) => {
      clearTimeout(timer);
      // Respostas 5xx do gateway do Hub (504 Gateway Timeout, 502, 503) são
      // tratadas como "Hub indisponível" para que as funções degradem em vez
      // de propagar erro. O supabase-js normalmente não lança para 4xx, mas o
      // gateway do Hub pode devolver 5xx com corpo não-PostgREST.
      if (res.status >= 500) {
        const err = new Error(`Hub HTTP ${res.status}`) as Error & { status?: number };
        err.status = res.status;
        throw err;
      }
      return res;
    })
    .catch((err) => {
      clearTimeout(timer);
      throw err;
    });
}

let cached: SupabaseClient | null = null;

/**
 * Cliente Supabase do Hub (Social Canvas) usando service role.
 * NUNCA expor no frontend. Usado apenas dentro de edge functions.
 * Timeout curto: se o Hub não responder em 3s, a função degrada
 * graciosamente em vez de segurar recursos.
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
    global: { fetch: fetchWithTimeout },
  });
  return cached;
}

/** Tabelas candidatas do Hub para artigos publicados, em ordem de preferência. */
export const HUB_POSTS_TABLES = ["articles", "posts"] as const;
export const HUB_PUBLISHED_TABLE = "published_posts";
export const HUB_LIVES_TABLE = "stories_lives";
export const HUB_CATEGORIES_TABLE = "categories";

/**
 * Detecta erros que significam "Hub indisponível" — tabela ainda não criada,
 * DNS/rede falhando (projeto pausado/removido), timeout, etc.
 * Nesses casos o site deve degradar graciosamente em vez de retornar 502.
 */
export function isHubUnavailable(err: unknown): boolean {
  if (!err) return false;
  const e = err as { code?: string; message?: string; name?: string; status?: number };
  if (e.code === "PGRST205" || e.code === "42P01") return true;
  if (typeof e.status === "number" && e.status >= 500) return true;
  const msg = `${e.message ?? ""} ${e.name ?? ""} ${String(err)}`.toLowerCase();
  return (
    msg.includes("failed to lookup") ||
    msg.includes("dns error") ||
    msg.includes("error sending request") ||
    msg.includes("networkerror") ||
    msg.includes("failed to fetch") ||
    msg.includes("connection refused") ||
    msg.includes("gateway timeout") ||
    msg.includes("bad gateway") ||
    msg.includes("service unavailable") ||
    msg.includes("hub http 5") ||
    msg.includes("timeout") ||
    msg.includes("aborted") ||
    msg.includes("abort")
  );
}

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
