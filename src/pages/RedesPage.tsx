import { useState } from "react";
import { motion } from "framer-motion";
import { Instagram, Youtube, Facebook, Linkedin, Music2 } from "lucide-react";
import SEO from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublishedPosts } from "@/hooks/useHubFeeds";

const platforms = [
  { id: "", label: "Todas" },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "tiktok", label: "TikTok", icon: Music2 },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "x", label: "X / Twitter" },
  { id: "telegram", label: "Telegram" },
  { id: "whatsapp", label: "WhatsApp" },
];

const RedesPage = () => {
  const [platform, setPlatform] = useState<string>("");
  const { data: items = [], isLoading } = usePublishedPosts({ platform: platform || undefined, limit: 60 });

  return (
    <div className="pt-20 pb-12 px-4">
      <SEO
        title="Redes Sociais — tudo o que publicamos em tempo real"
        description="Acompanhe todas as publicações da Vitória News no Instagram, YouTube, X, TikTok, Facebook, LinkedIn, Telegram e WhatsApp."
      />
      <div className="container mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 rounded-full bg-primary" />
          <h1 className="font-display text-3xl md:text-4xl font-bold">Redes Sociais</h1>
        </div>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Feed unificado das nossas redes — atualizado em tempo real conforme nossa redação publica.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {platforms.map((p) => (
            <button
              key={p.id || "all"}
              onClick={() => setPlatform(p.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                platform === p.id
                  ? "bg-primary text-primary-foreground"
                  : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center text-muted-foreground">
            Nenhuma publicação disponível neste filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((post, i) => (
              <motion.a
                key={post.id}
                href={post.external_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="block glass rounded-xl overflow-hidden hover:glow-primary transition-shadow"
              >
                {(post.thumbnail_url || post.media_url) && (
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={post.thumbnail_url || post.media_url}
                      alt={post.caption ?? "Publicação"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-4">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-muted text-[10px] uppercase tracking-wider text-gold font-bold">
                    {post.platform}
                  </span>
                  <p className="text-sm text-foreground/90 mt-2 line-clamp-3">{post.caption}</p>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RedesPage;
