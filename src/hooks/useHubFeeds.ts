import { useQuery } from "@tanstack/react-query";
import { callEdgeFunction } from "@/lib/hub";

export interface PublishedPost {
  id: string;
  platform: string;
  caption?: string;
  media_url?: string;
  thumbnail_url?: string;
  external_url?: string;
  published_at?: string;
  [key: string]: unknown;
}

export function usePublishedPosts(opts: { platform?: string; limit?: number } = {}) {
  const { platform, limit = 30 } = opts;
  return useQuery({
    queryKey: ["published-posts", { platform, limit }],
    queryFn: async () => {
      const res = await callEdgeFunction<{ items: PublishedPost[] }>("hub-list-published-posts", {
        query: { platform, limit },
      });
      return res.items ?? [];
    },
    staleTime: 60_000,
  });
}

export interface LiveItem {
  id: string;
  title?: string;
  content_type?: "live" | "podcast";
  scheduled_at?: string;
  cover_url?: string;
  [key: string]: unknown;
}

export function useLives(opts: { type?: "live" | "podcast"; limit?: number } = {}) {
  const { type, limit = 20 } = opts;
  return useQuery({
    queryKey: ["lives", { type, limit }],
    queryFn: async () => {
      const res = await callEdgeFunction<{ items: LiveItem[] }>("hub-list-lives", {
        query: { type, limit },
      });
      return res.items ?? [];
    },
    staleTime: 60_000,
  });
}
