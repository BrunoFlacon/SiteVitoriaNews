import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import PostCard from "@/components/PostCard";
import { mockPosts } from "@/data/mockPosts";

const Index = () => {
  const featured = mockPosts[0];
  const latest = mockPosts.slice(1);
  const categories = ["Política", "Brasil", "Economia", "Tecnologia", "Mundo"];

  return (
    <>
      {/* SEO */}
      <h1 className="sr-only">Vitória News - Portal de Notícias</h1>

      {/* Hero */}
      <section className="pt-20 pb-8 px-4">
        <div className="container mx-auto">
          <PostCard post={featured} featured />
        </div>
      </section>

      {/* Latest */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 rounded-full bg-primary" />
            <h2 className="font-display text-2xl font-bold">Últimas Notícias</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latest.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </div>
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
            {mockPosts.slice(0, 4).map((post, i) => (
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
