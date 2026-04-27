import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  author?: string;
  category?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

const SITE_NAME = "Vitória News";
const SITE_URL = typeof window !== "undefined" ? window.location.origin : "https://vitoria.news";

const SEO = ({
  title,
  description,
  canonical,
  image,
  type = "website",
  publishedTime,
  author,
  category,
  jsonLd,
  noindex,
}: SEOProps) => {
  const fullTitle = title.endsWith(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const safeDesc = (description ?? "Notícias políticas, brasil e mundo. Cobertura editorial premium.").slice(0, 158);
  const url = canonical ?? (typeof window !== "undefined" ? window.location.href : SITE_URL);
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={safeDesc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={safeDesc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      {image && <meta property="og:image" content={image} />}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {author && <meta property="article:author" content={author} />}
      {category && <meta property="article:section" content={category} />}

      {/* Twitter */}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={safeDesc} />
      {image && <meta name="twitter:image" content={image} />}

      {/* JSON-LD */}
      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
