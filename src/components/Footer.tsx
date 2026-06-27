import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Heart, Mail, Phone, MapPin, Facebook, Instagram, Youtube, Linkedin, ChevronUp } from "lucide-react";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const quickLinks = [
    { name: "Sobre Nós", href: "/sobre" },
    { name: "Serviços", href: "/servicos" },
    { name: "Atividades", href: "/atividades" },
    { name: "Galeria", href: "/galeria" },
    { name: "Contato", href: "/contato" }
  ];

  const services = [
    { name: "Creche (1-3 anos)", href: "/servicos" },
    { name: "Pré-Escolar (3-5 anos)", href: "/servicos" },
    { name: "Jardim de Infância (5-6 anos)", href: "/servicos" },
    { name: "ATL (6-8 anos)", href: "/servicos" }
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", color: "blue" },
    { icon: Instagram, href: "#", color: "pink" },
    { icon: Youtube, href: "#", color: "accent" },
    { icon: Linkedin, href: "#", color: "secondary" }
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Newsletter Section */}
      <div className="border-b border-primary-foreground/20">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">
              Mantenha-se Atualizado
            </h3>
            <p className="text-primary-foreground/80 mb-8">
              Receba novidades, dicas educativas e informações sobre eventos da Betteryou Kids
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input 
                type="email"
                autoComplete="email"
                aria-label="Email para newsletter"
                placeholder="Seu melhor email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Button type="button" className="bg-accent hover:bg-accent/90 text-primary font-semibold px-8">
                <Mail className="mr-2 h-4 w-4" />
                Inscrever
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <img 
                src="/lovable-uploads/38eb8b38-b5cc-49b3-9b89-3613d102ad65.png" 
                alt="Betteryou Kids Logo" 
                className="h-12 w-auto mb-4 brightness-0 invert"
              />
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
                  <a 
                    href={link.href}
                    className="text-primary-foreground/80 hover:text-accent transition-colors duration-200"
                  >
                    {link.name}
                  </a>
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
                  <a 
                    href={service.href}
                    className="text-primary-foreground/80 hover:text-accent transition-colors duration-200"
                  >
                    {service.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-6">Informações de Contato</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium">Luanda, Angola</p>
                  <p className="text-sm text-primary-foreground/80">Rua Principal, Bairro Nobre</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium">+244 XXX XXX XXX</p>
                  <p className="text-sm text-primary-foreground/80">Segunda a Sexta: 7h às 18h</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium">info@betteryoukids.ao</p>
                  <p className="text-sm text-primary-foreground/80">Resposta em 24h</p>
                </div>
              </div>
            </div>

            <Button 
              type="button"
              className="mt-6 w-full bg-accent hover:bg-accent/90 text-primary font-semibold"
            >
              Agendar Visita
            </Button>
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