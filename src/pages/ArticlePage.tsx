import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Share2, Facebook, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import PostCard from "@/components/PostCard";
import { mockPosts } from "@/data/mockPosts";

const ArticlePage = () => {
  const { id } = useParams();
  const post = mockPosts.find((p) => p.id === id);
  const related = mockPosts.filter((p) => p.id !== id).slice(0, 3);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <p className="text-muted-foreground">Notícia não encontrada.</p>
      </div>
    );
  }

  const date = new Date(post.created_at).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-6">
          <ArrowLeft size={16} />
          Voltar
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/80 text-primary-foreground mb-4 uppercase tracking-wider">
            {post.category}
          </span>

          <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="font-medium text-gold">Redação Vitória News</span>
            <span className="flex items-center gap-1"><Clock size={14} />{date}</span>
          </div>

          {post.image_url && (
            <div className="rounded-xl overflow-hidden mb-8">
              <img src={post.image_url} alt={post.title} className="w-full h-auto object-cover" />
            </div>
          )}

          <div className="prose prose-invert max-w-none text-foreground/90 leading-relaxed text-lg mb-8">
            <p>{post.content}</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
          </div>

          {/* Share */}
          <div className="flex items-center gap-3 py-6 border-t border-border">
            <Share2 size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Compartilhar:</span>
            <button className="p-2 rounded-full glass hover:bg-primary/20 transition-colors text-muted-foreground hover:text-foreground">
              <Facebook size={16} />
            </button>
            <button className="p-2 rounded-full glass hover:bg-primary/20 transition-colors text-muted-foreground hover:text-foreground">
              <Twitter size={16} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="container mx-auto mt-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 rounded-full bg-primary" />
            <h2 className="font-display text-2xl font-bold">Notícias Relacionadas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
};

export default ArticlePage;
