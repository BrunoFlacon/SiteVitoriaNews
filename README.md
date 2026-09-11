# Vitória News

Portal de notícias — [vitoria.news](https://vitoria.news).

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres com RLS, Edge Functions)
- React Router, React Query, Helmet (SEO), DOMPurify

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (porta 8080) |
| `npm run build` | Build de produção em `dist/` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (jsdom) |

> No Windows use `NODE_OPTIONS=--max_old_space_size=4096` para o build (cache npm).

## Arquitetura

O projeto consome notícias de dois bancos Supabase:

- **Banco A — Hub (Social Canvas)**: posts/artigos públicos, categorias, lives, grupos. Acesso via edge functions com service role (a anon key do Hub não tem policies públicas).
- **Banco B — Supabase do site**: dados próprios — profiles, assinaturas, planos, campanhas, leads, consentimento LGPD e logs de auditoria. RLS habilitada em todas as tabelas, com `has_role()` SECURITY DEFINER.

O plano de integração completo (decisões aprovadas, tabelas, edge functions, rotas) está em [`docs/PLAN.md`](docs/PLAN.md).

## Edge Functions (Banco B)

| Função | Status | Descrição |
| --- | --- | --- |
| `hub-list-posts` | deployada | Lista posts públicos do Hub via service role; cache 60s |
| `hub-get-post` | pendente de deploy | Detalhe de post do Hub por slug/id |
| `hub-list-categories` | pendente | Categorias do Hub |
| `hub-list-published-posts` | pendente de deploy | Feed `published_posts` (redes) do Hub |
| `hub-list-lives` | pendente de deploy | Lives/podcasts públicos do Hub |
| `hub-list-exclusive-posts` | pendente de deploy | Exclusivos para assinantes (autenticada) |
| `lead-capture` | deployada | Captura de lead + `lead_events` (POST) |
| `consent-log` | deployada | Registro LGPD em `consent_logs` (POST) |
| `newsletter-subscribe` | pendente | Newsletters com double opt-in |
| `rss-xml` / `atom-xml` / `sitemap-xml` | deployadas | Feeds e sitemap |

Deploy via Supabase CLI (`supabase functions deploy <nome>`). Requer as secrets
`HUB_SUPABASE_URL` e `HUB_SUPABASE_SERVICE_ROLE_KEY` configuradas no projeto.

## Deploy do site

GitHub Actions (`.github/workflows/deploy.yml`) publica o build em GitHub Pages
com domínio próprio `vitoria.news`. A cada push na `main` o deploy roda
(`Setup job` → `Build` → `Upload artifact` → `Deploy Pages`).

## Login / Assinantes

- Auth: email/senha + Google OAuth via Supabase Auth (GoTrue).
- `/assinantes`: conteúdo exclusivo validado server-side (JWT + assinatura ativa).
- Planos: tabela `subscription_plans` (view pública `subscription_plans_public`).
  A integração com Stripe/PIX está prevista no Sprint 2 (ver `docs/PLAN.md`).

## LGPD / Cookies

`<CookieBanner />` com 4 categorias (necessário, analytics, marketing, terceiros).
As escolhas vão para `consent_logs` via edge function e controlam o gating de
scripts de terceiros (`useConsent`).