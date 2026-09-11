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