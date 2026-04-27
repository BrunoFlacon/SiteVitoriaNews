import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import PostCard from "@/components/PostCard";
import SEO from "@/components/SEO";
import { useArticles } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";

const categoryMap: Record<string, string> = {
  politica: "Política",
  brasil: "Brasil",
  mundo: "Mundo",
  economia: "Economia",
  tecnologia: "Tecnologia",
};

const CategoryPage = () => {
  const { slug } = useParams();
  const categoryName = categoryMap[slug ?? ""] ?? slug ?? "";
  const { data: posts = [], isLoading } = useArticles({ category: categoryName, limit: 30 });

  return (
    <div className="pt-20 pb-12 px-4">
      <SEO
        title={`${categoryName} — Notícias`}
        description={`Últimas notícias de ${categoryName} no Vitória News.`}
      />
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 rounded-full bg-gold" />
            <h1 className="font-display text-3xl md:text-4xl font-bold">{categoryName}</h1>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[16/10] rounded-xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma notícia nesta categoria ainda.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CategoryPage;
