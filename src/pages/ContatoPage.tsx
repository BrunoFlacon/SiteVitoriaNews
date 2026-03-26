const ContatoPage = () => (
  <div className="pt-20 pb-12 px-4">
    <div className="container mx-auto max-w-xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Contato</h1>
      <p className="text-muted-foreground mb-8">Entre em contato com a equipe Vitória News.</p>
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Nome</label>
          <input type="text" className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Seu nome" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
          <input type="email" className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="seu@email.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Mensagem</label>
          <textarea rows={5} className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Sua mensagem..." />
        </div>
        <button type="submit" className="w-full py-3 rounded-lg font-semibold text-primary-foreground bg-primary hover:opacity-90 transition-opacity">
          Enviar Mensagem
        </button>
      </form>
    </div>
  </div>
);

export default ContatoPage;
