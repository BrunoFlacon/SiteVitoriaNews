import { forwardRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useConsent, ConsentCategories } from "@/hooks/useConsent";

const CookieBanner = forwardRef<HTMLDivElement>((_props, _ref) => {
  const { consent, setConsent } = useConsent();
  const [open, setOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [draft, setDraft] = useState<ConsentCategories>({
    necessary: true,
    analytics: false,
    marketing: false,
    third_party: false,
  });

  useEffect(() => {
    if (!consent) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [consent]);

  const acceptAll = async () => {
    await setConsent({ necessary: true, analytics: true, marketing: true, third_party: true });
    setOpen(false);
  };
  const rejectAll = async () => {
    await setConsent({ necessary: true, analytics: false, marketing: false, third_party: false });
    setOpen(false);
  };
  const saveCustom = async () => {
    await setConsent(draft);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 z-[60] max-w-3xl md:mx-auto"
          role="dialog"
          aria-label="Aviso de cookies"
        >
          <div className="glass-strong rounded-xl border border-border shadow-2xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <Cookie className="text-gold shrink-0" size={22} />
              <div className="flex-1">
                <h2 className="font-display text-base font-bold">Sua privacidade importa</h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Usamos cookies para melhorar sua experiência, medir audiência e personalizar conteúdo.
                  Você pode aceitar tudo, recusar opcionais ou personalizar. Veja a{" "}
                  <a href="/privacidade" className="text-gold underline">política de privacidade</a>.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar (você precisará escolher uma opção)"
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {showCustomize && (
              <div className="space-y-3 my-4 pt-4 border-t border-border">
                {[
                  { key: "necessary", label: "Necessários", desc: "Login, segurança, funcionamento básico", locked: true },
                  { key: "analytics", label: "Análise de uso", desc: "Audiência, performance (anônimo)" },
                  { key: "marketing", label: "Marketing", desc: "Personalização de anúncios e campanhas" },
                  { key: "third_party", label: "Terceiros", desc: "Pixels (Meta, TikTok, Google Ads)" },
                ].map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                    </div>
                    <Switch
                      checked={draft[c.key as keyof ConsentCategories] === true}
                      disabled={c.locked}
                      onCheckedChange={(v) =>
                        c.key !== "necessary" &&
                        setDraft((d) => ({ ...d, [c.key]: v } as ConsentCategories))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              {!showCustomize ? (
                <>
                  <Button onClick={acceptAll} className="flex-1">Aceitar tudo</Button>
                  <Button onClick={rejectAll} variant="secondary" className="flex-1">Recusar opcionais</Button>
                  <Button onClick={() => setShowCustomize(true)} variant="ghost" className="flex-1">
                    <Settings2 size={14} className="mr-1" /> Personalizar
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={saveCustom} className="flex-1">Salvar escolhas</Button>
                  <Button onClick={() => setShowCustomize(false)} variant="ghost" className="flex-1">
                    Voltar
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

CookieBanner.displayName = "CookieBanner";

export default CookieBanner;
