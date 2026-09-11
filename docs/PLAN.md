# Plano de Integração — Vitória News × Social Canvas Hub

Versão consolidada (decisões aprovadas pelo cliente). Este documento é a fonte única
de verdade para a arquitetura do projeto.

## Decisões aprovadas

| Tópico | Decisão |
| --- | --- |
| Repositórios | Projetos separados. Espelhamento manual no Hub depois. |
| Banco A (público) | Supabase do Hub `ghtkdkauseesambzqfrd` (compartilhado). |
| Banco B (privado) | **Supabase Cloud ativado** — projeto Supabase novo na organização do cliente, gerenciado daqui (RLS, edge functions, secrets, migrations). |
| Acesso ao Hub | Service role do Hub via Edge Function (mais seguro). Anon key não é suficiente porque o Hub não tem policies SELECT públicas hoje. |
| Realtime | **Ambos**: Hub para artigos/posts públicos; Banco B para conteúdo exclusivo, lives privadas, status de assinatura. |
| Login | Email/senha + Google + WhatsApp Magic Link (usa Meta WhatsApp API do Hub). |
| Pagamentos | Stripe, com PIX onde suportado. Campos prontos para migração de chaves quando o cliente fornecer. |
| Grupos WA/TG | Tabela `campaigns` no Banco B + integração futura com Meta WhatsApp API do Hub. |
| Cookies/LGPD | Banner com 4 categorias, consent_logs no Banco B, gating de scripts (pixels, analytics). |

## Arquitetura

```
┌──────────────────────────┐        ┌────────────────────────────┐
│  Banco A — Hub (público) │        │  Banco B — Vitória (Cloud) │
│  ghtkdkauseesambzqfrd    │        │  novo, gerenciado Supabase │
│                          │        │                            │
│  posts/articles          │        │  profiles, user_roles      │
│  categories              │        │  subscribers, plans, subs  │
│  published_posts (redes) │        │  exclusive_articles        │
│  stories_lives (públicas)│        │  exclusive_media           │
│  portal_subscribers      │◄──┐    │  lives_private             │
│  contacts                │   │    │  campaigns, leads          │
└──────────┬───────────────┘   │    │  consent_logs, audit_logs  │
           │ realtime          │    └────────┬───────────────────┘
           │ (anon key, leitura│             │ realtime
           │  via edge fn      │             │ (cliente autenticado)
           │  com service role)│             │
           ▼                   │             ▼
   ┌───────────────────────────┴─────────────────────────────────┐
   │  Vitória News (este projeto)                                │
   │  ┌─────────────────────────┐ ┌──────────────────────────┐   │
   │  │ Frontend público        │ │ Área de assinantes /admin │   │
   │  │ Home, /categoria, /post │ │ /assinantes, /admin       │   │
   │  │ /redes, /grupos         │ │ Paywall server-side (RLS) │   │
   │  │ /newsletter, /lives     │ │ Stripe checkout/webhook   │   │
   │  └─────────────────────────┘ └──────────────────────────┘   │
   └─────────────────────────────────────────────────────────────┘
                              │
                              │ leads (B → Hub portal_subscribers)
                              └────────────────────────────────────┘
```

## Estrutura do Banco B (Supabase)

### Tabelas — Sprint 1 (foco da execução atual)

- `profiles(user_id, display_name, avatar_url, phone, locale, ...)` — vinculada a `auth.users`.
- `user_roles(user_id, role)` com enum `app_role: admin | editor | subscriber | user` + função `has_role()` SECURITY DEFINER.
- `subscribers(user_id, plan_id, status, started_at, expires_at, stripe_customer_id, stripe_subscription_id)` — espelho local da assinatura.
- `subscription_plans(id, code, name, price_cents, currency, interval, perks jsonb, is_active)` — campos placeholder para Stripe.
- `campaigns(id, slug, name, channel, whatsapp_url, telegram_url, audience, utm jsonb, is_active, starts_at, ends_at)`.
- `leads(id, email, name, phone, source, campaign_id, consent jsonb, hub_synced_at, ip_hash, ua_hash)`.
- `lead_events(id, lead_id, type, payload jsonb)` — clicks, conversões, opt-in.
- `consent_logs(id, user_id, fingerprint, categories jsonb, version, ip_hash, ua_hash)` — LGPD.
- `audit_logs(id, actor_id, action, entity, entity_id, payload jsonb)`.
- `exclusive_articles`, `exclusive_media`, `lives_private` — Sprint 2 (paywall).

Todas com RLS habilitada. Policies usando `has_role()` para evitar recursão.

### Edge Functions — Sprint 1

| Função | Tipo | Auth | Responsabilidade |
| --- | --- | --- | --- |
| `hub-list-posts` | público | verify_jwt=false | Lista posts/artigos públicos do Hub via service role; cache 60s. |
| `hub-get-post` | público | verify_jwt=false | Detalhe de um post do Hub por slug/id. |
| `hub-list-categories` | público | verify_jwt=false | Categorias do Hub. |
| `hub-list-published-posts` | público | verify_jwt=false | Feed `published_posts` (redes sociais agregadas) do Hub. |
| `hub-list-lives` | público | verify_jwt=false | `stories_lives` públicas do Hub. |
| `newsletter-subscribe` | público | verify_jwt=false | Valida (zod), grava em `leads`, envia para `portal_subscribers` do Hub, dispara double opt-in. |
| `lead-capture` | público | verify_jwt=false | Variante para grupos: grava lead, registra `lead_events`, retorna invite link da campanha. |
| `consent-log` | público | verify_jwt=false | Registra escolhas LGPD em `consent_logs`. |

Secrets necessárias (cadastradas no painel do Supabase antes do deploy):
`HUB_SUPABASE_URL`, `HUB_SUPABASE_SERVICE_ROLE_KEY`, `HCAPTCHA_SECRET` (opcional na fase 1).

### Realtime

- **Banco A (Hub)**: cliente assina `posts` (e/ou `articles` quando o Hub tiver) com a anon key do Hub para invalidar React Query da home/categorias. Como a leitura final passa por edge function, o evento serve só de gatilho.
- **Banco B**: cliente autenticado assina `exclusive_articles`, `lives_private`, `subscribers` (próprio user) para refletir paywall e novo conteúdo exclusivo em tempo real.

## Frontend — Sprint 1

### Hooks
`useArticles`, `useArticle`, `useCategoryArticles`, `useTrending`, `useLives`,
`usePublishedPosts` (redes), `useCampaigns`, `useConsent`, `useAuth` (Banco B),
`useSubscriberAccess` (Sprint 2).

### Rotas públicas
- `/` — destaque + últimas + em alta (hooks reais).
- `/categoria/:slug` — listagem por categoria.
- `/post/:slug` — artigo + JSON-LD `NewsArticle` + meta dinâmica.
- `/redes` — feed agregado de `published_posts` com filtro por plataforma.
- `/grupos` — campanhas ativas; formulário de captura antes de revelar invite link.
- `/newsletter` — landing + formulário double opt-in + benefícios.
- `/lives` — agenda de lives e podcasts públicos.
- `/podcasts` — listagem de podcasts.
- `/termos`, `/privacidade`, `/contato` — já existem; ajustar referências.

### SEO
- `<Helmet>` em cada rota com title/description/OG.
- JSON-LD: `NewsArticle` em `/post/:slug`; `ItemList` na home; `BreadcrumbList` em categorias; `Organization` global.
- Sitemap gerado por edge function (Sprint 2).

### LGPD / Cookies
- `<CookieBanner />` com categorias: necessário (sempre on), analytics, marketing, terceiros.
- Persistência em localStorage + `consent_logs` via edge function.
- Hook `useConsent()` controla scripts (Meta Pixel, GA, TikTok Pixel) — só carregam se categoria correspondente estiver aceita.

### Newsletter / Lead Capture
- `<LeadCaptureForm />` reutilizável: nome, email, telefone (opcional), checkbox LGPD.
- Validação client-side com Zod; rate limit + validação server-side na edge function.
- Após sucesso: registra em `leads` (Banco B) + sincroniza com `portal_subscribers` (Hub).
- Suporte a `?campaign=slug` para vincular ao registro de campanha e capturar UTM.

## Sprint 2+ (próximos passos, fora desta execução)

- Auth completo (email/senha + Google + WhatsApp magic link).
- Paywall server-side com RLS em `exclusive_*` checando `has_role('subscriber')`.
- Integração Stripe (`enable_stripe_payments`, planos, webhook).
- Página `/assinantes` com Reportagens Exclusivas, Breaking, Urgentes, Lives, Podcasts.
- Admin (`/admin`) para CRUD de campanhas, planos, assinantes, logs.
- Edge functions: `stripe-checkout`, `stripe-webhook`, `sitemap`, `wa-magic-link`.
- Bridge realtime Hub → Banco B para sync de breaking news.

## Itens fora do escopo agora

- Reescrita do painel do Hub.
- Comentários, fórum, super-chat ao vivo.
- App mobile nativo.