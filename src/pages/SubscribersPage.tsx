import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Lock, Check, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeArticle, NormalizedArticle } from "@/lib/hub";
import PostCard from "@/components/PostCard";
import SEO from "@/components/SEO";
import { toast } from "sonner";

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  interval: string;
  perks: unknown;
  sort_order: number;
}

const formatPrice = (cents: number, currency: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);

const SubscribersPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: sub, isLoading: subLoading } = useSubscription();

  // Server-gated: edge function verifies JWT + active subscription before returning content.
  // If the user isn't a verified subscriber the function returns 401/403 and we render nothing exclusive.
  const { data: articles = [] } = useQuery({
    queryKey: ["exclusive-articles", sub?.isActive],
    enabled: Boolean(user && sub?.isActive),
    queryFn: async (): Promise<NormalizedArticle[]> => {
      const { data, error } = await supabase.functions.invoke<{
        table: string | null;
        items: Record<string, unknown>[];
      }>("hub-list-exclusive-posts", { body: { limit: 12 } });
      if (error) throw error;
      return (data?.items ?? []).map((row) => normalizeArticle(row, data?.table ?? null));
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async (): Promise<Plan[]> => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/assinantes", { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || (user && subLoading)) {
    return (
      <section className="pt-24 pb-16 px-4 min-h-screen">
        <div className="container mx-auto max-w-4xl">
          <Skeleton className="h-12 w-1/2 mb-4" />
          <Skeleton className="h-6 w-3/4 mb-8" />
          <div className="grid md:grid-cols-3 gap-4">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  if (!user) return null;

  // ---- ASSINANTE ATIVO: conteúdo exclusivo ----
  if (sub?.isActive) {
    return (
      <>
        <SEO title="Área do Assinante — Vitória News" description="Conteúdo exclusivo para assinantes." />
        <section className="pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong rounded-2xl p-8 mb-10 border border-gold/30"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shrink-0">
                  <Crown className="text-background" size={28} />
                </div>
                <div className="flex-1">
                  <h1 className="font-display text-3xl font-bold gradient-gold-text">Bem-vindo, assinante</h1>
                  <p className="text-muted-foreground mt-1">
                    Plano <span className="text-foreground font-semibold">{sub.plan?.name ?? "Premium"}</span>
                    {sub.currentPeriodEnd && (
                      <> · renova em {new Date(sub.currentPeriodEnd).toLocaleDateString("pt-BR")}</>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="text-gold" size={20} />
              <h2 className="font-display text-2xl font-bold">Conteúdo exclusivo</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Reportagens, lives privadas, podcasts e análises aprofundadas — todas as semanas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.length === 0 ? (
                <div className="col-span-full glass rounded-xl p-12 text-center text-muted-foreground">
                  Conteúdo exclusivo será publicado aqui em breve.
                </div>
              ) : (
                articles.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>
      </>
    );
  }

  // ---- NÃO ASSINANTE: paywall + planos ----
  return (
    <>
      <SEO
        title="Assine o Vitória News — Acesso ao conteúdo exclusivo"
        description="Reportagens, lives privadas, podcasts e análises exclusivas. Cancele quando quiser."
      />
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-gold/40 mb-6">
              <Lock className="text-gold" size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">Conteúdo exclusivo</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Assine e acesse o <span className="gradient-gold-text">Vitória News Premium</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Reportagens investigativas, lives privadas, podcasts e análises aprofundadas — sem anúncios.
            </p>
          </motion.div>

          {plans.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <p className="text-muted-foreground mb-6">
                Estamos finalizando os planos. Inscreva-se na newsletter para ser avisado.
              </p>
              <Button asChild>
                <Link to="/newsletter">Ir para newsletter</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, i) => {
                const perks = Array.isArray(plan.perks) ? (plan.perks as string[]) : [];
                const featured = i === 1;
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`relative rounded-2xl p-6 border ${
                      featured
                        ? "glass-strong border-gold/50 glow-gold"
                        : "glass border-border"
                    }`}
                  >
                    {featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-gold to-gold-light text-background text-xs font-bold uppercase">
                        Mais popular
                      </div>
                    )}
                    <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    )}
                    <div className="my-6">
                      <span className="text-4xl font-display font-bold">
                        {formatPrice(plan.price_cents, plan.currency)}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">/{plan.interval === "year" ? "ano" : "mês"}</span>
                    </div>
                    <ul className="space-y-2 mb-6 text-sm">
                      {perks.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="text-gold mt-0.5 shrink-0" size={16} />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={featured ? "default" : "outline"}
                      onClick={() =>
                        toast.info("Checkout em breve — finalize a configuração de pagamentos.")
                      }
                    >
                      Assinar {plan.name}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center mt-8">
            Pagamentos seguros · Cancele quando quiser · Suporte em português
          </p>
        </div>
      </section>
    </>
  );
};

export default SubscribersPage;
