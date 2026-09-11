# Plano de Execução — Vitória News (Backend Supabase)

> **Data:** 2026-09-11
> **Decisão do usuário:** O banco de dados do projeto é o **FontEndSite**
> (`iqhxakycirzsrumpygwn`), não o `kpkeelxdyryufmevhhhb`. O frontend apontava para
> o projeto antigo e foi migrado.

## 1. Diagnóstico (dashboards de erros)

O usuário relatou erros no dashboard: 231 requests, 64,1% success, erros em Auth,
Realtime, Postgres, API Gateway e Storage. Causas raiz identificadas:

1. **Incidente global da Supabase** (10-11/set/2026): *"Unresponsive Projects"* —
   projetos **Nano** ficam inoperantes após algumas horas. O **Hub**
   (`ghtkdkauseesambzqfrd`, nano, us-west-2) foi afetado: todos os serviços
   retornavam UNHEALTHY (resposta 504/522 nas chamadas). **Ação:** restart do
   projeto foi disparado via Management API.
2. **Edge functions sem timeout**: cada chamada ao Hub ficava presa **~25s** até o
   timeout padrão do supabase-js, causando aquecimento de CPU/memória e erros em
   cascata. **Ação:** adicionado `fetchWithTimeout` de **3s** em
   `_shared/hub.ts` (com detecção de abort como "hub indisponível"); funções agora
   degradam graciosamente (`hub_empty: true`, `degraded: true`).
3. **Frontend apontava para o projeto errado** (`kpkeelxdyryufmevhhhb`):
   `.env` e `index.html` (links RSS/Atom) migrados para o FontEndSite.
4. **Tabelas de assinatura/exclusivo ausentes** no FontEndSite — criadas por
   migration (ver seção 3).

## 2. Projetos envolvidos (org `ijhzeichkppvmfrwtoha`)

| Projeto | Papel | Status |
|---|---|---|
| `iqhxakycirzsrumpygwn` — **FontEndSite** | Banco/API do site (Banco B) | ACTIVE_HEALTHY |
| `ghtkdkauseesambzqfrd` — **Hub (BrunoFlacon)** | Fonte de conteúdo (space posts, lives) | ACTIVE_HEALTHY (após restart) |
| `jhlenuhlnxlkdvykmrbs` — OpenHive | (inativo) | INACTIVE |
| `kpkeelxdyryufmevhhhb` | Projeto antigo (fora dessa org) | — |

Acesso à API de gerenciamento: access token `sbp_...` (Windows Credential Manager:
`Supabase CLI:supabase`). CLI 2.109.1 global em `%APPDATA%\npm`.

## 3. Entregas realizadas

### 3.1 Migrations aplicadas no FontEndSite

1. `20260501050938_...` — removidas operações sobre `realtime.messages`
   (faltava permissão de owner); aplicada.
2. `20260501051036_...` — removido bloco de policy `realtime_public_topics_only`;
   aplicada.
3. `20260501051116_...` — removido `DROP POLICY realtime_public_topics_only`;
   aplicada.
4. `20260521224810_...` e `20260521225742_...` — aplicadas.
5. `20260523044406_...` — base do site + view `subscription_plans_public` (com
   `security_invoker = true`); aplicada.
6. `20260523044442_...` — base assinantes; aplicada.
7. **`20260523044500_exclusive_content.sql`** (NOVA) — cria `exclusive_articles`,
   `exclusive_media`, `lives_private` com RLS (leitura apenas para assinantes
   ativos/trialing via `subscribers`; escrita admin/editor; anon restritivo) e faz
   seed de `subscription_plans` (mensal R$19,70/mês; anual R$197,00/ano).

Comando: `supabase db push --linked --include-all --yes` (via CLI linkada ao
FontEndSite; `db push` não exige senha — usa a role `cli_login_postgres` criada
pela Management API).

### 3.2 Edge functions deployadas no FontEndSite (12)

`hub-list-posts`, `hub-get-post`, `hub-list-exclusive-posts`, `hub-list-lives`,
`hub-list-published-posts`, `hub-list-categories` (NOVA), `lead-capture`,
`newsletter-subscribe` (NOVA), `consent-log`, `rss-xml`, `atom-xml`, `sitemap-xml`.

- `hub-list-categories`: lê `categories` do Hub com degradação graciosa.
- `newsletter-subscribe`: valida e-mail com zod, aplica rate-limit, upsert em
  `leads`, log em `lead_events`, sync best-effort com `portal_subscribers` do Hub.
- `hub-list-exclusive-posts`: agora trata JWT inválido → 401 (antes 500);
  verifica assinatura ativa/trialing em `subscribers` (service-role); só então lê
  o conteúdo exclusivo do Hub.
- Todas as funções que falam com o Hub usam `getHubClient()` com **timeout de 3s**.

### 3.3 Secrets configurados no FontEndSite

| Secret | Valor |
|---|---|
| `HUB_SUPABASE_URL` | `https://ghtkdkauseesambzqfrd.supabase.co` |
| `HUB_SUPABASE_SERVICE_ROLE_KEY` | SRK legacy do Hub (via `projects api-keys list`) |

> ⚠️ Antes apontavam para a VPS self-hosted (`supabase.webradiovitoria.com.br`),
> que está inacessível (timeout). Corrigidos.

### 3.4 Frontend migrado para o FontEndSite

- `.env`: `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_PUBLISHABLE_KEY` → FontEndSite (anon key).
- `index.html`: links RSS/Atom → `https://iqhxakycirzsrumpygwn.supabase.co/functions/v1/{rss-xml,atom-xml}`.

## 4. Uso de memória / aquecimento (medidas tomadas)

- Timeout global de 3s nas chamadas ao Hub (era ~25s de espera por chamada).
- `isHubUnavailable` cobre aborts/timeouts/DNS → retorno imediato degradado.
- Cold start das functions ainda existe, mas sem bloqueio de ~25s a carga de CPU
  cai drasticamente.

## 5. Correções adicionais (verificação final)

- **Bug de upsert de leads**: as funções `newsletter-subscribe` e `lead-capture`
  usavam `upsert({ onConflict: "email" })`, mas a tabela `leads` só tem unique
  indexes **parciais** (`uq_leads_email_campaign` / `uq_leads_email_no_campaign`),
  que o Postgres não infere em `ON CONFLICT (email)` → HTTP 500. Corrigido com
  upsert manual (select → insert/update) inline nas próprias funções.
- **Helper compartilhado removido**: um `_shared/leads.ts` foi criado inicialmente,
  mas causava `BOOT_ERROR` no Deno Deploy — a lógica foi inlinada e o arquivo
  removido.
- **Sincronização honesta com o Hub**: o supabase-js não lança exceção em erro de
  query (retorna `{ data, error }`); o código ignorava o erro e reportava
  `hub_synced: true` mesmo com o Hub fora. Agora checa `error` e reporta
  `hub_synced: false` corretamente.

## 6. Verificação final executada

| Item | Resultado |
|---|---|
| Site `https://vitoria.news` | HTTP 200, título correto, root div, assets 200 |
| Links RSS/Atom | apontam para FontEndSite; sem referência ao projeto antigo |
| `rss-xml` / `atom-xml` / `sitemap-xml` | HTTP 200 (content-types corretos) |
| `subscription_plans_public` (anon) | 200 — mensal R$19,70 / anual R$197,00 |
| `newsletter-subscribe` (POST) | 200 — lead gravado, upsert ok, `hub_synced` honesto |
| `lead-capture` (POST) | 200 — lead gravado |
| Deploy GitHub Pages | sucesso (`9fa9975`, `fccf785`) |

## 7. Pendências / próximos passos

1. ⏳ **Hub (`ghtkdkauseesambzqfrd`)**: foi pausado por inatividade (plano Nano) e
   está em restore prolongado — REST/db ainda respondem 504. A Supabase recomenda
   abrir ticket se passar de 30 min. Enquanto isso, as edge functions degradam
   graciosamente (`hub_empty: true`) sem travar o site.
2. Testar fluxo de assinatura com usuário real + conteúdo exclusivo.
3. Considerar upgrade do Hub para plano pago (o Nano pausa por inatividade).