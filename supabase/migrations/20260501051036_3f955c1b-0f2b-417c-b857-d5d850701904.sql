-- Reforça user_roles: política RESTRICTIVE cobrindo TODAS as operações
DROP POLICY IF EXISTS "roles_block_self_insert" ON public.user_roles;

CREATE POLICY "roles_only_admin_write_all"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Bloquear writes de cliente em subscribers (apenas service role escreve via edge function)
CREATE POLICY "subs_no_client_writes"
ON public.subscribers
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- leads: apenas leitura via edge function (service role) — bloquear writes do cliente
CREATE POLICY "leads_no_client_writes"
ON public.leads
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "leads_no_client_update"
ON public.leads
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "leads_no_client_delete"
ON public.leads
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);

-- consent_logs: apenas via edge function
CREATE POLICY "consent_no_client_writes"
ON public.consent_logs
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "consent_no_client_update"
ON public.consent_logs
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "consent_no_client_delete"
ON public.consent_logs
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);

-- audit_logs: apenas via edge function/triggers internos
CREATE POLICY "audit_no_client_writes"
ON public.audit_logs
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "audit_no_client_update"
ON public.audit_logs
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "audit_no_client_delete"
ON public.audit_logs
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);

-- Restringir realtime apenas ao topico público de campaigns (único realtime ativo)
DROP POLICY IF EXISTS "realtime_public_topics_only" ON realtime.messages;

CREATE POLICY "realtime_public_topics_only"
ON realtime.messages
FOR SELECT
TO authenticated, anon
USING (
  realtime.topic() = 'public:campaigns'
);