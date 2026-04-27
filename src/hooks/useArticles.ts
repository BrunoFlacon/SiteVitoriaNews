import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { callEdgeFunction, normalizeArticle, NormalizedArticle } from "@/lib/hub";
import { hubSupabase } from "@/integrations/hub/client";

interface HubListResponse {
  table: string | null;
  count: number;
  items: Record<string, unknown>[];
}

export function useArticles(opts: { limit?: number; category?: string; breaking?: boolean } = {}) {
  const { limit = 20, category, breaking } = opts;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["articles", { limit, category, breaking }],
    queryFn: async (): Promise<NormalizedArticle[]> => {
      const res = await callEdgeFunction<HubListResponse>("hub-list-posts", {
        query: { limit, category, breaking },
      });
      return (res.items ?? []).map((row) => normalizeArticle(row, res.table));
    },
    staleTime: 60_000,
  });

  // Realtime: invalida quando o Hub muda (se conectado)
  useEffect(() => {
    if (!hubSupabase) return;
    const channel = hubSupabase
      .channel("hub-articles-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, () => {
        qc.invalidateQueries({ queryKey: ["articles"] });
        qc.invalidateQueries({ queryKey: ["article"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        qc.invalidateQueries({ queryKey: ["articles"] });
        qc.invalidateQueries({ queryKey: ["article"] });
      })
      .subscribe();
    return () => {
      hubSupabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

export function useArticle(slugOrId: string | undefined) {
  return useQuery({
    queryKey: ["article", slugOrId],
    enabled: Boolean(slugOrId),
    queryFn: async (): Promise<NormalizedArticle | null> => {
      if (!slugOrId) return null;
      const looksLikeUuid = /^[0-9a-f-]{20,}$/i.test(slugOrId);
      const res = await callEdgeFunction<{ table: string | null; item: Record<string, unknown> }>(
        "hub-get-post",
        { query: looksLikeUuid ? { id: slugOrId } : { slug: slugOrId } },
      );
      return res.item ? normalizeArticle(res.item, res.table) : null;
    },
  });
}
