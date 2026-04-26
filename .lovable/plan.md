## atualize o Plano de Integração — Vitória News × Social Canvas Hub

Vamos transformar o Vitória News no front público + portal de assinantes do ecossistema, usando o **mesmo banco Supabase** que o Social Canvas Hub (Opção A confirmada).

Banco compartilhado identificado:

- URL: `https://ghtkdkauseesambzqfrd.supabase.co`
- Tabelas relevantes que já existem: `articles`, `published_posts`, `scheduled_posts`, `stories_lives`, `social_accounts`, `portal_subscribers`, `contacts`, `profiles` (com `role`).

### Fase 1 — Conexão ao Supabase compartilhado   para o site publico crie um banco de dados novoe faça toda a estrutura do banco de dados no novo banco e tudo que desejarmos publicar no site a dashboard trabalhará integrado ao banco de dados ghtkdkauseesambzqfrd do painel interno para publicar os dados artigos que se tonarão públicos junto com a área privada para assinates que trabalhará integrada ao painel hub de publicação quando fizer a integração mude os arquivos deste projeto para o mesmo projeto da dashboard do Social Canvas Hub numa pasta diferente chmada frontend dentro do projeto do Social Canvas Hub .....

###  Crie a área de assinantes e também a pagina de newsleter gratuita faça os tratramento em todo o site contra xss ataques sql em todos os formulários e campos com entrada de dados criptografe todos os dados enviados para o servidor  faça um protocolo de segurança de informações e prevenção contra ataques de hackers dados sensíveis no site criptografe  não permita que burlem o nosso paywall projete o site para todos  os tipos de telas e plataformas possiveis mobiles e pc  crie uma area administrativa que será responsável pela infraestrutura de pagamentos cadastros da newsletter atendimento vip ao assinante responsável pelas campanhas de marketing para aquisição de assinaturas novas e pessoas interessadas em assinar gratuitamente, respostas de comentários superchats, interação com o publico. esta area administrativa todos os dados serão criptografados e os formulários será protegido contra os ataques  xss e sql e outros tipos de ataques implemente o csp em todo o siete e na area de assinantes e area administrativa que será interligada no painel do social hub....

### Criar `src/integrations/supabase/client.ts` no Vitória News apontando para ghtkdkauseesambzqfrd`.supabase.co` com a mesma `anon key` pública.

1. Copiar/gerar `src/integrations/supabase/types.ts` baseando-se nos types do Hub.
2. Substituir `mockPosts` por hooks React Query que leem de `articles` (notícias publicadas).

Nota: como o site precisa apenas **ler** dados públicos, não há necessidade de autenticação compartilhada — usamos a anon key. Para a área de assinantes haverá login próprio (mesma `auth.users`, então a sessão é compartilhada).

### Fase 2 — Hooks de dados e substituição dos mocks

Criar:

- `src/hooks/useArticles.ts` → lista paginada de `articles` filtrada por `published = true`.
- `src/hooks/useArticle.ts` → artigo único por `slug` ou `id` + SEO dinâmico.
- `src/hooks/useCategoryArticles.ts` → filtro por categoria.
- `src/hooks/useTrending.ts` → top artigos por views/recência.
- `src/hooks/useLives.ts` → consome `stories_lives` (lives + podcasts agendados/ativos).

Substituir `mockPosts` em `Index.tsx`, `ArticlePage.tsx`, `CategoryPage.tsx`. Adicionar Skeletons e estados de erro/empty.

### Fase 3 — Realtime (publicação aparece instantaneamente)

Subscription Supabase Realtime nas tabelas `articles` e `stories_lives`:

- Quando o Hub publica/atualiza, o site invalida o cache do React Query e atualiza a UI sem reload.

### Fase 4 — Página unificada de redes sociais (`/redes`)

Nova rota pública agregando o que o Hub publicou em todas as redes:

- Lê `published_posts` (posts já enviados pelo Hub para Instagram, X, Threads, Facebook, YouTube, TikTok, LinkedIn, WhatsApp, Telegram etc.).
- Filtros por plataforma + busca.
- Cada card mostra plataforma, thumbnail, legenda e link nativo da rede.
- Realtime para refletir novos disparos.

### Fase 5 — Área de Assinantes (`/assinantes`)

**Auth**: usa o mesmo `auth.users` do Hub. Login com email/senha + Google (Lovable Cloud).

Na home logada, separadas em abas:

1. **Reportagens Exclusivas** — `articles` com flag `is_exclusive = true`.
2. **Breaking News** — `articles` com flag `is_breaking = true`, ordenadas por `created_at` desc, com badge animada.
3. **Matérias Urgentes** — `articles` com `priority = 'urgent'`.
4. **Lives Exclusivas** — `stories_lives` com `audience = 'subscribers'`.
5. **Podcasts Exclusivos** — `stories_lives` com `type = 'podcast'` + `audience = 'subscribers'`.

**Gating**: hook `useSubscriberAccess()` checa `portal_subscribers.plan_type = 'paid'` ou role em `profiles`. Se não-assinante → CTA de upgrade.

**Migration nova** (necessária pois esses flags ainda não existem em `articles`):

```sql
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS is_exclusive boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_breaking boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',  -- normal | urgent
  ADD COLUMN IF NOT EXISTS audience text DEFAULT 'public';   -- public | subscribers

ALTER TABLE stories_lives
  ADD COLUMN IF NOT EXISTS audience text DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'live'; -- live | podcast
```

Acompanha **policies de RLS**: leitura pública apenas onde `audience = 'public' AND is_exclusive = false`; leitura para assinantes via `has_role()` ou `EXISTS portal_subscribers WHERE plan_type='paid'`.

### Fase 6 — Captação de leads + grupos WhatsApp/Telegram

Componente `<LeadCaptureForm />` reutilizável no site, com opção de propósito:

- **Grupos públicos** (botões "Entrar no WhatsApp" / "Entrar no Telegram") → modal com formulário (nome + email + telefone), grava em `portal_subscribers` com `plan_type='free'` e `metadata.source = 'public_group_whatsapp'`, depois redireciona para o link de convite do grupo.
- **Grupos VIP / assinatura** → mesmo fluxo, mas leva ao checkout (Fase 8) e só recebe o link após confirmação de pagamento.

Tabela complementar nova:

```sql
CREATE TABLE IF NOT EXISTS subscriber_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,        -- 'whatsapp' | 'telegram'
  tier text NOT NULL,            -- 'free' | 'paid'
  name text NOT NULL,
  invite_url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

Página `/grupos` lista grupos públicos com CTAs; grupos VIP só aparecem para usuários com assinatura ativa.

### Fase 7 — Tracking de campanhas (UTM) e Pixel

- Captura de `utm_source/medium/campaign/content` ao chegar no site, persistida em `localStorage` e enviada com cada `portal_subscribers.insert` (em `metadata`).
- Já existe estrutura de pixel no Hub (`pixel_tracking_columns.sql`) — vamos reaproveitar para integrar Meta Pixel / Google Ads / TikTok Pixel via env vars (publicáveis), prontos para anunciar.

### Fase 8 — Assinaturas pagas (precisa decisão antes de executar)

Para "ofertas de assinaturas de grupos exclusivos" precisamos de pagamentos. Antes de codar, durante a execução vou perguntar:

- Modelo de níveis (Free / Lead / Paid).
- Provedor de pagamento — recomendação inicial **Stripe (built-in Lovable)** por ser ideal para conteúdo digital/assinaturas; alternativa Paddle.

Independente da escolha, a estrutura prevista é:

- Tabela `subscription_plans` (nome, preço, intervalo, benefícios).
- Edge function `create-checkout` + `webhook` para atualizar `portal_subscribers.plan_type`.
- Página `/assinar` com cards dos planos.

### Fase 9 — SEO, performance, legais

- SEO dinâmico em `ArticlePage` (title, description, OG, JSON-LD `NewsArticle`).
- `/sitemap.xml` gerado por edge function lendo `articles`.
- Termos / Privacidade / Contato já existentes — apenas ajustar texto para mencionar Social Canvas Hub.

### Fase 10 — Ativação do Lovable Cloud

Necessário para edge functions, secrets de pagamento, sitemap e (se aplicável) login Google. Será o primeiro passo da execução.

---

### Arquivos / mudanças resumidas

**Novos**: `src/integrations/supabase/client.ts`, `types.ts`, `src/hooks/useArticles.ts`, `useArticle.ts`, `useCategoryArticles.ts`, `useTrending.ts`, `useLives.ts`, `useSubscriberAccess.ts`, `src/pages/RedesPage.tsx`, `src/pages/AssinantesPage.tsx` (com sub-rotas Exclusivas/Breaking/Urgentes/Lives/Podcasts), `src/pages/GruposPage.tsx`, `src/pages/AssinarPage.tsx`, `src/pages/Login.tsx`, `src/components/LeadCaptureForm.tsx`, `src/components/SubscriberGuard.tsx`, `src/components/BreakingNewsBanner.tsx`.

**Modificados**: `src/App.tsx` (rotas + AuthProvider), `Header.tsx` (links Redes / Assinantes / Grupos / Login), `Index.tsx`, `ArticlePage.tsx`, `CategoryPage.tsx`, `Footer.tsx`, `index.html` (pixels), `mockPosts.ts` (removido).

**Migrations**: flags em `articles` e `stories_lives`, tabela `subscriber_groups`, tabela `subscription_plans` (após decisão de pagamentos), policies RLS coerentes.

### Decisões que serão pedidas ao iniciar a execução

1. Modelo de níveis (Free / Free+Lead / Free+Lead+Paid).
2. Provedor de pagamento (recomendação: Stripe built-in).
3. Captação de leads em grupos públicos: formulário antes do link, link direto, ou ambos.
4. Login da área de assinantes: email/senha + Google (padrão) ou outro.

### Fora do escopo agora

- Reescrever o painel admin (continua no Social Canvas Hub).
- Comentários / fórum de assinantes.
- App mobile nativo.