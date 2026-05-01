import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { getHubClient, HUB_POSTS_TABLES, tryFromTables } from "../_shared/hub.ts";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://vitoria.news";
const SITE_NAME = "Vitória News";

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

Deno.serve(async () => {
  let posts: Record<string, unknown>[] = [];
  try {
    const hub = getHubClient();
    const { data } = await tryFromTables<Record<string, unknown>[]>(hub, HUB_POSTS_TABLES, async (t) => {
      const res = await hub.from(t).select("*").order("created_at", { ascending: false }).limit(50);
      return res as { data: Record<string, unknown>[] | null; error: unknown };
    });
    posts = data ?? [];
  } catch (e) {
    console.warn("[atom] hub indisponível", e);
  }

  const updated = posts[0] ? new Date(pick(posts[0], ["updated_at", "published_at", "created_at"]) ?? Date.now()) : new Date();

  const entries = posts
    .map((p) => {
      const id = pick(p, ["id"]) ?? "";
      const slug = pick(p, ["slug"]) ?? id;
      const title = pick(p, ["title", "headline"]) ?? "Sem título";
      const desc = pick(p, ["excerpt", "summary", "description"]) ?? "";
      const upd = pick(p, ["updated_at", "published_at", "created_at"]) ?? new Date().toISOString();
      const author = pick(p, ["author_name", "author"]) ?? SITE_NAME;
      const link = `${SITE_URL}/post/${slug}`;
      return `  <entry>
    <id>${link}</id>
    <title>${escapeXml(title)}</title>
    <link href="${link}" />
    <updated>${new Date(upd).toISOString()}</updated>
    <author><name>${escapeXml(author)}</name></author>
    <summary>${escapeXml(desc)}</summary>
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${SITE_NAME}</title>
  <link href="${SITE_URL}" />
  <link rel="self" href="${SITE_URL}/atom.xml" />
  <id>${SITE_URL}/</id>
  <updated>${updated.toISOString()}</updated>
${entries}
</feed>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
