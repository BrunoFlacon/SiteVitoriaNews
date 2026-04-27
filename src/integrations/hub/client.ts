import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase apontando para o Hub (Social Canvas).
 * Usado APENAS para realtime (assinatura de mudanças em posts).
 * Leituras vão pelas edge functions (que usam service role).
 *
 * Configurar em Lovable Cloud secrets:
 *   - HUB_SUPABASE_URL  → também exposto como build var via VITE_HUB_SUPABASE_URL (placeholder)
 *   - HUB_SUPABASE_ANON_KEY  → também como VITE_HUB_SUPABASE_ANON_KEY
 *
 * Como esses VITEs ainda não estão no build, fazemos fallback seguro:
 * se ausente, retorna null e o realtime é silenciosamente desabilitado.
 */
const HUB_URL = (import.meta.env.VITE_HUB_SUPABASE_URL as string | undefined) ?? "";
const HUB_ANON = (import.meta.env.VITE_HUB_SUPABASE_ANON_KEY as string | undefined) ?? "";

export const hubSupabase =
  HUB_URL && HUB_ANON
    ? createClient(HUB_URL, HUB_ANON, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export const HUB_REALTIME_AVAILABLE = hubSupabase !== null;
