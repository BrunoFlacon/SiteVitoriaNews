-- ============================================================
-- Migration: exclusive_articles, exclusive_media, lives_private
-- + seed subscription_plans
-- ============================================================

-- ---------- exclusive_articles ----------
CREATE TABLE public.exclusive_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_url TEXT,
  category TEXT NOT NULL DEFAULT 'exclusivo',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exclusive_articles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_exclusive_articles_updated_at BEFORE UPDATE ON public.exclusive_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_exclusive_articles_published ON public.exclusive_articles(is_published, published_at DESC);

-- ---------- exclusive_media ----------
CREATE TABLE public.exclusive_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.exclusive_articles(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'document', 'gallery')),
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exclusive_media ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_exclusive_media_article ON public.exclusive_media(article_id);

-- ---------- lives_private ----------
CREATE TABLE public.lives_private (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'live', 'ended', 'canceled')),
  stream_url TEXT,
  chat_enabled BOOLEAN NOT NULL DEFAULT true,
  is_visible BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lives_private ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_lives_private_updated_at BEFORE UPDATE ON public.lives_private
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_lives_private_schedule ON public.lives_private(scheduled_at DESC) WHERE is_visible = true;

-- ---------- RLS Policies ----------

-- exclusive_articles: somente assinantes ativos leem; admins/editors escrevem
CREATE POLICY "exclusive_articles_subscriber_read"
ON public.exclusive_articles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'editor'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.subscribers s
    WHERE s.user_id = auth.uid()
      AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  )
);
CREATE POLICY "exclusive_articles_admin_editor_write"
ON public.exclusive_articles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'editor'::app_role));

-- exclusive_media: mesmo gate dos artigos
CREATE POLICY "exclusive_media_subscriber_read"
ON public.exclusive_media
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'editor'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.subscribers s
    WHERE s.user_id = auth.uid()
      AND s.status IN ('active', 'trialing')
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  )
);
CREATE POLICY "exclusive_media_admin_editor_write"
ON public.exclusive_media
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'editor'::app_role));

-- lives_private: somente assinantes ativos veem lives visíveis; admins/editors gerenciam
CREATE POLICY "lives_private_subscriber_read"
ON public.lives_private
FOR SELECT
TO authenticated
USING (
  is_visible = true
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'editor'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.subscribers s
      WHERE s.user_id = auth.uid()
        AND s.status IN ('active', 'trialing')
        AND (s.current_period_end IS NULL OR s.current_period_end > now())
    )
  )
);
CREATE POLICY "lives_private_admin_editor_write"
ON public.lives_private
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'editor'::app_role));

-- Cliente nunca grava direto nessas tabelas (somente via service role / edge functions)
CREATE POLICY "exclusive_articles_no_client_write"
ON public.exclusive_articles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "exclusive_media_no_client_write"
ON public.exclusive_media
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "lives_private_no_client_write"
ON public.lives_private
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- ---------- Seed: planos de assinatura ----------
INSERT INTO public.subscription_plans (code, name, description, price_cents, currency, interval, perks, sort_order)
VALUES
  (
    'mensal',
    'Premium Mensal',
    'Acesso completo ao conteúdo exclusivo — mensal.',
    1970,
    'BRL',
    'month',
    '["Acesso a todas as reportagens exclusivas", "Lives privadas de assinantes", "Podcasts e análises aprofundadas", "Sem anúncios", "Cancele quando quiser"]'::jsonb,
    1
  ),
  (
    'anual',
    'Premium Anual',
    'Acesso completo ao conteúdo exclusivo — anual (2 meses grátis).',
    19700,
    'BRL',
    'year',
    '["Tudo do plano mensal", "2 meses grátis", "Desconto exclusivo", "Suporte prioritário", "Cancele quando quiser"]'::jsonb,
    2
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  currency = EXCLUDED.currency,
  interval = EXCLUDED.interval,
  perks = EXCLUDED.perks,
  sort_order = EXCLUDED.sort_order;