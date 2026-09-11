import { lazy, Suspense } from "react";
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

// Code-splitting por rota: cada página vira um chunk próprio,
// reduzindo o bundle inicial e o tempo de carregamento da home.
const Index = lazy(() => import("./pages/Index"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const RedesPage = lazy(() => import("./pages/RedesPage"));
const GruposPage = lazy(() => import("./pages/GruposPage"));
const NewsletterPage = lazy(() => import("./pages/NewsletterPage"));
const LivesPodcastsPage = lazy(() => import("./pages/LivesPodcastsPage"));
const TermosPage = lazy(() => import("./pages/TermosPage"));
const PrivacidadePage = lazy(() => import("./pages/PrivacidadePage"));
const ContatoPage = lazy(() => import("./pages/ContatoPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const SubscribersPage = lazy(() => import("./pages/SubscribersPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-10 w-10 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
  </div>
);

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
                <Suspense fallback={<PageLoader />}>
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
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/assinantes" element={<SubscribersPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
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