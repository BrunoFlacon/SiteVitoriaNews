import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import PostCard from "@/components/PostCard";
import { mockPosts } from "@/data/mockPosts";

const CategoryPage = () => {
  const { slug } = useParams();
  const categoryMap: Record<string, string> = {
    politica: "Política",
    brasil: "Brasil",
    mundo: "Mundo",
    economia: "Economia",
    tecnologia: "Tecnologia",
  };
  const categoryName = categoryMap[slug || ""] || slug || "";
  const posts = mockPosts.filter(
    (p) => p.category.toLowerCase() === categoryName.toLowerCase()
  );

  return (
    <div className="pt-20 pb-12 px-4">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-8 rounded-full bg-gold" />
            <h1 className="font-display text-3xl md:text-4xl font-bold">{categoryName}</h1>
          </div>

          {posts.length === 0 ? (
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
