import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { PageSeo, PUBLIC_PAGE_SEO } from "@/components/PageSeo";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Activities from "@/pages/Activities";
import EventsPage from "@/pages/Events";
import Gallery from "@/pages/Gallery";
import Contact from "@/pages/Contact";
import TestimonialsPage from "@/pages/Testimonials";
import NotFound from "@/pages/NotFound";
import Platform from "@/pages/Platform";

const queryClient = new QueryClient();

const RouteSeo = () => {
  const { pathname } = useLocation();
  const meta = PUBLIC_PAGE_SEO[pathname];
  if (!meta) {
    return (
      <PageSeo
        title="Página não encontrada"
        description="A página pedida não existe no site Betteryou Kids."
        path={pathname}
        noindex
      />
    );
  }
  const isPrivate =
    pathname === "/plataforma" ||
    pathname === "/dashboard" ||
    pathname === "/inscricoes";
  return (
    <PageSeo
      title={meta.title}
      description={meta.description}
      path={pathname}
      noindex={isPrivate}
    />
  );
};

const SiteRoutes = () => {
  const isPlatform = ["/plataforma", "/inscricoes", "/dashboard"].includes(
    useLocation().pathname,
  );

  return (
    <div className="min-h-screen bg-background">
      <RouteSeo />
      {!isPlatform && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/sobre" element={<PageTransition><About /></PageTransition>} />
          <Route path="/servicos" element={<PageTransition><Services /></PageTransition>} />
          <Route path="/actividades" element={<PageTransition><Activities /></PageTransition>} />
          <Route path="/eventos" element={<PageTransition><EventsPage /></PageTransition>} />
          <Route path="/galeria" element={<PageTransition><Gallery /></PageTransition>} />
          <Route path="/depoimentos" element={<PageTransition><TestimonialsPage /></PageTransition>} />
          <Route path="/contato" element={<PageTransition><Contact /></PageTransition>} />
          <Route path="/plataforma" element={<Platform />} />
          <Route path="/inscricoes" element={<Platform initialView="inscricoes" />} />
          <Route path="/dashboard" element={<Platform initialView="dashboard" />} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </main>
      {!isPlatform && <Footer />}
    </div>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SiteRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
