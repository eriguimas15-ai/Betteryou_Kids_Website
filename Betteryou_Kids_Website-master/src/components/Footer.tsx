import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Heart, Mail, Phone, MapPin, Facebook, Instagram, Linkedin, ChevronUp, School } from "lucide-react";

const EMAIL_STORAGE_KEY = "betteryou_newsletter_emails";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const quickLinks = [
    { name: "Sobre Nós", href: "/sobre" },
    { name: "Serviços", href: "/servicos" },
    { name: "Actividades", href: "/actividades" },
    { name: "Galeria", href: "/galeria" },
    { name: "Depoimentos", href: "/depoimentos" },
    { name: "Contacto", href: "/contato" }
  ];

  const services = [
    { name: "Creche (1-3 anos)", href: "/servicos" },
    { name: "Pré-Escolar (3-5 anos)", href: "/servicos" },
    { name: "Jardim de Infância (5-6 anos)", href: "/servicos" },
    { name: "1º Ciclo (6-10 anos)", href: "/servicos" },
    { name: "ATL", href: "/servicos" },
    { name: "Festas e Eventos Infantis", href: "/servicos" }
  ];

  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/people/betteryoukids/100071268902405/", color: "blue" },
    { icon: Instagram, href: "https://www.instagram.com/betteryou.kids/?utm_medium=copy_link", color: "pink" },
    { icon: Linkedin, href: "https://www.linkedin.com/company/betteryoukids/", color: "secondary" }
  ];

  useEffect(() => {
    const stored = localStorage.getItem(EMAIL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        setSavedCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch {
        setSavedCount(0);
      }
    }
  }, []);

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubscribe = () => {
    const trimmed = email.trim().toLowerCase();
    if (!validateEmail(trimmed)) {
      setStatusMessage("Por favor, insira um email válido.");
      return;
    }

    const stored = localStorage.getItem(EMAIL_STORAGE_KEY);
    const list = stored ? JSON.parse(stored) as string[] : [];
    if (list.includes(trimmed)) {
      setStatusMessage("Esse email já está registrado para novidades.");
      return;
    }

    const updated = [...list, trimmed];
    localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(updated));
    setSavedCount(updated.length);
    setEmail("");
    setStatusMessage("Email registrado! Você receberá novidades assim que houver actualizações.");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSubscribe();
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Newsletter Section */}
      <div className="border-b border-primary-foreground/20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">
              Mantenha-se Actualizado
            </h3>
            <p className="text-primary-foreground/80 mb-8">
              Receba novidades, dicas educativas e informações sobre serviços, actividades e eventos da Betteryou Kids
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input 
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                aria-label="Email para newsletter"
                placeholder="Seu melhor email"
                className="bg-transparent border-white/20 text-white placeholder:text-white/60"
              />
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-primary font-semibold px-8">
                <Mail className="mr-2 h-4 w-4" />
                Inscrever
              </Button>
            </form>
            {statusMessage && (
              <p className="mt-4 text-sm text-white/80 max-w-md mx-auto">{statusMessage}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <School className="h-5 w-5 text-accent" />
                <span className="text-sm uppercase tracking-[0.18em] text-accent font-semibold">
                  Educação Efetiva
                </span>
              </div>
              <p className="text-primary-foreground/80 leading-relaxed mb-4">
                Educação afetiva e inovadora que prepara as crianças para um futuro brilhante, 
                em harmonia com a natureza e estimulando sua criatividade natural.
              </p>
              <div className="flex items-center text-accent">
                <Heart className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">O amor guia nossa missão</span>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-semibold mb-4">Siga-nos</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visitar ${social.color}`}
                    className={`p-2 bg-white/10 hover:bg-${social.color}/20 rounded-full transition-colors duration-300`}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-6">Links Rápidos</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.href}
                    className="text-primary-foreground/80 hover:text-accent transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-6">Nossos Serviços</h4>
            <ul className="space-y-3">
              {services.map((service, index) => (
                <li key={index}>
                  <Link 
                    to={service.href}
                    className="text-primary-foreground/80 hover:text-accent transition-colors duration-200"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-6">Informações de Contacto</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium">Av. Cmte. Gika 150, Luanda</p>
                  <a
                    href="https://maps.app.goo.gl/r5rAJXaTU8F2Xccj9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-foreground/80 hover:text-accent transition-colors duration-200"
                  >
                    Ver no Google Maps
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium">+244 921 669 893</p>
                  <p className="text-sm text-primary-foreground/80">Chamada e WhatsApp</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium">Segunda Unidade</p>
                  <p className="text-sm text-primary-foreground/80">Rua Urbanização Harmonia, 540 A Patriota casa N, Luanda</p>
                  <a
                    href="https://maps.app.goo.gl/cukitSpAWHWFv5jR7?g_st=ac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-foreground/80 hover:text-accent transition-colors duration-200"
                  >
                    Ver no Google Maps
                  </a>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium">+244 942 043 710</p>
                  <p className="text-sm text-primary-foreground/80">Contacto da Segunda Unidade</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium">patriota@betteryoukids.com</p>
                  <p className="text-sm text-primary-foreground/80">Email da Segunda Unidade</p>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-primary-foreground/80">
            <div className="mb-4 md:mb-0">
              <p>&copy; 2024 Betteryou Kids. Todos os direitos reservados.</p>
            </div>
            <div className="flex flex-wrap gap-6">
              <a href="#" className="hover:text-accent transition-colors duration-200">
                Política de Privacidade
              </a>
              <a href="#" className="hover:text-accent transition-colors duration-200">
                Termos de Uso
              </a>
              <a href="#" className="hover:text-accent transition-colors duration-200">
                Cookies
              </a>
              <a href="#" className="hover:text-accent transition-colors duration-200">
                Certificações
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <Button
        type="button"
        onClick={scrollToTop}
        aria-label="Voltar ao topo da página"
        className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary hover:bg-primary/90 text-white shadow-colorful hover:shadow-lg transition-all duration-300 animate-bounce"
        size="icon"
      >
        <ChevronUp className="h-5 w-5" />
      </Button>
    </footer>
  );
};

export default Footer;