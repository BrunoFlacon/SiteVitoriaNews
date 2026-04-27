import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  category: string;
  created_at: string;
  slug?: string;
}

const PostCard = ({ post, featured = false }: { post: Post; featured?: boolean }) => {
  const date = new Date(post.created_at).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const href = `/post/${post.slug ?? post.id}`;

  if (featured) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative rounded-xl overflow-hidden glass glow-primary"
      >
        <Link to={href} className="block">
          <div className="relative aspect-[16/9] md:aspect-[21/9]">
            <img
              src={post.image_url || "/placeholder.svg"}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/80 text-primary-foreground mb-3 uppercase tracking-wider">
                {post.category}
              </span>
              <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground leading-tight mb-3">
                {post.title}
              </h2>
              <p className="text-sm text-muted-foreground line-clamp-2 max-w-2xl">
                {post.content?.replace(/<[^>]*>/g, "").slice(0, 200)}
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <Clock size={14} />
                <time dateTime={post.created_at}>{date}</time>
              </div>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group glass rounded-xl overflow-hidden hover:glow-primary transition-shadow duration-300"
    >
      <Link to={href} className="block">
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={post.image_url || "/placeholder.svg"}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="p-5">
          <span className="text-xs font-semibold text-gold uppercase tracking-wider">
            {post.category}
          </span>
          <h3 className="font-display text-lg font-bold text-foreground mt-2 mb-2 line-clamp-2 group-hover:text-gold-light transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {post.content?.replace(/<[^>]*>/g, "").slice(0, 150)}
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <Clock size={12} />
            <time dateTime={post.created_at}>{date}</time>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

export default PostCard;
