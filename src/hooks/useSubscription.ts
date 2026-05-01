import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SubscriptionInfo {
  isActive: boolean;
  plan?: { code: string; name: string } | null;
  status?: string;
  currentPeriodEnd?: string | null;
}

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user && !authLoading,
    queryFn: async (): Promise<SubscriptionInfo> => {
      if (!user) return { isActive: false };
      const { data, error } = await supabase
        .from("subscribers")
        .select("status, current_period_end, plan_id, subscription_plans(code, name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return { isActive: false };

      const isActive = ["active", "trialing"].includes(data.status as string);
      const plan = (data as { subscription_plans?: { code: string; name: string } | null }).subscription_plans ?? null;
      return {
        isActive,
        plan,
        status: data.status as string,
        currentPeriodEnd: data.current_period_end as string | null,
      };
    },
  });

  return { ...query, authLoading };
}
