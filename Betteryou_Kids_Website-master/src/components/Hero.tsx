import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import heroImage from "@/assets/hero-classroom.jpg";
import natureImage from "@/assets/nature-play.jpg";
import creativeImage from "@/assets/creative-activities.jpg";

const ModernSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const slides = [
    {
      image: heroImage,
      title: "O amor guia,",
      highlight: "a natureza inspira",
      subtitle: "e a criatividade transforma",
      description: "Na Betteryou Kids, proporcionamos uma educação afetiva e inovadora que prepara seus filhos para um futuro brilhante através de metodologias únicas baseadas no amor, conexão com a natureza e estímulo à criatividade.",
      color1: "text-pink-400",
      color2: "text-green-400",
      bgGradient: "from-pink-100/90 via-purple-50/80 to-green-100/70"
    },
    {
      image: natureImage,
      title: "Explorando juntos",
      highlight: "o mundo natural",
      subtitle: "com curiosidade e alegria",
      description: "Oferecemos experiências únicas de aprendizado ao ar livre, onde cada criança descobre seu potencial através da conexão profunda com a natureza e actividades que estimulam todos os sentidos.",
      color1: "text-green-500",
      color2: "text-blue-400",
      bgGradient: "from-green-100/90 via-blue-50/80 to-yellow-100/70"
    },
    {
      image: creativeImage,
      title: "Desenvolvendo talentos",
      highlight: "através da arte",
      subtitle: "e expressão criativa",
      description: "Nossas actividades artísticas e culturais permitem que cada criança explore sua criatividade única, desenvolvendo habilidades essenciais para a vida através de música, dança, arte e muito mais.",
      color1: "text-purple-500",
      color2: "text-orange-400",
      bgGradient: "from-purple-100/90 via-pink-50/80 to-orange-100/70"
    }
  ];

  useEffect(() => {
    if (!isAutoPlay) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [isAutoPlay, slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-blue-50 to-pink-50">
      {/* Background Images com filtro suave */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-out ${
              index === currentSlide 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-105'
            }`}
          >
            <div className="relative w-full h-full">
              <img 
                src={slide.image} 
                alt={`Slide ${index + 1}`}
                className={`w-full h-full object-cover transition-transform duration-[8000ms] ease-out ${
                  index === currentSlide ? 'scale-110' : 'scale-100'
                }`}
                style={{
                  filter: 'brightness(1.1) contrast(0.9) saturate(1.1)',
                }}
              />
               <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-secondary/60 to-pink/50 animate-pulse"></div>
              <div className={`absolute inset-0 bg-gradient-to-t from-black/30 to-transparent transition-opacity duration-2000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}></div>

            </div>
          </div>
        ))}
      </div>

      {/* Elementos decoractivos infantis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Estrelinhas flutuantes */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute animate-bounce opacity-60"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          >
            <Star 
              className={`${
                i % 4 === 0 ? 'text-yellow-400' : 
                i % 4 === 1 ? 'text-pink-400' : 
                i % 4 === 2 ? 'text-green-400' : 'text-purple-400'
              } drop-shadow-sm`}
              size={12 + Math.random() * 16}
              fill="currentColor"
            />
          </div>
        ))}
        
        {/* Corações flutuantes */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`heart-${i}`}
            className="absolute animate-float opacity-50"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${15 + Math.random() * 70}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <Heart 
              className="text-pink-300 drop-shadow-sm"
              size={8 + Math.random() * 12}
              fill="currentColor"
            />
          </div>
        ))}

        {/* Formas geométricas suaves */}
        <div className="absolute top-1/4 left-1/6 w-20 h-20 bg-yellow-200/40 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/5 w-16 h-16 bg-green-200/40 rotate-45 animate-spin-slow"></div>
        <div className="absolute top-1/2 right-1/3 w-12 h-12 bg-pink-200/40 rounded-full animate-bounce"></div>
      </div>

      {/* Navegação amigável */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 z-30">
        <button
          onClick={prevSlide}
          className="group p-3 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white transition-all duration-300 hover:scale-110 shadow-lg border-2 border-pink-200/50"
        >
          <ChevronLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform duration-300" />
        </button>
      </div>
      
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-30">
        <button
          onClick={nextSlide}
          className="group p-3 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white transition-all duration-300 hover:scale-110 shadow-lg border-2 border-pink-200/50"
        >
          <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-6 lg:px-8 relative z-20 pt-16">
        <div className="max-w-5xl">
          <div className="text-gray-800 mb-10">
            {/* Título com cores alegres */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              <span className="block animate-fade-in-up drop-shadow-sm">
                {slides[currentSlide].title}
              </span>
              <span className={`block ${slides[currentSlide].color1} drop-shadow-md animate-fade-in-up`} 
                    style={{animationDelay: '0.2s'}}>
                {slides[currentSlide].highlight}
              </span>
              <span className={`block ${slides[currentSlide].color2} drop-shadow-md animate-fade-in-up`}
                    style={{animationDelay: '0.4s'}}>
                {slides[currentSlide].subtitle}
              </span>
            </h1>

            {/* Descrição clara e acolhedora */}
            <p className="text-lg md:text-xl lg:text-2xl text-gray-700 max-w-4xl leading-relaxed mb-12 animate-fade-in-up bg-white/40 backdrop-blur-sm p-6 rounded-2xl shadow-sm"
               style={{animationDelay: '0.6s'}}>
              {slides[currentSlide].description}
            </p>
          </div>

          {/* Botões de acção amigáveis */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
            <Link to="/contato" className="group px-8 py-4 bg-gradient-to-r from-pink-400 to-purple-500 text-white font-semibold text-lg rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center justify-center">
              <Heart className="mr-2 h-5 w-5 group-hover:animate-pulse" fill="currentColor" />
              Agendar Visita
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            
            <Link to="/servicos" className="group px-8 py-4 bg-white/90 text-gray-700 font-semibold text-lg rounded-full border-2 border-green-300 hover:bg-green-50 hover:border-green-400 transition-all duration-300 hover:scale-105 shadow-lg inline-flex items-center justify-center">
              <Star className="mr-2 h-5 w-5 group-hover:text-yellow-500 transition-colors duration-300" fill="currentColor" />
              Conhecer Serviços
            </Link>
          </div>
        </div>
      </div>

      {/* Indicadores coloridos */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/50">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`relative transition-all duration-300 rounded-full ${
                index === currentSlide 
                  ? 'w-8 h-4 bg-gradient-to-r from-pink-400 to-purple-500 shadow-md' 
                  : 'w-4 h-4 bg-gray-300 hover:bg-gray-400'
              }`}
            >
              {index === currentSlide && (
                <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-purple-400 rounded-full animate-pulse opacity-70"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  );
};

export default ModernSlider;