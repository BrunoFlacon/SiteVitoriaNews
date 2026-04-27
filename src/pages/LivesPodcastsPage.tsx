import { motion } from "framer-motion";
import { Radio, Mic, Calendar } from "lucide-react";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { useLives } from "@/hooks/useHubFeeds";

interface Props { type?: "live" | "podcast" }

const LivesPodcastsPage = ({ type }: Props) => {
  const { data: items = [], isLoading } = useLives({ type, limit: 30 });
  const isPodcast = type === "podcast";

  return (
    <div className="pt-20 pb-12 px-4">
      <SEO
        title={isPodcast ? "Podcasts — Vitória News" : "Lives e transmissões — Vitória News"}
        description={
          isPodcast
            ? "Episódios de podcast da Vitória News com análises políticas e entrevistas."
            : "Lives e coberturas ao vivo com a equipe da Vitória News."
        }
      />
      <div className="container mx-auto">
        <div className="flex items-center gap-3 mb-8">
          {isPodcast ? <Mic className="text-gold" size={28} /> : <Radio className="text-gold" size={28} />}
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            {isPodcast ? "Podcasts" : "Lives"}
          </h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-video rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center text-muted-foreground">
            Nenhum {isPodcast ? "episódio" : "live"} agendado no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, i) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl overflow-hidden hover:glow-primary transition-shadow"
              >
                {item.cover_url && (
                  <div className="aspect-video overflow-hidden">
                    <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="p-5">
                  <h2 className="font-display font-bold text-lg line-clamp-2">{item.title ?? "Sem título"}</h2>
                  {item.scheduled_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Calendar size={12} />
                      <time>{new Date(item.scheduled_at).toLocaleString("pt-BR")}</time>
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LivesPodcastsPage;
