-- Fix: anon/authenticated não conseguiam ler subscription_plans_public
-- porque a view usa security_invoker=true e a política existente (plans_admin_read)
-- só permite admins. Adiciona política permissiva que expõe apenas planos ativos.

CREATE POLICY plans_customer_read
ON public.subscription_plans
FOR SELECT
TO anon, authenticated
USING (is_active = true);