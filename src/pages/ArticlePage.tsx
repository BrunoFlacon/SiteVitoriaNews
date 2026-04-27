import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Share2, Facebook, Twitter, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import PostCard from "@/components/PostCard";
import SEO from "@/components/SEO";
import { useArticle, useArticles } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";

const ArticlePage = () => {
  const { id } = useParams();
  const { data: post, isLoading } = useArticle(id);
  const { data: relatedAll = [] } = useArticles({ limit: 4 });
  const related = relatedAll.filter((p) => p.id !== post?.id).slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 container mx-auto max-w-3xl">
        <Skeleton className="h-10 w-24 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="aspect-[16/9] w-full mb-8 rounded-xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <SEO title="Notícia não encontrada" noindex />
        <p className="text-muted-foreground">Notícia não encontrada.</p>
      </div>
    );
  }

  const date = new Date(post.created_at).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt,
    image: post.image_url ? [post.image_url] : undefined,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.created_at,
    author: { "@type": "Person", name: post.author ?? "Redação Vitória News" },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: "Vitória News",
      logo: { "@type": "ImageObject", url: `${window.location.origin}/logo.png` },
    },
    mainEntityOfPage: window.location.href,
    articleSection: post.category,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: window.location.origin },
      {
        "@type": "ListItem",
        position: 2,
        name: post.category,
        item: `${window.location.origin}/categoria/${post.category_slug}`,
      },
      { "@type": "ListItem", position: 3, name: post.title, item: window.location.href },
    ],
  };

  return (
    <article className="pt-20 pb-12 px-4">
      <SEO
        title={post.title}
        description={post.excerpt}
        type="article"
        image={post.image_url ?? undefined}
        publishedTime={post.published_at ?? post.created_at}
        author={post.author ?? "Redação Vitória News"}
        category={post.category}
        jsonLd={[articleJsonLd, breadcrumb]}
      />

      <div className="container mx-auto max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-6">
          <ArrowLeft size={16} /> Voltar
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            to={`/categoria/${post.category_slug}`}
            className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/80 text-primary-foreground mb-4 uppercase tracking-wider"
          >
            {post.category}
          </Link>

          <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="font-medium text-gold">{post.author ?? "Redação Vitória News"}</span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {date}
            </span>
          </div>

          {post.image_url && (
            <div className="rounded-xl overflow-hidden mb-8">
              <img src={post.image_url} alt={post.title} className="w-full h-auto object-cover" />
            </div>
          )}

          <div
            className="prose prose-invert max-w-none text-foreground/90 leading-relaxed text-lg mb-8"
            dangerouslySetInnerHTML={{
              __html: post.content || `<p>${post.excerpt}</p>`,
            }}
          />

          <div className="flex items-center gap-3 py-6 border-t border-border">
            <Share2 size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Compartilhar:</span>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full glass hover:bg-primary/20 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Compartilhar no Facebook"
            >
              <Facebook size={16} />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full glass hover:bg-primary/20 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Compartilhar no Twitter/X"
            >
              <Twitter size={16} />
            </a>
          </div>
        </motion.div>
      </div>

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
