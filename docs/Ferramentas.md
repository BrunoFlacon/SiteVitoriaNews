# Ferramentas Implantadas — Vitória News

**Versão:** 1.0 · **Data:** 12/09/2026 · **Status:** Em produção (vitoria.news)

Documento de referência de todas as ferramentas, serviços e integrações implantadas
no projeto, com o papel de cada uma e como estão configuradas.

---

## 1. Infraestrutura de Hospedagem e CI/CD

| Ferramenta | Papel | Detalhes |
|---|---|---|
| **GitHub** (repo `BrunoFlacon/SiteVitoriaNews`) | Versionamento e repositório de origem | Branch `main`; histórico com todos os commits de migração e deploy |
| **GitHub Actions** (`.github/workflows/deploy.yml`) | CI/CD automático | Todo push em `main` dispara build `vite build` + deploy para GitHub Pages; build injeta `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` do **FontEndSite** (corrigido em 12/09/2026 — apontava ao projeto antigo `kpkeelxdyryufmevhhhb`) |
| **GitHub Pages** | Hospedagem do frontend estático | URL pública: `https://vitoria.news` (domínio customizado) |
| **Supabase CLI** (v2.109.1) | Deploy local das edge functions | `supabase functions deploy --no-verify-jwt` |

---

## 2. Frontend — Stack

| Ferramenta | Versão | Papel |
|---|---|---|
| **React** | 18.3.1 | Biblioteca UI (SPA) |
| **Vite** | 5.4.19 | Build/bundler; code-splitting com `manualChunks` (vendor-react, vendor-framer, vendor-recharts, vendor-supabase) |
| **TypeScript** | 5.8.3 | Tipagem estática |
| **Tailwind CSS** | 3.4.17 | Estilização utilitária + `tailwindcss-animate`, `@tailwindcss/typography` |
| **react-router-dom** | 6.30.1 | Roteamento (13 rotas, lazy loading por página) |
| **@tanstack/react-query** | 5.83.0 | Estado de dados do servidor (cache, staleTime 60s, invalidação realtime) |
| **shadcn/ui + Radix UI** | — | Biblioteca de componentes acessíveis (dialog, tabs, switch, checkbox, toast...) |
| **framer-motion** | 12.38.0 | Animações de entrada/transição |
| **react-helmet-async** | 3.0.0 | Gestão de `<head>`/SEO por página |
| **zod** | 3.25.76 | Validação de formulários e payloads |
| **DOMPurify** | 3.4.5 | Sanitização do HTML dos artigos do Hub (allowlist estrita) |
| **@supabase/supabase-js** | 2.104.1 | Cliente Supabase (auth, RLS reads, invocação de edge functions) |
| **sonner** | 1.7.4 | Toasts de feedback |
| **lucide-react** | 0.462.0 | Ícones |
| **date-fns** | 3.6.0 | Formatação de datas |
| **next-themes** | 0.3.0 | Tema (dark por padrão) |
| **embla-carousel-react / recharts / react-hook-form / input-otp / cmdk / vaul** | — | Acervo de UI padrão (utilizados conforme componentes) |
| **Vitest + Testing Library + Playwright** | — | Testes (unit + e2e configurados) |

### Build e segurança do frontend
- **CSP restritiva** no `index.html`: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' https: data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co...; frame-ancestors 'none'`.
- **SEO técnico**: JSON-LD (ItemList, NewsMediaOrganization, NewsArticle, BreadcrumbList), OpenGraph, Twitter Cards, canonical, feeds RSS/Atom linkados no head.
- Requisições ao Hub **sempre via edge functions** — nunca expõem a service role ao cliente.

---

## 3. Backend — Supabase (FontEndSite `iqhxakycirzsrumpygwn`)

### 3.1 Serviços utilizados
| Serviço | Uso |
|---|---|
| **Auth** | Email/senha + OAuth Google (signUp, signInWithPassword, signInWithOAuth, sessão persistente com refresh automático) |
| **Postgres (RLS)** | Todas as tabelas de negócio protegidas por políticas; grants column-level em `campaigns`; view `subscription_plans_public` com `security_invoker` |
| **Edge Functions (Deno)** | 12 funções em `supabase/functions/` — ver seção 5 |
| **Realtime** | Canal opcional para invalidação de queries (hub via VITE_HUB_*); `campaigns`/`subscribers` retirados do publication por segurança |

### 3.2 Segurança de dados
- **Service role** usada **apenas dentro de edge functions** (nunca no cliente).
- **Clientes bloqueados** (RLS restritiva) para INSERT/UPDATE/DELETE em `subscribers`,
  `leads`, `consent_logs`, `audit_logs`; `user_roles` restrito a admin.
- URLs de convite de grupos (`whatsapp_url`, `telegram_url`) não saem do Postgres para o
  cliente — a edge `lead-capture` as devolve **apenas após cadastro válido**.
- Hash SHA-256 de IP/User-Agent antes de gravar (LGPD).
- Todas as functions com `verify_jwt = false`, validação zod e rate-limit (5/min/IP).

---

## 4. Hub Editorial (Social Canvas `ghtkdkauseesambzqfrd`)

| Item | Detalhe |
|---|---|
| **Papel** | Banco editorial central; alimenta o portfólio de conteúdo do site |
| **Tabelas esperadas** | `articles` **ou** `posts`, `published_posts`, `stories_lives`, `categories`, `portal_subscribers` |
| **Acesso** | Somente por edge functions (service role), com timeout de 3s (`fetchWithTimeout` + AbortController) e detecção de indisponibilidade (`isHubUnavailable`) |
| **Failover** | `tryFromTables` tenta `articles` → `posts` até achar a primeira que responde |
| **Estratégia atual** | Projeto em restore prolongado (serviços UNHEALTHY, REST 504) → site opera degradado (`hub_empty: true`) sem erros no dashboard |
| **Sincronização de leads** | `portal_subscribers.upsert` best-effort com `hub_synced` honesto na resposta |

---

## 5. Catálogo de Edge Functions (12 deployadas + 2 shared)

| Função | Endpoint público | Função |
|---|---|---|
| `hub-list-posts` | `GET /functions/v1/hub-list-posts` | Lista posts do Hub |
| `hub-get-post` | `GET /functions/v1/hub-get-post?id=\|slug=` | Artigo individual |
| `hub-list-published-posts` | `GET /functions/v1/hub-list-published-posts` | Feed unificado de redes sociais |
| `hub-list-lives` | `GET /functions/v1/hub-list-lives?type=live\|podcast` | Lives/podcasts |
| `hub-list-categories` | `GET /functions/v1/hub-list-categories` | Categorias do Hub |
| `hub-list-exclusive-posts` | `GET /functions/v1/hub-list-exclusive-posts` | **Gated server-side**: JWT + assinatura ativa |
| `lead-capture` | `POST /functions/v1/lead-capture` | Captura de leads (newsletter/grupos/paywall) + reveal de links |
| `newsletter-subscribe` | `POST /functions/v1/newsletter-subscribe` | Inscrição newsletter + sync Hub |
| `consent-log` | `POST /functions/v1/consent-log` | Registro de consentimento LGPD |
| `rss-xml` | `GET /functions/v1/rss-xml` | RSS 2.0 |
| `atom-xml` | `GET /functions/v1/atom-xml` | Atom feed |
| `sitemap-xml` | `GET /functions/v1/sitemap-xml` | XML sitemap |
| `_shared/cors.ts` | — | CORS + helpers `jsonResponse`/`errorResponse` |
| `_shared/hub.ts` | — | Cliente Hub com timeout 3s, `isHubUnavailable`, `tryFromTables` |

### Notas de operação do gateway
- `application/rss+xml` e `application/atom+xml` são preservados pelo Edge Gateway do
  Supabase; `application/xml` (sitemap) é reescrito para `text/plain` (limitação
  conhecida do gateway — o corpo XML permanece válido).
- 4xx legítimos do gateway: 400 (payload/params inválidos), 401 (sem/sessão inválida),
  403 (sem assinatura), 405 (GET em POST-only), 404 (post inexistente com Hub OK).

---

## 6. Banco de Dados — Migrations (11)

Ver `docs/PRD.md → Seção 6` para a tabela completa de migrations. Resumo:

1. **Esqueleto business** — enums, perfis, roles, planos, assinantes, campanhas, leads, eventos, consentimento, auditoria, trigger de novo usuário.
2. **Hardening** — revoga/regrant de `has_role`, restritivas de client-write, column-grants, view pública de planos, seed de planos, conteúdo exclusivo (articles/media/lives_private), fix de leitura pública de planos.

---

## 7. Integrações e Serviços Externos

| Serviço | Uso atual |
|---|---|
| **Supabase (FontEndSite)** | Backend principal (auth, DB, edge functions) |
| **Supabase (Social Canvas / Hub)** | Conteúdo editorial + sync de assinantes |
| **GitHub + GitHub Actions + Pages** | Repo, CI/CD e hospedagem |
| **Google OAuth** | Login social (configurado no Auth do FontEndSite) |
| **Redes sociais (Instagram, YouTube, Facebook, TikTok, LinkedIn, X, Telegram, WhatsApp)** | Conteúdo distribuído e agregado em `/redes` (dados vindos do Hub) |
| **Stripe** | *Previsto* (campos `stripe_product_id`, `stripe_price_id`, `stripe_customer_id` no schema; checkout ainda placeholder) |

---

## 8. Observabilidade e Ferramentas de Desenvolvimento

| Ferramenta | Uso |
|---|---|
| **Dashboard do Supabase** | Monitorar status do projeto, API Gateway (alerts/warnings/errors), banco e funções |
| **Supabase Management API** | Verificação de deploys e estado de projeto via API (usada durante as correções) |
| **Curl/Invoke-RestMethod** | Testes de integração das edge functions (status codes, degradação, content-types) |
| **ESLint + typescript-eslint** | Lint do frontend |
| **Vitest** | Testes unitários |
| **Playwright** | Testes e2e configurados |
| **Git log/status** | Controle de versão e acompanhamento de deploys |

---

## 9. Estado Atual e Riscos Conhecidos

| Item | Status | Ação |
|---|---|---|
| Site vitoria.news | 🟢 200, assets OK | — |
| Planos públicos (mensal R$19,70 / anual R$197,00) | 🟢 leitura anon OK | — |
| Feeds RSS/Atom/Sitemap | 🟢 200 com XML válido (sitemap content-type reescrito p/ text/plain — conhecido) | Aceito |
| API Gateway dashboard | 🟢 sem 5xx de leitura (tudo degrada a 200 `hub_empty`) | — |
| Hub (Social Canvas) | 🔴 serviços UNHEALTHY/504 (restore prolongado) | Monitorar; abrir ticket se não restaurar |
| Checkout de assinaturas | 🟡 placeholder | Integrar Stripe (v2) |
| Envio de emails (double opt-in) | 🟡 descrito na UX | Integrar provedor de email (v2) |