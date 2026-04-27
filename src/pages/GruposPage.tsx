import { motion } from "framer-motion";
import { MessageCircle, Hash, Loader2 } from "lucide-react";
import SEO from "@/components/SEO";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Skeleton } from "@/components/ui/skeleton";

const GruposPage = () => {
  const { data: campaigns = [], isLoading } = useCampaigns();

  return (
    <div className="pt-20 pb-12 px-4">
      <SEO
        title="Grupos exclusivos — WhatsApp e Telegram"
        description="Entre nos grupos oficiais da Vitória News no WhatsApp e Telegram. Receba breaking news e conteúdo direto da redação."
      />
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 rounded-full bg-gold" />
          <h1 className="font-display text-3xl md:text-4xl font-bold">Grupos Vitória News</h1>
        </div>
        <p className="text-muted-foreground mb-10 max-w-2xl">
          Cadastre-se e receba o link do grupo escolhido. Para entrar, basta confirmar seu cadastro abaixo.
          Grupos VIP exigem assinatura ativa.
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center text-muted-foreground">
            Nenhuma campanha ativa no momento. Volte em breve.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {campaigns.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="space-y-4"
              >
                <div className="glass rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    {c.whatsapp_url && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                        <MessageCircle size={12} /> WhatsApp
                      </span>
                    )}
                    {c.telegram_url && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold uppercase">
                        <Hash size={12} /> Telegram
                      </span>
                    )}
                    {c.audience === "subscribers" && (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-bold uppercase">
                        VIP
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-xl font-bold">{c.name}</h2>
                  {c.description && (
                    <p className="text-sm text-muted-foreground mt-2">{c.description}</p>
                  )}
                </div>
                <LeadCaptureForm
                  source={c.whatsapp_url ? "group_whatsapp" : "group_telegram"}
                  campaignSlug={c.slug}
                  title={`Entrar em: ${c.name}`}
                  description="Preencha rapidamente para receber o link do grupo."
                  revealLinks
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GruposPage;
