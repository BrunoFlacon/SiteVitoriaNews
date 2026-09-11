import { supabase } from "@/integrations/supabase/client";

/**
 * Normaliza um post do Hub em algo que o frontend já espera.
 * O Hub pode usar `articles` ou `posts`; cada um tem nomes
 * de colunas levemente diferentes — esta camada absorve isso.
 */
export interface NormalizedArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  category: string;
  category_slug: string;
  author: string | null;
  is_breaking: boolean;
  is_exclusive: boolean;
  created_at: string;
  published_at: string | null;
  source_table: string | null;
  raw: Record<string, unknown>;
}

function pick<T = unknown>(row: Record<string, unknown>, keys: string[], fallback: T | null = null): T | null {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k] as T;
  }
  return fallback;
}

export function normalizeArticle(row: Record<string, unknown>, table: string | null): NormalizedArticle {
  const id = String(pick<string | number>(row, ["id", "uuid"]) ?? crypto.randomUUID());
  const title = String(pick<string>(row, ["title", "headline", "name"]) ?? "Sem título");
  const slug = String(
    pick<string>(row, ["slug", "permalink"]) ??
      title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").slice(0, 80),
  );
  const content = String(pick<string>(row, ["content", "body", "html", "text"]) ?? "");
  const excerpt = String(pick<string>(row, ["excerpt", "summary", "subtitle", "description"]) ?? content.replace(/<[^>]*>/g, "").slice(0, 220));
  const image_url = pick<string>(row, ["image_url", "cover_url", "thumbnail_url", "featured_image"]);
  const category = String(pick<string>(row, ["category", "category_name", "section"]) ?? "Geral");
  const category_slug = String(pick<string>(row, ["category_slug"]) ?? category.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  const author = pick<string>(row, ["author_name", "author", "byline"]);
  const created_at = String(pick<string>(row, ["created_at", "published_at", "inserted_at"]) ?? new Date().toISOString());
  const published_at = pick<string>(row, ["published_at"]);

  return {
    id,
    slug,
    title,
    excerpt,
    content,
    image_url,
    category,
    category_slug,
    author,
    is_breaking: Boolean(pick<boolean>(row, ["is_breaking", "breaking"], false)),
    is_exclusive: Boolean(pick<boolean>(row, ["is_exclusive", "exclusive"], false)),
    created_at,
    published_at,
    source_table: table,
    raw: row,
  };
}

/**
 * Helper para chamar edge functions do Supabase (Banco B) via SDK.
 * Aceita query params e body JSON, devolve o JSON parseado ou lança erro.
 */
export async function callEdgeFunction<T = unknown>(
  name: string,
  options: { query?: Record<string, string | number | boolean | undefined>; body?: unknown; method?: "GET" | "POST" } = {},
): Promise<T> {
  const { query, body, method = "GET" } = options;
  const search = query
    ? "?" +
      Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  const { data, error } = await supabase.functions.invoke<T>(`${name}${search}`, {
    method,
    body: body as never,
  });
  if (error) throw new Error(error.message);
  return data as T;
}
