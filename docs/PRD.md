# PRD — Vitória News (Portal de Notícias)

**Versão:** 1.0 · **Data:** 12/09/2026 · **Status:** Em produção (vitoria.news)

---

## 1. Visão Geral

### 1.1 Resumo do Produto
O Vitória News é um portal de notícias digitais com cobertura de política, Brasil, mundo,
economia e tecnologia. O site consome o conteúdo editorial de um banco central — o **Hub
(Social Canvas)** — via edge functions do Supabase, e oferece captação de leads, newsletter,
grupos de WhatsApp/Telegram, feeds de redes sociais, lives/podcasts e uma área de
assinantes com paywall e conteúdo exclusivo.

### 1.2 Objetivos do Produto
| Objetivo | Métrica |
|---|---|
| Publicar notícias em tempo real a partir do Hub | Tempo entre publicação no Hub e visibilidade no site |
| Crescer base de leitores com newsletter | Leads capturados/dia |
| Converter leitores em assinantes premium | Taxa de conversão em `/assinantes` |
| Crescer comunidades WhatsApp/Telegram | Inscrições em grupos via campanhas |
| Distribuir conteúdo nas redes sociais | Feed unificado em `/redes` |
| Conformidade com a LGPD | Consentimento registrado antes de qualquer tracking |

### 1.3 Público-alvo
- Leitores de notícias (público geral).
- Assinantes premium (paywall com planos mensal/anual).
- Seguidores das redes sociais da marca.
- Membros de grupos de WhatsApp/Telegram.

### 1.4 Fonte de conteúdo (arquitetura em 2 bancos)
- **FontEndSite** (`iqhxakycirzsrumpygwn`) — banco de negócio deste site: auth, leads,
  campanhas, consentimento, assinaturas, conteúdo exclusivo.
- **Hub / Social Canvas** (`ghtkdkauseesambzqfrd`) — banco editorial central que alimenta
  artigos, posts publicados, lives, categorias e assinantes do hub.
- O frontend **nunca acessa o Hub diretamente**: todas as leituras passam por edge
  functions com `service_role` e timeout de 3s. Quando o Hub está fora do ar, o site
  **degrada graciosamente** (lista vazia, nenhum erro 5xx).

---

## 2. Personas e Jornadas

### 2.1 Persona — Leitor casual
- Acessa a home, lê manchetes, abre artigos, compartilha nas redes.
- Jornada: `/` → artigo → compartilhar.

### 2.2 Persona — Assinante premium
- Cria conta, assina plano (mensal/anual), acessa conteúdo exclusivo.
- Jornada: `/assinantes` → planos → `/auth` → `/assinantes` (paywall liberado).

### 2.3 Persona — Membro de comunidade
- Entra em grupos WhatsApp/Telegram via campanha.
- Jornada: `/grupos` → formulário de lead → link do grupo (revelado só após cadastro).

---

## 3. Requisitos Funcionais por Módulo

### 3.1 Home (`/`)
**RF-1.1** Exibir hero com a notícia mais recente (destaque).
**RF-1.2** Exibir grid "Últimas Notícias" (até 6).
**RF-1.3** Exibir seção "Em Alta" (top 4 por ordenação do Hub).
**RF-1.4** Exibir atalhos de categorias: Política, Brasil, Economia, Tecnologia, Mundo.
**RF-1.5** Exibir formulário de newsletter (LeadCaptureForm).
**RF-1.6** SEO: JSON-LD `ItemList` + `NewsMediaOrganization`; `h1` sr-only.
**RF-1.7** Se o Hub estiver vazio/indisponível, mostrar estado vazio amigável (sem erro).

### 3.2 Artigo (`/post/:id`)
**RF-2.1** Carregar artigo pelo `id` (UUID) ou `slug` informado.
**RF-2.2** Sanitizar HTML do conteúdo com DOMPurify (allowlist restrita de tags/atributos).
**RF-2.3** Exibir categoria, autor, data de publicação e imagem de capa.
**RF-2.4** Botões de compartilhamento Facebook e X/Twitter.
**RF-2.5** Exibir "Notícias Relacionadas" (3 outros posts do Hub).
**RF-2.6** SEO: JSON-LD `NewsArticle` + `BreadcrumbList`; `noindex` quando não encontrado.
**RF-2.7** Se o Hub estiver indisponível, return `hub_empty` → página "Notícia não encontrada"
         (sem poluir o dashboard do Supabase com erro).

### 3.3 Categoria (`/categoria/:slug`)
**RF-3.1** Filtrar posts por categoria no Hub (`category`), limite 30.
**RF-3.2** Mapeamento de slugs: `politica`, `brasil`, `mundo`, `economia`, `tecnologia`.
**RF-3.3** Estado de loading com skeletons e estado vazio amigável.

### 3.4 Redes Sociais (`/redes`)
**RF-4.1** Feed unificado de `published_posts` do Hub com filtro por plataforma
         (Instagram, YouTube, Facebook, TikTok, LinkedIn, X, Telegram, WhatsApp).
**RF-4.2** Card com imagem (thumbnail/media), legenda e badge da plataforma, clicando para o link externo.
**RF-4.3** Limite padrão de 60 itens.

### 3.5 Grupos (`/grupos`)
**RF-5.1** Listar campanhas ativas (`campaigns` com RLS) com canal (WhatsApp/Telegram/misto) e badge VIP.
**RF-5.2** Formulário de lead por campanha (`lead-capture` com `campaign_slug`).
**RF-5.3** **Revelar links dos grupos somente após cadastro válido** — links voltam na resposta da
         edge function (as colunas `whatsapp_url`/`telegram_url` não são expostas ao cliente via RLS/grants).

### 3.6 Newsletter (`/newsletter`)
**RF-6.1** Página institucional com benefícios e formulário de inscrição.
**RF-6.2** Fluxo "double opt-in" descrito na UX; consentimento exigido.

### 3.7 Lives e Podcasts (`/lives`, `/podcasts`)
**RF-7.1** Listar itens de `stories_lives` do Hub com filtro `content_type` (`live`/`podcast`).
**RF-7.2** Exibir capa, título e horário agendado.

### 3.8 Autenticação (`/auth`)
**RF-8.1** Login e cadastro por email/senha (validação zod: email + senha ≥ 8).
**RF-8.2** Cadastro cria `profile` e role `user` automaticamente (trigger `handle_new_user`).
**RF-8.3** OAuth Google (`signInWithOAuth`).
**RF-8.4** Redirect após login respeita `?redirect=` (padrão `/assinantes`).

### 3.9 Assinantes (`/assinantes`)
**RF-9.1** Se não autenticado → redireciona para `/auth?redirect=/assinantes`.
**RF-9.2** Exibir planos públicos (`subscription_plans_public`), com preço formatado
         pt-BR, benefícios e destaque para o plano popular (anual).
**RF-9.3** Se assinante ativo (status `active`/`trialing` e período vigente) → área do
         assinante com conteúdo exclusivo servido pela edge function `hub-list-exclusive-posts`
         (verificação server-side de JWT + assinatura).
**RF-9.4** Checkout: placeholder — botão "Assinar" exibe aviso "em breve".

### 3.10 Consentimento de Cookies (LGPD) — global
**RF-10.1** Banner apresentado após 800ms quando não há consentimento salvo.
**RF-10.2** Opções: Aceitar tudo / Recusar opcionais / Personalizar (necessary sempre true).
**RF-10.3** Consentimento salvo no `localStorage` e registrado na tabela `consent_logs`
          via edge function `consent-log` (fingerprint + categorias + versão da política).
**RF-10.4** Hook `useConsentCategory(category)` permite gate de scripts de terceiros
          (Meta Pixel, GA, TikTok) por categoria consentida.

### 3.11 Feeds e SEO técnico
**RF-11.1** RSS 2.0 em `/functions/v1/rss-xml` (50 posts, filtro por `category`).
**RF-11.2** Atom em `/functions/v1/atom-xml` (50 posts).
**RF-11.3** Sitemap XML em `/functions/v1/sitemap-xml` (rotas estáticas + categorias + posts).
**RF-11.4** Links `rel="alternate"` para RSS/Atom no `index.html`.
**RF-11.5** CSP restritiva no `index.html` (script-src 'self', frame-ancestors 'none').

---

## 4. Requisitos Não Funcionais

| Requisito | Descrição |
|---|---|
| **Performance** | Code-splitting por rota (`React.lazy`); chunks vendor manuais no Vite; skeleton loading; `staleTime` 60s no react-query |
| **Resiliência** | Timeout de 3s nas chamadas ao Hub; degradação graciosa; nenhum 5xx em conteúdo quando o Hub cai |
| **Segurança** | RLS em todas as tabelas; cliente bloqueado para escrever em leads/consent/audit/subscribers; colunas sensíveis de campanhas só via edge function; sanitização DOMPurify; rate-limit 5/min por IP nas functions de captura; hash SHA-256 de IP/UA (LGPD) |
| **Conformidade** | LGPD: consentimento por categoria, registro auditável, cancelamento prometido em 1 clique |
| **SEO** | JSON-LD (ItemList, NewsMediaOrganization, NewsArticle, BreadcrumbList), OpenGraph, Twitter Cards, canonical, sitemap, feeds RSS/Atom |
| **Acessibilidade** | `aria-label` em ações de ícone, `sr-only` para títulos de página |

---

## 5. Arquitetura

### 5.1 Diagrama de fluxo de dados

```
[Hub / Social Canvas]──(service_role, timeout 3s)──▶ [Edge Functions (FontEndSite)]
                                                            ▲
[Postgres FontEndSite]◀──(service_role/RLS)───────────┘     │ GET (Authorization Bearer)
                                                            ▼
[Browser (React SPA)] ──(anon key, RLS)──▶ [Postgres FontEndSite]
        │
        └── supabase-auth (email/senha, Google OAuth)
```

### 5.2 Fronteiras de acesso
| Camada | Acesso | Uso |
|---|---|---|
| Browser → Postgres | anon + RLS | auth, leitura de `campaigns` (colunas públicas), `subscription_plans_public`, `subscribers` (próprio), `profiles` |
| Browser → Edge Functions | `Authorization: Bearer` (anon/inr) | todas as leituras do Hub e capturas |
| Edge Functions → Hub | `service_role` | leitura de posts, lives, categorias, published_posts; upsert de `portal_subscribers` |
| Edge Functions → Postgres | `service_role` | writes em `leads`, `lead_events`, `consent_logs`, verificação de assinatura |
| Cliente | **nunca** | qualquer write em tabelas de negócio |

---

## 6. Dados — Migrations (schema FontEndSite)

| Migration | Conteúdo |
|---|---|
| `20260427163138` | Enums, `set_updated_at`, `profiles`, `user_roles` + `has_role`, `subscription_plans`, `subscribers`, `campaigns`, `leads`, `lead_events`, `consent_logs`, `audit_logs`, trigger `handle_new_user`, RLS inicial, realtime campaigns/subscribers |
| `20260427163154` | Revoga EXECUTE de funções SD para PUBLIC/anon/authenticated |
| `20260501050938` | Remove `subscribers` do realtime; policy restritiva `user_roles` insert |
| `20260501051036` | Restritivas `user_roles` (ALL); bloqueia writes do cliente em subscribers/leads/consent/audit |
| `20260501051116` | Permissivas mínimas admin p/ user_roles; remove `campaigns` do realtime |
| `20260521224810` | Column-level grants em `campaigns` (invite URLs back-end only) |
| `20260521225742` | Re-grant EXECUTE `has_role` para anon/authenticated (RLS depende) |
| `20260523044406` | View `subscription_plans_public` (security_invoker); planos raw restritos a admin; refina user_roles |
| `20260523044442` | Re-grant EXECUTE `has_role` p/ anon/authenticated |
| `20260523044500` | Tabelas `exclusive_articles`, `exclusive_media`, `lives_private` + RLS de assinantes + seed planos mensal (R$19,70) e anual (R$197,00) |
| `20260911060941` | Policy `plans_customer_read` — anon/authenticated leem planos ativos (fix visibilidade) |

### 6.1 Tabelas principais
- `profiles` — perfil do usuário autenticado.
- `user_roles` — roles (`admin`, `editor`, `subscriber`, `user`).
- `subscription_plans` / `subscription_plans_public` (view) — planos de assinatura.
- `subscribers` — assinaturas (status, período, Stripe), **sem client writes**.
- `campaigns` — campanhas de grupos (WhatsApp/Telegram), URLs de convite back-end only.
- `leads` — leads com unicidade parcial `(email, campaign_id)` / `(email) WHERE campaign_id IS NULL`.
- `lead_events` — trilha de eventos (opt_in, double_opt_in, group_join, sync_hub, sync_failed...).
- `consent_logs` — consentimento LGPD.
- `audit_logs` — trilha de auditoria (admin read only).
- `exclusive_articles`, `exclusive_media`, `lives_private` — conteúdo premium (RLS: assinante ativo/admin/editor).

---

## 7. Edge Functions (FontEndSite)

Todas com `verify_jwt = false` e CORS aberto (`*`).

| Função | Método | Comportamento |
|---|---|---|
| `hub-list-posts` | GET | Lista posts do Hub (`articles`/`posts`), params `limit`(≤100), `offset`, `category`, `breaking`. Degrada `{ items: [], hub_empty: true }` |
| `hub-get-post` | GET | Post por `id` ou `slug`. 400 sem params; 404 legítimo; `hub_empty` em qualquer erro do Hub |
| `hub-list-published-posts` | GET | `published_posts`, filtro `platform`, `limit` ≤100. Degrada vazio |
| `hub-list-lives` | GET | `stories_lives`, filtro `content_type`, `limit` ≤50. Degrada vazio |
| `hub-list-categories` | GET | `categories`, `limit` ≤500. Degrada vazio |
| `hub-list-exclusive-posts` | GET | **Gated**: exige JWT válido (401) + assinatura ativa (403); retorna posts do Hub; degrada `hub_empty` se Hub indisponível |
| `lead-capture` | POST | Valida zod; rate-limit 5/min/IP; upsert manual de lead (índices parciais); resolve campanha e devolve links de convite; hash IP/UA; eventos opt_in/sync_hub/sync_failed; sync best-effort com Hub `portal_subscribers` |
| `newsletter-subscribe` | POST | Mesmo piso do `lead-capture` com `source=newsletter` fixo; responde `hub_synced` honesto |
| `consent-log` | POST | Valida fingerprint(≥8)/categorias/versão; resolve user via claims se Bearer; grava com IP/UA hash |
| `rss-xml` | GET | RSS 2.0, 50 posts, `category` opcional, cache 300s |
| `atom-xml` | GET | Atom feed, 50 posts, cache 300s |
| `sitemap-xml` | GET | Sitemap (rotas + categorias + até 1000 posts), cache 600s |

---

## 8. Critérios de Aceite (resumo)

1. Home carrega em <3s em 3G/4G com skeleton e vazio amigável quando o Hub está fora.
2. Artigo é sanitizado e exibe JSON-LD NewsArticle + BreadcrumbList.
3. Nenhum erro 5xx no dashboard do Supabase quando o Hub está down (tudo degrada para 200 `hub_empty`).
4. Cadastro de lead: 200 com `lead_id` (e `campaign` com links quando houver campanha); payloads inválidos → 400; sem aceite de termos → 400.
5. Newsletter devolve `hub_synced` verdadeiro/ falso de acordo com a sincronização real.
6. `consent-log` registra e protege por categoria; banner bloqueia gate de scripts de terceiros.
7. `/assinantes` sem login → redirect auth; sem assinatura → paywall com planos; com assinatura → conteúdo exclusivo gated server-side.
8. RSS/Atom/Sitemap respondem 200 com XML válido e são referenciados no `index.html`.
9. Feeds e sitemap usam URLs canônicas de `https://vitoria.news`.

---

## 9. Fora de Escopo (v1)
- Checkout/processamento de pagamento real (Stripe) — placeholder "em breve".
- Envio efetivo de emails de newsletter/double opt-in (campanhas de email).
- Upload de conteúdo pelo próprio site (conteúdo vem do Hub).
- Painel administrativo completo (dados gerenciados no Hub/Supabase Studio).