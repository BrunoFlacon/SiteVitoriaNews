-- 1) Remover subscribers do realtime (dados sensíveis Stripe)
ALTER PUBLICATION supabase_realtime DROP TABLE public.subscribers;

-- 2) Bloquear explicitamente INSERT/UPDATE/DELETE em user_roles para não-admins
-- A policy roles_admin_write já cobre admins; adiciona política restritiva para garantir
CREATE POLICY "roles_block_self_insert"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Adicionar RLS em realtime.messages para restringir tópicos sensíveis
-- Permitir realtime apenas em tópicos públicos (campaigns, leads-públicos não, posts do hub)
-- Por padrão authenticated pode ouvir 'public:*'; restringimos para autenticados não receberem dados privados
-- Habilitar RLS na tabela messages do realtime
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Permitir realtime apenas em canais públicos explicitamente nomeados
CREATE POLICY "realtime_public_topics_only"
ON realtime.messages
FOR SELECT
TO authenticated, anon
USING (
  realtime.topic() IN ('public:campaigns', 'public:hub-posts', 'public:hub-lives')
);