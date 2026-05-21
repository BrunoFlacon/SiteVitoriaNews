-- Column-level access control on campaigns: invite URLs become backend-only
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'campaigns') THEN
    EXECUTE 'REVOKE SELECT ON TABLE public.campaigns FROM anon, authenticated';
    EXECUTE 'GRANT SELECT (id, slug, name, description, channel, audience, utm, is_active, starts_at, ends_at, created_at, updated_at) ON TABLE public.campaigns TO anon, authenticated';
    EXECUTE 'GRANT SELECT ON TABLE public.campaigns TO service_role';
  END IF;
END $$;