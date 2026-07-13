import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import logo from '../assets/logoPNG.png'
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: "Início", href: "/" },
    { name: "Sobre Nós", href: "/sobre" },
    { name: "Serviços", href: "/servicos" },
    { name: "Atividades", href: "/atividades" },
    { name: "Galeria", href: "/galeria" },
    { name: "Depoimentos", href: "/depoimentos" },
    { name: "Contacto", href: "/contato" },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-2 px-4">
        <div className="container mx-auto flex flex-wrap justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Phone className="h-4 w-4" />
              <span>+244 922 176 827</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>Luanda, Angola</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled || !isHomePage
          ? 'bg-white/95 backdrop-blur-md shadow-soft pt-0' 
          : 'bg-transparent pt-4'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src={logo}
                alt="Betteryou Kids Logo" 
                className="h-24 w-auto"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isScrolled || !isHomePage ? 'text-foreground' : 'text-white'
                    } hover:text-primary transition-colors duration-200 font-medium relative ${
                      isActive ? 'text-primary' : ''
                    }`}
                  >
                    {item.name}
                    {isActive && (
                      <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* CTA Button */}
            <div className="hidden lg:flex items-center space-x-4">
              <Button 
                asChild
                className="bg-gradient-warm text-white hover:shadow-colorful transition-all duration-300"
              >
                <Link to="/contato">Agendar Visita</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden p-2 rounded-md ${
                isScrolled || !isHomePage ? 'text-foreground' : 'text-white'
              } hover:text-primary transition-colors duration-200`}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden border-t py-4">
              <nav className="flex flex-col space-y-4">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`text-foreground hover:text-primary transition-colors duration-200 font-medium py-2 ${
                        isActive ? 'text-primary font-semibold' : ''
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
                <Button 
                  asChild
                  className="bg-gradient-warm text-white mt-4 w-full"
                >
                  <Link to="/contato">Agendar Visita</Link>
                </Button>
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;