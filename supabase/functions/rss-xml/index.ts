import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { getHubClient, HUB_POSTS_TABLES, tryFromTables } from "../_shared/hub.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://vitoria.news";
const SITE_NAME = "Vitória News";
const SITE_DESC = "Notícias, política e Brasil em tempo real.";

function escapeXml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function pick(row: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return null;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  let posts: Record<string, unknown>[] = [];

  try {
    const hub = getHubClient();
    const { data } = await tryFromTables<Record<string, unknown>[]>(hub, HUB_POSTS_TABLES, async (t) => {
      let q = hub.from(t).select("*").order("created_at", { ascending: false }).limit(50);
      if (category) q = q.eq("category_slug", category);
      const res = await q;
      return res as { data: Record<string, unknown>[] | null; error: unknown };
    });
    posts = data ?? [];
  } catch (e) {
    console.warn("[rss] hub indisponível", e);
  }

  const items = posts
    .map((p) => {
      const id = pick(p, ["id"]);
      const slug = pick(p, ["slug"]) ?? id ?? "";
      const title = pick(p, ["title", "headline"]) ?? "Sem título";
      const desc = pick(p, ["excerpt", "summary", "description"]) ?? "";
      const pub = pick(p, ["published_at", "created_at"]) ?? new Date().toISOString();
      const author = pick(p, ["author_name", "author"]) ?? SITE_NAME;
      const cat = pick(p, ["category", "category_name"]) ?? "Geral";
      const link = `${SITE_URL}/post/${slug}`;
      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(desc)}</description>
      <author>${escapeXml(author)}</author>
      <category>${escapeXml(cat)}</category>
      <pubDate>${new Date(pub).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}${category ? ` — ${category}` : ""}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${SITE_DESC}</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
