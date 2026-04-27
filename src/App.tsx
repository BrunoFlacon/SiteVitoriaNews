import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import { ConsentProvider } from "@/hooks/useConsent";
import Index from "./pages/Index";
import ArticlePage from "./pages/ArticlePage";
import CategoryPage from "./pages/CategoryPage";
import RedesPage from "./pages/RedesPage";
import GruposPage from "./pages/GruposPage";
import NewsletterPage from "./pages/NewsletterPage";
import LivesPodcastsPage from "./pages/LivesPodcastsPage";
import TermosPage from "./pages/TermosPage";
import PrivacidadePage from "./pages/PrivacidadePage";
import ContatoPage from "./pages/ContatoPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ConsentProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/post/:id" element={<ArticlePage />} />
                  <Route path="/categoria/:slug" element={<CategoryPage />} />
                  <Route path="/redes" element={<RedesPage />} />
                  <Route path="/grupos" element={<GruposPage />} />
                  <Route path="/newsletter" element={<NewsletterPage />} />
                  <Route path="/lives" element={<LivesPodcastsPage type="live" />} />
                  <Route path="/podcasts" element={<LivesPodcastsPage type="podcast" />} />
                  <Route path="/termos" element={<TermosPage />} />
                  <Route path="/privacidade" element={<PrivacidadePage />} />
                  <Route path="/contato" element={<ContatoPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <CookieBanner />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </ConsentProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
