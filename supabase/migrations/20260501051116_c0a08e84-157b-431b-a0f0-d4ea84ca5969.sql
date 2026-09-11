-- Remove a policy permissiva redundante de user_roles
DROP POLICY IF EXISTS "roles_admin_write" ON public.user_roles;

-- Recria a policy admin como permissiva apenas para SELECT (já há roles_select_own_or_admin)
-- Para writes, manter SOMENTE a restritiva (que exige has_role admin)
-- Mas restritiva sozinha bloqueia tudo se não houver permissiva — adicionar permissiva mínima:
CREATE POLICY "roles_admin_write_permissive"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "roles_admin_update_permissive"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "roles_admin_delete_permissive"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Remover campaigns do realtime — evita vazamento de campanhas inativas/futuras
ALTER PUBLICATION supabase_realtime DROP TABLE public.campaigns;