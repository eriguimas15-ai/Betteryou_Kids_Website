import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Activities from "@/pages/Activities";
import Gallery from "@/pages/Gallery";
import Contact from "@/pages/Contact";
import TestimonialsPage from "@/pages/Testimonials";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/sobre" element={<PageTransition><About /></PageTransition>} />
              <Route path="/servicos" element={<PageTransition><Services /></PageTransition>} />
              <Route path="/atividades" element={<PageTransition><Activities /></PageTransition>} />
              <Route path="/galeria" element={<PageTransition><Gallery /></PageTransition>} />
              <Route path="/depoimentos" element={<PageTransition><TestimonialsPage /></PageTransition>} />
              <Route path="/contato" element={<PageTransition><Contact /></PageTransition>} />
              <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
