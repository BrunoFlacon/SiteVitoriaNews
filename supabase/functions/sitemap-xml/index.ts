import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { getHubClient, HUB_POSTS_TABLES, tryFromTables } from "../_shared/hub.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://vitoria.news";

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "hourly" },
  { path: "/redes", priority: "0.7", changefreq: "daily" },
  { path: "/grupos", priority: "0.6", changefreq: "weekly" },
  { path: "/newsletter", priority: "0.6", changefreq: "monthly" },
  { path: "/lives", priority: "0.7", changefreq: "daily" },
  { path: "/podcasts", priority: "0.7", changefreq: "weekly" },
  { path: "/assinantes", priority: "0.5", changefreq: "weekly" },
  { path: "/termos", priority: "0.3", changefreq: "yearly" },
  { path: "/privacidade", priority: "0.3", changefreq: "yearly" },
  { path: "/contato", priority: "0.4", changefreq: "yearly" },
];

const CATEGORIES = ["politica", "brasil", "economia", "tecnologia", "mundo"];

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async () => {
  let posts: Array<{ slug?: string; id?: string; updated_at?: string; published_at?: string; created_at?: string }> = [];

  try {
    const hub = getHubClient();
    const { data } = await tryFromTables<typeof posts>(hub, HUB_POSTS_TABLES, async (t) => {
      const res = await hub
        .from(t)
        .select("id, slug, updated_at, published_at, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      return res as { data: typeof posts | null; error: unknown };
    });
    posts = data ?? [];
  } catch (e) {
    console.warn("[sitemap] hub indisponível", e);
  }

  const urls: string[] = [];

  for (const r of STATIC_ROUTES) {
    urls.push(
      `<url><loc>${SITE_URL}${r.path}</loc><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`,
    );
  }
  for (const cat of CATEGORIES) {
    urls.push(
      `<url><loc>${SITE_URL}/categoria/${cat}</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>`,
    );
  }
  for (const p of posts) {
    const slugOrId = p.slug ?? p.id;
    if (!slugOrId) continue;
    const lastmod = p.updated_at ?? p.published_at ?? p.created_at;
    urls.push(
      `<url><loc>${SITE_URL}/post/${escapeXml(String(slugOrId))}</loc>${
        lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""
      }<changefreq>weekly</changefreq><priority>0.9</priority></url>`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
