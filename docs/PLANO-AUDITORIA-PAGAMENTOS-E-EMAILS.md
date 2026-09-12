# Plano — Auditoria de Pagamentos, Emails e Integração Hostinger Reach

> **Data:** 2026-09-12
> **Escopo:** cadastro → assinatura → checkout → pagamento → emails (double opt-in) → newsletter (RSS grátis / premium)
> **Banco canônico:** FontEndSite `iqhxakycirzsrumpygwn` (toda referência ao projeto antigo `kpkeelxdyryufmevhhhb` foi removida)

---

## 1. Auditoria do fluxo atual (cadastro → pagamento)

### 1.1 Como o fluxo funciona HOJE

| Etapa | Local | Status |
|---|---|---|
| Cadastro (email/senha) | `src/pages/AuthPage.tsx` → `supabase.auth.signUp` | ✅ Funciona |
| Login + Google OAuth | `AuthPage.tsx` → `signInWithPassword` / `signInWithOAuth` | ✅ Funciona |
| Trigger `handle_new_user` | Migration `20260427163138` — cria `profiles` + `user_roles` (role `user`) | ✅ Funciona |
| Ler planos | `SubscribersPage.tsx` → view `subscription_plans_public` (policy `plans_customer_read`) | ✅ Funciona (mensal R$19,70 / anual R$197,00) |
| Verificar assinatura | `useSubscription.ts` → tabela `subscribers` | ✅ Funciona (lê status) |
| **Checkout / pagamento** | `SubscribersPage.tsx` linha 226: `toast.info("Checkout em breve…")` | ❌ **PLACEHOLDER — NÃO EXISTE** |
| Webhook de pagamento | — | ❌ **NÃO EXISTE** |
| Criação de assinatura no banco | — | ❌ **NÃO EXISTE** (só é possível via service role) |
| Emails transacionais (boas-vindas, cancelamento) | — | ❌ **NÃO EXISTE** |
| Double opt-in email | UI promete ("você receberá um email para confirmar"), mas **nenhum email é disparado** | ❌ **NÃO EXISTE** |
| Sync de lead para o Hub | `lead-capture`/`newsletter-subscribe` → `portal_subscribers` (plan_type `free`) | ✅ Existe (best-effort) |

### 1.2 Placeholders encontrados

1. **`src/pages/SubscribersPage.tsx` linha 226** — botão "Assinar" só mostra toast `"Checkout em breve — finalize a configuração de pagamentos."`
2. **Campos Stripe no banco** (sem lógica Stripe real):
   - `subscription_plans.stripe_product_id`, `stripe_price_id`
   - `subscribers.stripe_customer_id`, `stripe_subscription_id`
3. **UI promete double opt-in** (`LeadCaptureForm.tsx` linha 96) mas nenhum email é enviado.
4. **Enum `lead_event_type`** já tem `double_opt_in`, e `leads` tem `double_opt_in`/`double_opt_in_at` — colunas prontas, **fluxo nunca foi implementado**.

### 1.3 Gaps de segurança/robustez identificados

- `subscription_plans_public` não expõe `stripe_*` (bom) — as colunas internas ficam só para admin na tabela base.
- `subscribers` NÃO tem policy de INSERT/UPDATE para cliente (restritivo por design) — **correto**, deve permanecer assim: só service role cria/atualiza.
- Não há função de **cancelamento**: `cancel_at`/`canceled_at` existem no schema mas nada escreve neles.
- AuthPage `signUp` com `emailRedirectTo` — se o projeto exigir confirmação de email, o usuário é criado mas não autenticado; o frontend navega para `/assinantes` mesmo assim (bug menor: redireciona antes de confirmar).
- **Publishable key no `.env` versionado em git** — risco de vazamento histórico; a chave atual `sb_publishable_qP2RW...` é nova e não expira (chaves publicáveis são seguras por design para uso público, mas convém derrubar as antigas no dashboard quando possível).

---

## 2. Decisão: integrador de pagamentos agnóstico

### 2.1 Por que não acoplar a um gateway específico

O schema atual herdou colunas Stripe (`stripe_*`). O requisito é: **"fazer a ferramenta de verdade funcionar com campos para qualquer API de pagamentos"**. A solução é uma **camada de abstração** no backend (edge functions), com:

- **Tabela `payment_providers`** (catálogo de gateways configurados: `mercado_pago`, `stripe`, `asaas`, `hotmart`, etc.)
- **Colunas genéricas** em `subscription_plans`: `external_product_id`, `external_price_id` (substituindo ``stripe_*`` — mantidas por compatibilidade, mas marcadas como legadas).
- **Colunas genéricas** em `subscribers`: `provider`, `external_customer_id`, `external_subscription_id` (substituindo ``stripe_*``).
- **Edge function `checkout-session`** — recebe `plan_code`, `user` (JWT verificado) e `provider`; retorna a URL de checkout/payload específico do gateway.
- **Edge function `payment-webhook`** — endpoint único que roteia por `provider` e atualiza `subscribers` (status `active`/`canceled`/`past_due`), grava `audit_logs` e dispara emails.

### 2.2 Modelo de dados proposto

```sql
-- Catálogo de provedores habilitados (admin configura)
CREATE TABLE public.payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,           -- 'mercado_pago' | 'stripe' | 'asaas' | ...
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',  -- credenciais NUNCA aqui; apenas flags/retry
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- subscription_plans: renomear conceitualmente, mantendo colunas legadas
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS external_product_id TEXT,
  ADD COLUMN IF NOT EXISTS external_price_id TEXT;
-- ⚠️ stripe_product_id / stripe_price_id: manter como legado (não remover ainda)

-- subscribers: identificadores genéricos por provedor
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS external_subscription_id TEXT;
-- ⚠️ stripe_customer_id / stripe_subscription_id: legado
```

> **Nota de compatibilidade:** não remover colunas `stripe_*` nesta fase — evita quebrar código existente. A partir daqui tudo novo usa `external_*` + `provider`.

### 2.3 Contratos das edge functions

| Function | Método | Entrada | Saída |
|---|---|---|---|
| `checkout-session` | POST | `{ plan_code, provider?, return_url }` (JWT autenticado) | `{ checkout_url }` ou `{ payload }` conforme gateway |
| `payment-webhook` | POST | corpo do gateway + header de assinatura | `{ ok: true }` (e atualiza `subscribers` + emails) |
| `subscription-status` | GET | JWT | status atual + próximo período |
| `subscription-cancel` | POST | JWT + `{ reason? }` | cancela no gateway + `subscribers.status='canceled'` + email |

### 2.4 Como o frontend consome

- `SubscribersPage.tsx` botão "Assinar" → `supabase.functions.invoke("checkout-session", { body: { plan_code } })` → `window.location.href = checkout_url`
- `useSubscription` ganha `provider`, `currentPeriodEnd` etc. (já lê `subscribers`)
- Flow de callback: gateway redireciona para `{origin}/assinantes?checkout=success` → hook refetch + toast

---

## 3. Fluxo de emails (double opt-in + transacionais)

### 3.1 Estado atual

- `leads.double_opt_in` / `double_opt_in_at` existem; enum já tem `double_opt_in`.
- **Nenhum email é disparado hoje.**

### 3.2 Provedor de email transacional (v2)

O requisito: boas-vindas no primeiro cadastro e email de cancelamento. A proposta é usar **Hostinger Reach** (ver seção 4) como canal de campanhas/newsletter, e o **SMTP do Supabase Auth** ou um provedor transacional para os emails de workflow (boas-vindas, confirmação de opt-in, cancelamento). Se o Auth da Supabase já envia email de confirmação de cadastro (padrão), isso cobre o "primeiro contato". Para boas-vindas após assinatura e cancelamento, adicionar a function `send-email` (via SMTP) ou reutilizar Reach.

**Decisão (proposta):** usar **SMTP do Supabase (custom SMTP)** para emails transacionais (boas-vindas, cancelamento, confirmação de double opt-in) e **Hostinger Reach** para newsletter/boletim (RSS) e comunicações em massa. Isso separa volume transacional de volume de marketing (melhor deliverability, LGPD).

### 3.3 Implementação do double opt-in

```
1. visitante preenche LeadCaptureForm (email)
2. lead-capture: insere lead + lead_events(type=opt_in) + envia email de confirmação
   com token único (leads.double_opt_in_token) apontando para edge function confirm-email
3. usuário clica → confirm-email valida token, marca double_opt_in=true, double_opt_in_at,
   registra lead_events(type=double_opt_in), cria contacto no Hub + no Hostinger Reach
4. a partir daí entra no fluxo de newsletter
```

### 3.4 Emails transacionais (v2) — regras de negócio

| Evento | Email | Gatilho |
|---|---|---|
| Primeira inscrição (lead) | Confirmação de double opt-in | `lead-capture` |
| Confirmação de email | Obrigado por confirmar | `confirm-email` |
| Assinatura ativa (premium) | **Boas-vindas premium** + link da área de assinante | `payment-webhook` (status active) |
| Cancelamento premium | **Email de cancelamento**, oferta de reativação / fallback para newsletter grátis | `subscription-cancel` |
| Inscrição newsletter grátis confirmada | Boas-vindas newsletter grátis | `confirm-email` |

---

## 4. Integração Hostinger Reach (emails, boletins, newsletters)

### 4.1 O que é

**Hostinger Reach** é a plataforma de email marketing da Hostinger (invite/link do usuário: `https://reach.hostinger.com/ff249d95-0509-4789-8dca-d12ba2bcfbfb`). API pública em `https://developers.hostinger.com/api/reach/v1`.

Recursos disponíveis na API (documentação oficial):
- `POST /api/reach/v1/contacts` — criar contacto (email, name, surname, phone, note)
- `POST /api/reach/v1/profiles/{profileUuid}/contacts` — criar contacto em um perfil remetente
- `GET /api/reach/v1/contacts` — listar/filtrar por `subscription_status` (active, pending, unsubscribed)
- `DELETE /api/reach/v1/contacts/{uuid}` — remover contacto
- `GET /api/reach/v1/segmentation/segments` + `POST /api/reach/v1/segmentation/segments` — segmentos (ex.: `subscription_status=active AND email_engagement=opened`)
- `GET /api/reach/v1/profiles` — perfis de remetente (sender identity)
- **Double opt-in nativo** no Reach: novo contacto nasce `pending` e recebe email de confirmação se habilitado

> **Importante:** a API do Reach **gerencia contactos/segmentos**, mas **não dispara campanhas por API** — o envio de campanhas é feito no dashboard (AI gera template, você agenda/envia). Logo, nosso papel é: **manter a lista sincronizada** (contactos com status correto), e o usuário dispara os boletins/RSS pelo painel. (Drip campaigns estão no roadmap público da Reach.)

### 4.2 Arquitetura proposta

```
[Site Vitória News]
   │ leads/subscribers (Supabase FontEndSite)
   ▼
[edge functions: lead-capture / newsletter-subscribe / payment-webhook / confirm-email]
   │ upsert contacto
   ▼
[Hostinger Reach API (developers.hostinger.com/api/reach/v1)]
   • contacto criado com double opt-in nativo (pending)
   • segmentos: "Newsletter Grátis" (subscription_status=active) e
                "Premium" (custom field / segmento de assinantes)
   ▼
[Dashboard Reach]
   • boletins semanais (RSS grátis) → segmento gratuito
   • newsletter premium → segmento premium
   • campanhas OTA de breaking news
```

**Sincronização dupla (requisito do usuário):** "todo mundo que assinar o premium o cadastro é registrado no nosso servidor supabase **e também no hostinger**":
- `payment-webhook` grava `subscribers` (Supabase) **e** chama Reach API
  (`POST /profiles/{profileUuid}/contacts` com `name`, `email`, `surname`) com flag de segmento premium.
- Se o contacto já existir no Reach como free, o `upsert` (idempotente por email) apenas atualiza o segmento/status.
- Função `sync-reach-cron` (agendada) reconcilia eventuais divergências (retry de falhas, marca `reach_synced_at`).

### 4.3 Secrets a adicionar no FontEndSite

| Secret | Valor |
|---|---|
| `REACH_API_TOKEN` | API token do painel Reach (Settings → API) |
| `REACH_PROFILE_UUID` | UUID do perfil remetente (só se usar o endpoint scoped) |
| `MAIL_FROM` | `newsletter@vitoria.news` (ou domínio verificado) |

### 4.4 Permissões/escopo (LGPD)

- Contacto Reach só após **confirmação de double opt-in** no nosso fluxo (ou usar o double opt-in nativo do Reach — escolher um, não os dois).
- Manter registros de consentimento em `consent_logs` e em `leads.consent` (já existe).
- `unsubscribe` → `DELETE /api/reach/v1/contacts/{uuid}` ou mudança de status via painel; registrar `lead_events(type=unsubscribe)`.

---

## 5. RSS para assinantes gratuitos + newsletter premium

### 5.1 Estado atual

- `rss-xml`, `atom-xml`, `sitemap-xml` já existem e funcionam (200, conteúdo do Hub).
- RSS é **público** (sem segregação) — qualquer pessoa consome os 50 posts do Hub.

### 5.2 Objetivo

| Público | Entrega | Canal |
|---|---|---|
| **Grátis** | Boletim RSS semanal (resumo dos posts públicos) | RSS público (`/rss.xml`) + email via Reach (segmento free) |
| **Premium** | Newsletter premium (exclusivos, lives, análises) | Email via Reach (segmento premium) + conteúdo exclusivo no site |

### 5.3 Implementação

1. **Manter** `rss-xml` público (grátis) — já existe. Adicionar `?category=` (já suporta).
2. **RSS premium (protegido):** nova edge function `rss-xml-premium` que exige JWT + `subscribers.status IN ('active','trialing')`, retornando posts de `exclusive_articles` + Hub. Assinantes premium podem assinar o feed no leitor com token (URL `?token=...` com JWT curto) ou via login no site.
3. **Boletim automático:** `newsletter-digest-cron` (agendado, ex.: diário às 7h) que:
   - busca posts recentes do Hub (`hub-list-posts`) / `exclusive_articles`;
   - gera resumo;
   - chama a **API Reach** para criar/atualizar contactos nos segmentos certos;
   - o **disparo** do boletim usa campanha no dashboard Reach (a API Reach não envia campanha programaticamente).
4. **Segmentos Reach:**
   - `vitorianews-free` — contactos free (após opt-in confirmado);
   - `vitorianews-premium` — assinantes ativos (após `payment-webhook`);
   - Segmento de engajamento opcional (`opened`/`clicked`) para reengajamento.

---

## 6. Roteiro de execução (fases)

### Fase A — Fundação (banco + segurança)
- [ ] Criar migration `payment_providers` + colunas genéricas (`external_*`, `provider`)
- [ ] Reinforçar RLS: `payment_providers` leitura anon apenas `enabled=true, code,name` (sem `config`)
- [ ] Adicionar `leads.double_opt_in_token` + índice
- [ ] Testes: `db push` no FontEndSite (config.toml já corrigido)

### Fase B — Fluxo de pagamento (agnóstico a gateway)
- [ ] Edge `checkout-session` (contrato + validação JWT + roteamento por `provider`)
- [ ] Edge `payment-webhook` (idempotente: verificar assinatura do gateway; upsert `subscribers`; `audit_logs`; dispara email)
- [ ] Edge `subscription-status` e `subscription-cancel`
- [ ] Frontend: substituir placeholder do botão → `checkout-session` → redirect
- [ ] Testes de ponta a ponta (cadastro → planos → checkout simulado → webhook → status ativo)

### Fase C — Emails transacionais + double opt-in
- [ ] Configurar SMTP no Supabase (provedor + domínio verificados)
- [ ] Edge `confirm-email` (valida token, ativa lead, sync Hub + Reach)
- [ ] Templates: confirmação opt-in, boas-vindas newsletter, boas-vindas premium, cancelamento
- [ ] Disparo de boas-vindas/cancelamento no `payment-webhook`/`subscription-cancel`

### Fase D — Integração Hostinger Reach
- [ ] Adicionar secrets (`REACH_API_TOKEN`, `REACH_PROFILE_UUID`) — **precisa do token do painel Reach**
- [ ] Edge `reach-sync` (criar/atualizar contacto; idempotente por email)
- [ ] `sync-reach-cron` (reconciliação; marca `reach_synced_at`)
- [ ] Validar chamada real: `POST /api/reach/v1/contacts` → contacto `pending` + email de confirmação (double opt-in nativo ou nosso)
- [ ] Criar segmentos no painel: free, premium, engajamento

### Fase E — Newsletter/RSS premium
- [ ] Edge `rss-xml-premium` (JWT + verificação de assinatura)
- [ ] Edge `newsletter-digest-cron` (monta resumo, sincroniza contactos Reach)
- [ ] Integrar link "Adicionar ao seu leitor RSS" na área do assinante (`SubscribersPage`)
- [ ] Testes UAT: free recebe boletim; premium recebe newsletter + feed protegido; cancelado sai dos segmentos

---

## 7. Riscos e pendências externas

1. **Token API do Reach** — ainda não existe no nosso ambiente; **precisa ser gerado no painel** (Settings → API) pelo dono da conta Hostinger. Sem ele, a sincronização Reach fica em modo "dry-run/log".
2. **API Reach não envia campanhas** — boletins são agendados/enviados no dashboard; nossa integração mantém a lista sincronizada (design acima já reflete isso).
3. **Double opt-in** — escolher abordagem única: sugerimos o **nosso** token (`confirm-email`) para manter LGPD total; o Reach também tem o nativo — **não usar os dois** (evita email duplicado de confirmação).
4. **Dívida técnica:** colunas `stripe_*` legadas permanecem até migração completa; não há dados nelas hoje (auditado: banco antigo vazio, FontEndSite com planos corretos).
5. **Hub ainda em restore** (504) — fluxos impactados apenas onde lê conteúdo do Hub; lead capture/newsletter/pagamento não dependem do Hub (só sync best-effort).

---

## 8. Critérios de aceite (UAT)

- [ ] Usuário cadastra (email/senha ou Google) → consegue logar
- [ ] Vê planos reais (mensal R$19,70 / anual R$197,00) na página /assinantes
- [ ] Clica "Assinar" → é levado ao checkout do gateway configurado (sem placeholder)
- [ ] Após pagamento simulado, `subscribers.status` vira `active` via webhook
- [ ] Recebe email de boas-vindas premium
- [ ] Cancela → status `canceled` + email de cancelamento
- [ ] Assinante grátis confirma double opt-in → aparece no Reach (segmento free) e recebe boletim RSS
- [ ] Assinante premium aparece no Reach (segmento premium) e recebe newsletter premium
- [ ] Sem referência a `kpkeelxdyryufmevhhhb` em nenhum arquivo ativo (só histórico em docs)