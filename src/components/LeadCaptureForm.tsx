import { useState } from "react";
import { z } from "zod";
import { Loader2, Send, MessageCircle, Hash, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  name: z.string().trim().min(2, "Mínimo 2 letras").max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  accept_terms: z.literal(true, { errorMap: () => ({ message: "Você precisa aceitar os termos" }) }),
  marketing: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  source?: "newsletter" | "group_whatsapp" | "group_telegram" | "lead_magnet" | "other";
  campaignSlug?: string;
  /** título exibido sobre o form */
  title?: string;
  /** texto de descrição */
  description?: string;
  /** quando concluído com sucesso, recebe os links da campanha (se houver) */
  onSuccess?: (data: { whatsapp_url: string | null; telegram_url: string | null } | null) => void;
  /** quando true, mostra os links do grupo após o cadastro */
  revealLinks?: boolean;
  className?: string;
}

function getUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = sp.get(k);
    if (v) utm[k] = v;
  }
  return utm;
}

const LeadCaptureForm = ({
  source = "newsletter",
  campaignSlug,
  title = "Receba as notícias direto no seu email",
  description = "Conteúdo exclusivo, breaking news e análises da redação Vitória News.",
  onSuccess,
  revealLinks = false,
  className,
}: Props) => {
  const [values, setValues] = useState<Partial<FormValues>>({ marketing: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ whatsapp_url: string | null; telegram_url: string | null } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, (v ?? [])[0] ?? ""])));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<{
        ok: boolean;
        lead_id: string;
        campaign: { whatsapp_url: string | null; telegram_url: string | null } | null;
      }>("lead-capture", {
        body: {
          email: parsed.data.email,
          name: parsed.data.name || undefined,
          phone: parsed.data.phone || undefined,
          source,
          campaign_slug: campaignSlug,
          utm: getUtm(),
          consent: {
            accept_terms: true,
            marketing: parsed.data.marketing,
            policy_version: "1.0",
          },
        },
      });
      if (error) throw error;
      const links = data?.campaign ?? null;
      setSuccess(links);
      onSuccess?.(links);
      toast({
        title: "Inscrição confirmada",
        description: "Verifique seu email para concluir o cadastro (double opt-in).",
      });
    } catch (err) {
      toast({
        title: "Erro ao enviar",
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`glass rounded-xl p-6 text-center ${className ?? ""}`}>
        <CheckCircle2 className="mx-auto mb-3 text-gold" size={40} />
        <h3 className="font-display text-xl font-bold mb-2">Pronto!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Seu cadastro foi recebido. Em alguns minutos você receberá um email para confirmar a inscrição.
        </p>
        {revealLinks && (success.whatsapp_url || success.telegram_url) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            {success.whatsapp_url && (
              <Button asChild variant="default">
                <a href={success.whatsapp_url} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2" size={16} /> Entrar no WhatsApp
                </a>
              </Button>
            )}
            {success.telegram_url && (
              <Button asChild variant="secondary">
                <a href={success.telegram_url} target="_blank" rel="noopener noreferrer">
                  <Hash className="mr-2" size={16} /> Entrar no Telegram
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`glass rounded-xl p-6 space-y-4 ${className ?? ""}`} noValidate>
      <div>
        <h3 className="font-display text-xl font-bold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="lead-name">Nome</Label>
          <Input
            id="lead-name"
            autoComplete="name"
            maxLength={120}
            value={values.name ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="lead-phone">WhatsApp (opcional)</Label>
          <Input
            id="lead-phone"
            autoComplete="tel"
            inputMode="tel"
            maxLength={40}
            value={values.phone ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="lead-email">Email *</Label>
        <Input
          id="lead-email"
          type="email"
          required
          autoComplete="email"
          maxLength={255}
          value={values.email ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="lead-terms"
          checked={values.accept_terms === true}
          onCheckedChange={(c) => setValues((v) => ({ ...v, accept_terms: c === true ? true : undefined }))}
        />
        <Label htmlFor="lead-terms" className="text-xs font-normal leading-tight">
          Li e aceito os{" "}
          <a href="/termos" className="text-gold underline">termos</a> e a{" "}
          <a href="/privacidade" className="text-gold underline">política de privacidade</a>.
        </Label>
      </div>
      {errors.accept_terms && <p className="text-xs text-destructive">{errors.accept_terms}</p>}

      <div className="flex items-start gap-2">
        <Checkbox
          id="lead-marketing"
          checked={values.marketing === true}
          onCheckedChange={(c) => setValues((v) => ({ ...v, marketing: c === true }))}
        />
        <Label htmlFor="lead-marketing" className="text-xs font-normal leading-tight text-muted-foreground">
          Quero receber novidades, promoções e ofertas especiais.
        </Label>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send className="mr-2" size={16} />}
        {loading ? "Enviando..." : "Quero receber"}
      </Button>
    </form>
  );
};

export default LeadCaptureForm;
