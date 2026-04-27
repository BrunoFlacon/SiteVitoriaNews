import { motion } from "framer-motion";
import { TrendingUp, Loader2 } from "lucide-react";
import PostCard from "@/components/PostCard";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import SEO from "@/components/SEO";
import { useArticles } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";

const categories = ["Política", "Brasil", "Economia", "Tecnologia", "Mundo"];

const Index = () => {
  const { data: articles = [], isLoading } = useArticles({ limit: 13 });

  const featured = articles[0];
  const latest = articles.slice(1, 7);
  const trending = articles.slice(0, 4);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: articles.slice(0, 10).map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${typeof window !== "undefined" ? window.location.origin : ""}/post/${a.slug ?? a.id}`,
      name: a.title,
    })),
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: "Vitória News",
    url: typeof window !== "undefined" ? window.location.origin : "https://vitoria.news",
  };

  return (
    <>
      <SEO
        title="Vitória News — Notícias, Política e Brasil em tempo real"
        description="Cobertura editorial premium de política, Brasil, mundo, economia e tecnologia. Últimas notícias e análises."
        jsonLd={[itemListJsonLd, orgJsonLd]}
      />
      <h1 className="sr-only">Vitória News — Portal de Notícias</h1>

      {/* Hero */}
      <section className="pt-20 pb-8 px-4">
        <div className="container mx-auto">
          {isLoading ? (
            <Skeleton className="aspect-[21/9] w-full rounded-xl" />
          ) : featured ? (
            <PostCard post={{ ...featured }} featured />
          ) : (
            <div className="glass rounded-xl p-12 text-center text-muted-foreground">
              Nenhuma notícia publicada ainda. Conteúdo do Hub aparecerá aqui em tempo real.
            </div>
          )}
        </div>
      </section>

      {/* Latest */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 rounded-full bg-primary" />
            <h2 className="font-display text-2xl font-bold">Últimas Notícias</h2>
            {isLoading && <Loader2 className="animate-spin text-muted-foreground" size={16} />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[16/10] rounded-xl" />)
              : latest.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <LeadCaptureForm
            source="newsletter"
            title="Newsletter Vitória News"
            description="Receba as principais notícias do dia, breaking news e análises exclusivas direto no seu email."
          />
        </div>
      </section>

      {/* Trending */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="text-gold" size={24} />
            <h2 className="font-display text-2xl font-bold">Em Alta</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trending.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 glass rounded-xl p-4 hover:glow-primary transition-shadow"
              >
                <span className="font-display text-3xl font-bold text-primary/40 shrink-0 w-10">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <span className="text-xs text-gold font-semibold uppercase">{post.category}</span>
                  <h3 className="font-display font-semibold text-foreground mt-1 line-clamp-2">{post.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 rounded-full bg-gold" />
            <h2 className="font-display text-2xl font-bold">Categorias</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <a
                key={cat}
                href={`/categoria/${cat.toLowerCase()}`}
                className="px-5 py-2.5 rounded-full glass text-sm font-medium text-foreground hover:bg-primary/20 hover:text-gold transition-all"
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
