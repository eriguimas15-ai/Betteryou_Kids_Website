import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import heroImage from "@/assets/hero-classroom.svg";
import natureImage from "@/assets/nature-play.svg";
import creativeImage from "@/assets/creative-activities.svg";

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: heroImage,
      title: "O amor guia,",
      highlight: "a natureza inspira",
      subtitle: "e a criatividade transforma",
      description: "Na Betteryou Kids, proporcionamos uma educação afetiva e inovadora que prepara seus filhos para um futuro brilhante através de metodologias únicas baseadas no amor, conexão com a natureza e estímulo à criatividade.",
      highlightColor: "text-accent",
      subtitleColor: "text-pink"
    },
    {
      image: natureImage,
      title: "Explorando juntos",
      highlight: "o mundo natural",
      subtitle: "com curiosidade e alegria",
      description: "Oferecemos experiências únicas de aprendizado ao ar livre, onde cada criança descobre seu potencial através da conexão profunda com a natureza e atividades que estimulam todos os sentidos.",
      highlightColor: "text-green",
      subtitleColor: "text-blue"
    },
    {
      image: creativeImage,
      title: "Desenvolvendo talentos",
      highlight: "através da arte",
      subtitle: "e expressão criativa",
      description: "Nossas atividades artísticas e culturais permitem que cada criança explore sua criatividade única, desenvolvendo habilidades essenciais para a vida através de música, dança, arte e muito mais.",
      highlightColor: "text-pink",
      subtitleColor: "text-accent"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Modern Animated Image Slider */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-[2000ms] ease-out ${
              index === currentSlide 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-110'
            }`}
          >
            <div className="relative w-full h-full overflow-hidden">
              <img 
                src={slide.image} 
                alt={`Slide ${index + 1}`}
                className={`w-full h-full object-cover transform transition-transform duration-[8000ms] ease-out ${
                  index === currentSlide ? 'scale-110' : 'scale-100'
                }`}
                style={{
                  filter: 'brightness(0.8) contrast(1.1) saturate(1.2)',
                }}
              />
              {/* Animated overlay gradients */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-secondary/60 to-pink/50 animate-pulse"></div>
              <div className={`absolute inset-0 bg-gradient-to-t from-black/30 to-transparent transition-opacity duration-2000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Animated Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <div 
              className={`rounded-full ${
                i % 3 === 0 ? 'bg-accent' : i % 3 === 1 ? 'bg-pink' : 'bg-green'
              }/30`}
              style={{
                width: `${8 + Math.random() * 16}px`,
                height: `${8 + Math.random() * 16}px`,
              }}
            ></div>
          </div>
        ))}
      </div>

      {/* Parallax Moving Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-accent/10 to-pink/10 rounded-full animate-spin-slow"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-to-br from-green/10 to-blue/10 rounded-full animate-bounce-slow"></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-pink/15 to-accent/15 rounded-full animate-pulse"></div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-300 hover:scale-110"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-24">
        <div className="max-w-5xl">
          <div className="text-white mb-12">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight animate-fade-in-up">
              {slides[currentSlide].title}{" "}
              <span className={`${slides[currentSlide].highlightColor} drop-shadow-lg animate-pulse-glow`}>
                {slides[currentSlide].highlight}
              </span>{" "}
              <span className={`${slides[currentSlide].subtitleColor} drop-shadow-lg animate-pulse-glow`}>
                {slides[currentSlide].subtitle}
              </span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-10 text-white/95 max-w-4xl leading-relaxed animate-slide-in-left" style={{animationDelay: '0.3s'}}>
              {slides[currentSlide].description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slide-in-right" style={{animationDelay: '0.6s'}}>
            <Button 
              asChild
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-primary font-semibold px-8 py-4 text-lg shadow-colorful hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Link to="/contato">
                Agendar Visita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-primary px-8 py-4 text-lg backdrop-blur-sm hover:scale-105 transition-all duration-300"
            >
              <Link to="/servicos">Conhecer Serviços</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;