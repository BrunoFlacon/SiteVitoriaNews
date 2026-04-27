import { Mail, Zap, Bell, Shield } from "lucide-react";
import SEO from "@/components/SEO";
import LeadCaptureForm from "@/components/LeadCaptureForm";

const benefits = [
  { icon: Bell, title: "Breaking news", desc: "As notícias mais quentes assim que acontecem." },
  { icon: Zap, title: "Análises diárias", desc: "Resumo editorial direto na sua caixa de entrada." },
  { icon: Mail, title: "Conteúdo exclusivo", desc: "Reportagens só para inscritos." },
  { icon: Shield, title: "Sem spam, LGPD", desc: "Seus dados protegidos e cancelamento em 1 clique." },
];

const NewsletterPage = () => (
  <div className="pt-20 pb-12 px-4">
    <SEO
      title="Newsletter Vitória News — receba notícias direto no email"
      description="Inscreva-se gratuitamente. Breaking news, análises diárias e reportagens exclusivas. Sem spam, conforme LGPD."
    />
    <div className="container mx-auto max-w-5xl">
      <div className="text-center mb-12">
        <div className="inline-block px-4 py-1 rounded-full glass text-xs font-bold uppercase text-gold tracking-widest mb-4">
          Newsletter gratuita
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Notícias que importam, no seu ritmo
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Inscreva-se na newsletter da Vitória News e receba o melhor da política, Brasil e economia
          com curadoria editorial. Sem ruído, sem spam.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div className="space-y-4">
          {benefits.map((b) => (
            <div key={b.title} className="glass rounded-xl p-5 flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <b.icon className="text-gold" size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <LeadCaptureForm
          source="newsletter"
          title="Quero me inscrever"
          description="Após o envio você receberá um email para confirmar a inscrição (double opt-in)."
        />
      </div>
    </div>
  </div>
);

export default NewsletterPage;
