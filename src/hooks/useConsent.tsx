import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ConsentCategories {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  third_party: boolean;
}

const STORAGE_KEY = "vn_consent_v1";
const FP_KEY = "vn_fp_v1";
const POLICY_VERSION = "1.0";

interface ConsentContextValue {
  consent: ConsentCategories | null;
  setConsent: (categories: ConsentCategories) => Promise<void>;
  reset: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

function getOrCreateFingerprint(): string {
  if (typeof window === "undefined") return "ssr";
  let fp = localStorage.getItem(FP_KEY);
  if (!fp) {
    fp = `${crypto.randomUUID()}-${Date.now().toString(36)}`;
    localStorage.setItem(FP_KEY, fp);
  }
  return fp;
}

export const ConsentProvider = ({ children }: { children: React.ReactNode }) => {
  const [consent, setConsentState] = useState<ConsentCategories | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ConsentCategories) : null;
    } catch {
      return null;
    }
  });

  const setConsent = useCallback(async (categories: ConsentCategories) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    setConsentState(categories);
    try {
      await supabase.functions.invoke("consent-log", {
        body: {
          fingerprint: getOrCreateFingerprint(),
          categories,
          policy_version: POLICY_VERSION,
        },
      });
    } catch (e) {
      // não bloqueia UX se o log falhar
      console.warn("[consent] log failed", e);
    }
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConsentState(null);
  }, []);

  const value = useMemo(() => ({ consent, setConsent, reset }), [consent, setConsent, reset]);
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
};

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent precisa estar dentro de <ConsentProvider>");
  return ctx;
}

/** Helper para gating de scripts (Meta Pixel, GA, TikTok etc) */
export function useConsentCategory(category: keyof Omit<ConsentCategories, "necessary">) {
  const { consent } = useConsent();
  return consent ? consent[category] === true : false;
}
