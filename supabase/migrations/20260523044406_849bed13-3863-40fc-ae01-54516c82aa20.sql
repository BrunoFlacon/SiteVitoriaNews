-- 1) Public view for subscription plans without Stripe internals
CREATE OR REPLACE VIEW public.subscription_plans_public
WITH (security_invoker = true)
AS
SELECT id, code, name, description, price_cents, currency, interval, perks, sort_order, is_active
FROM public.subscription_plans
WHERE is_active = true;

GRANT SELECT ON public.subscription_plans_public TO anon, authenticated;

-- Restrict raw table reads to admins only
DROP POLICY IF EXISTS plans_public_read ON public.subscription_plans;
CREATE POLICY plans_admin_read
ON public.subscription_plans
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) user_roles: replace ambiguous ALL restrictive policy with explicit per-command restrictives
DROP POLICY IF EXISTS roles_only_admin_write_all ON public.user_roles;

CREATE POLICY roles_restrict_insert_admin
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY roles_restrict_update_admin
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO anon, authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY roles_restrict_delete_admin
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO anon, authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY roles_restrict_select_self_or_admin
ON public.user_roles
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 3) Lock down has_role: only backend/service role may execute it
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;