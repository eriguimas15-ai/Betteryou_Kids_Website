import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Star } from "lucide-react";
import heroImage from "@/assets/hero-classroom.jpg";
import natureImage from "@/assets/nature-play.jpg";
import creativeImage from "@/assets/creative-activities.jpg";
import { getPublicCmsPage, uploadPublicUrl } from "@/lib/api";
import {
  DEFAULT_CMS_HERO_BUTTONS,
  parseHeroButtonsJson,
  parseHeroSlidesJson,
  slidesFromLegacyFields,
  buttonsFromLegacyCta,
  type CmsHeroButton,
  type CmsHeroSlide,
} from "@/lib/hero-cms";

type HeroSlide = {
  image: string;
  title: string;
  highlight: string;
  subtitle: string;
  description: string;
  color1: string;
  color2: string;
  bgGradient: string;
  /** Cores das 3 linhas do título via CMS (hex). Vazio = usa a classe predefinida. */
  line1ColorHex?: string;
  line2ColorHex?: string;
  line3ColorHex?: string;
  descriptionColorHex?: string;
};

const FALLBACK_IMAGES = [heroImage, natureImage, creativeImage];
const FALLBACK_GRADIENTS = [
  "from-pink-100/90 via-purple-50/80 to-green-100/70",
  "from-green-100/90 via-blue-50/80 to-yellow-100/70",
  "from-purple-100/90 via-pink-50/80 to-orange-100/70",
];
const FALLBACK_COLOR1 = ["text-pink-400", "text-green-500", "text-purple-500"];
const FALLBACK_COLOR2 = ["text-green-400", "text-blue-400", "text-orange-400"];

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    image: heroImage,
    title: "O amor guia,",
    highlight: "a natureza inspira",
    subtitle: "e a criatividade transforma",
    description:
      "Na Betteryou Kids, proporcionamos uma educação afectiva e inovadora que prepara seus filhos para um futuro brilhante através de metodologias únicas baseadas no amor, conexão com a natureza e estímulo à criatividade.",
    color1: "text-pink-400",
    color2: "text-green-400",
    bgGradient: FALLBACK_GRADIENTS[0],
    line1ColorHex: "#1e293b",
    line2ColorHex: "#ea579a",
    line3ColorHex: "#50c878",
  },
  {
    image: natureImage,
    title: "Explorando juntos",
    highlight: "o mundo natural",
    subtitle: "com curiosidade e alegria",
    description:
      "Oferecemos experiências únicas de aprendizagem ao ar livre, onde cada criança descobre seu potencial através da conexão profunda com a natureza e actividades que estimulam todos os sentidos.",
    color1: "text-green-500",
    color2: "text-blue-400",
    bgGradient: FALLBACK_GRADIENTS[1],
  },
  {
    image: creativeImage,
    title: "Desenvolvendo talentos",
    highlight: "através da arte",
    subtitle: "e expressão criativa",
    description:
      "Nossas actividades artísticas e culturais permitem que cada criança explore sua criatividade única, desenvolvendo habilidades essenciais para a vida através de música, dança, arte e muito mais.",
    color1: "text-purple-500",
    color2: "text-orange-400",
    bgGradient: FALLBACK_GRADIENTS[2],
  },
];

function sectionValue(
  sections: Array<{ key: string; value: string }> | undefined,
  key: string,
): string {
  return sections?.find((s) => s.key === key)?.value?.trim() || "";
}

function resolveImageUrl(raw: string | undefined, index: number): string {
  const value = raw?.trim();
  if (!value) return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  if (value.startsWith("http") || value.startsWith("data:") || value.startsWith("/")) {
    return value.startsWith("/uploads/") ? uploadPublicUrl(value) : value;
  }
  return uploadPublicUrl(value);
}

function mapCmsSlide(slide: CmsHeroSlide, index: number): HeroSlide {
  return {
    image: resolveImageUrl(slide.imageUrl, index),
    title: slide.line1,
    highlight: slide.line2,
    subtitle: slide.line3,
    description: slide.description,
    color1: FALLBACK_COLOR1[index % FALLBACK_COLOR1.length],
    color2: FALLBACK_COLOR2[index % FALLBACK_COLOR2.length],
    bgGradient: FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length],
    line1ColorHex: slide.line1Color || undefined,
    line2ColorHex: slide.line2Color || undefined,
    line3ColorHex: slide.line3Color || undefined,
    descriptionColorHex: slide.descriptionColor || undefined,
  };
}

const ModernSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES);
  const [buttons, setButtons] = useState<CmsHeroButton[]>(DEFAULT_CMS_HERO_BUTTONS);

  useEffect(() => {
    let cancelled = false;
    getPublicCmsPage("home")
      .then((page) => {
        if (cancelled) return;
        const slidesJson = sectionValue(page.sections, "hero_slides");
        const buttonsJson = sectionValue(page.sections, "hero_buttons");
        const parsedSlides = parseHeroSlidesJson(slidesJson);
        const parsedButtons = parseHeroButtonsJson(buttonsJson);

        if (parsedSlides?.length) {
          setSlides(parsedSlides.map(mapCmsSlide));
          setCurrentSlide(0);
        } else {
          const line1 = sectionValue(page.sections, "hero_title_line1");
          const line2 = sectionValue(page.sections, "hero_title_line2");
          const line3 = sectionValue(page.sections, "hero_title_line3");
          const line1Color = sectionValue(page.sections, "hero_title_line1_color");
          const line2Color = sectionValue(page.sections, "hero_title_line2_color");
          const line3Color = sectionValue(page.sections, "hero_title_line3_color");
          const heroTitle = sectionValue(page.sections, "hero_title");
          const heroSubtitle = sectionValue(page.sections, "hero_subtitle");
          const titleColor = sectionValue(page.sections, "title_color");
          const subtitleColor = sectionValue(page.sections, "subtitle_color");
          const hasLines = Boolean(line1 || line2 || line3);

          if (hasLines || heroTitle || heroSubtitle) {
            let l1 = line1;
            let l2 = line2;
            let l3 = line3;
            if (!hasLines && heroTitle) {
              const parts = heroTitle
                .split(/\r?\n/)
                .map((p) => p.trim())
                .filter(Boolean);
              if (parts.length >= 2) {
                l1 = parts[0] ?? "";
                l2 = parts[1] ?? "";
                l3 = parts[2] ?? "";
              } else {
                l1 = heroTitle;
                l2 = "";
                l3 = "";
              }
            }
            const legacy = slidesFromLegacyFields({
              line1: l1,
              line2: l2,
              line3: l3,
              line1Color: line1Color || titleColor,
              line2Color: line2Color,
              line3Color: line3Color,
              description: heroSubtitle,
              descriptionColor: subtitleColor,
            });
            setSlides(legacy.map(mapCmsSlide));
            setCurrentSlide(0);
          }
        }

        if (parsedButtons?.length) {
          setButtons(parsedButtons);
        } else {
          const cta = sectionValue(page.sections, "cta_primary");
          if (cta) setButtons(buttonsFromLegacyCta(cta));
        }
      })
      .catch(() => {
        // Mantém o conteúdo hardcoded se a API falhar.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAutoPlay || slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlay, slides.length]);

  const nextSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const active = slides[currentSlide] ?? slides[0];
  if (!active) return null;

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
              <span
                className="block animate-fade-in-up drop-shadow-sm text-slate-800"
                style={{
                  color: slides[currentSlide].line1ColorHex,
                }}
              >
                {slides[currentSlide].title}
              </span>
              {slides[currentSlide].highlight ? (
                <span
                  className={`block ${slides[currentSlide].color1} drop-shadow-md animate-fade-in-up`}
                  style={{
                    animationDelay: "0.2s",
                    color: slides[currentSlide].line2ColorHex,
                  }}
                >
                  {slides[currentSlide].highlight}
                </span>
              ) : null}
              {slides[currentSlide].subtitle ? (
                <span
                  className={`block ${slides[currentSlide].color2} drop-shadow-md animate-fade-in-up`}
                  style={{
                    animationDelay: "0.4s",
                    color: slides[currentSlide].line3ColorHex,
                  }}
                >
                  {slides[currentSlide].subtitle}
                </span>
              ) : null}
            </h1>

            {/* Descrição clara e acolhedora */}
            <p className="text-lg md:text-xl lg:text-2xl text-gray-700 max-w-4xl leading-relaxed mb-12 animate-fade-in-up bg-white/40 backdrop-blur-sm p-6 rounded-2xl shadow-sm"
               style={{animationDelay: '0.6s', color: slides[currentSlide].descriptionColorHex}}>
              {slides[currentSlide].description}
            </p>
          </div>

          {/* Botões de acção (editáveis no Conteúdo do site) */}
          {buttons.length > 0 ? (
            <div
              className="flex flex-col sm:flex-row gap-4 animate-fade-in-up"
              style={{ animationDelay: "0.8s" }}
            >
              {buttons.map((btn) =>
                btn.style === "primary" ? (
                  <Link
                    key={btn.id}
                    to={btn.href || "/"}
                    className="group px-8 py-4 bg-gradient-to-r from-pink-400 to-purple-500 text-white font-semibold text-lg rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center justify-center"
                  >
                    <Heart
                      className="mr-2 h-5 w-5 group-hover:animate-pulse"
                      fill="currentColor"
                    />
                    {btn.label}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                ) : (
                  <Link
                    key={btn.id}
                    to={btn.href || "/"}
                    className="group px-8 py-4 bg-white/90 text-gray-700 font-semibold text-lg rounded-full border-2 border-green-300 hover:bg-green-50 hover:border-green-400 transition-all duration-300 hover:scale-105 shadow-lg inline-flex items-center justify-center"
                  >
                    <Star
                      className="mr-2 h-5 w-5 group-hover:text-yellow-500 transition-colors duration-300"
                      fill="currentColor"
                    />
                    {btn.label}
                  </Link>
                ),
              )}
            </div>
          ) : null}
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

      <style>{`
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