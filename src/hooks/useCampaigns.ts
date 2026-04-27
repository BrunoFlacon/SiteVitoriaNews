import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Campaign {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  channel: "whatsapp" | "telegram" | "newsletter" | "mixed";
  whatsapp_url: string | null;
  telegram_url: string | null;
  audience: string;
  utm: Record<string, string>;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export function useCampaigns() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["campaigns"],
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Campaign[];
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("campaigns-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns" }, () => {
        qc.invalidateQueries({ queryKey: ["campaigns"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}

export function useCampaign(slug: string | undefined) {
  return useQuery({
    queryKey: ["campaign", slug],
    enabled: Boolean(slug),
    queryFn: async (): Promise<Campaign | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Campaign | null;
    },
  });
}
