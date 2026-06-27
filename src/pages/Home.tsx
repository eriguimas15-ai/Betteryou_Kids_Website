import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Leaf, Sparkles, ArrowRight, Users, Award, Star, BookOpen, Palette, Music } from "lucide-react";
import Hero from "@/components/Hero";
import DynamicStats from "@/components/DynamicStats";
import heroImage from "@/assets/hero-classroom.jpg";
import natureImage from "@/assets/nature-play.jpg";
import creativeImage from "@/assets/creative-activities.jpg";

const Home = () => {
  const features = [
    {
      icon: Heart,
      title: "Educação Afetiva",
      description: "Baseada no amor e cuidado individualizado",
      color: "text-pink"
    },
    {
      icon: Leaf,
      title: "Conexão Natural",
      description: "Aprendizado ao ar livre e sustentável",
      color: "text-green"
    },
    {
      icon: Sparkles,
      title: "Criatividade",
      description: "Estímulo à imaginação e expressão",
      color: "text-accent"
    },
    {
      icon: BookOpen,
      title: "Metodologia Inovadora",
      description: "Abordagem pedagógica moderna e eficaz",
      color: "text-blue"
    }
  ];

  const services = [
    {
      title: "Creche",
      age: "1-3 anos",
      description: "Cuidado especializado para os primeiros passos",
      image: heroImage
    },
    {
      title: "Pré-Escolar",
      age: "3-5 anos",
      description: "Desenvolvimento cognitivo e social",
      image: natureImage
    },
    {
      title: "Jardim de Infância",
      age: "5-6 anos",
      description: "Preparação para o ensino fundamental",
      image: creativeImage
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Mãe do João",
      text: "A Betteryou Kids transformou a vida do meu filho. Ele aprende brincando e sempre chega em casa feliz!",
      rating: 5
    },
    {
      name: "Carlos Mendes",
      role: "Pai da Ana",
      text: "Excelente metodologia. Nossa filha desenvolveu muito a criatividade e as habilidades sociais.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Dynamic Image Slider */}
      <Hero />

      {/* Dynamic Stats Section */}
      <DynamicStats />

      {/* About Summary Section */}
      <section className="py-20 bg-gradient-to-b from-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-pink bg-clip-text text-transparent mb-6">
              Sobre a Betteryou Kids
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Somos uma instituição educacional revolucionária que transforma o futuro através da educação afetiva. 
              Nossa missão é formar crianças felizes, criativas e preparadas para um mundo em constante evolução, 
              utilizando metodologias inovadoras que integram amor, natureza e criatividade em cada momento de aprendizado.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center group hover:shadow-colorful transition-all duration-500 hover:scale-105 animate-slide-up border-l-4 border-l-transparent hover:border-l-primary" style={{animationDelay: `${index * 0.2}s`}}>
                <CardContent className="p-8">
                  <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full group-hover:shadow-colorful transition-all duration-300 group-hover:rotate-12">
                      <feature.icon className={`h-8 w-8 ${feature.color} group-hover:scale-110 transition-transform duration-300`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-3 group-hover:text-pink transition-colors duration-300">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Summary Section */}
      <section className="py-20 bg-gradient-to-b from-card to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-secondary to-green bg-clip-text text-transparent mb-6">
              Nossos Serviços
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Oferecemos programas educacionais completos e transformadores, cuidadosamente adaptados para cada faixa etária. 
              Desde creche até jardim de infância, nossas metodologias inovadoras proporcionam cuidado individualizado 
              que respeita o tempo único e as necessidades especiais de cada criança em sua jornada de descobertas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-colorful transition-all duration-500 overflow-hidden hover:scale-105 animate-slide-up" style={{animationDelay: `${index * 0.2}s`}}>
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent group-hover:from-pink/70 transition-all duration-300"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <span className="text-sm font-medium bg-accent px-3 py-1 rounded-full shadow-lg">{service.age}</span>
                  </div>
                </div>
                <CardContent className="p-6 bg-gradient-to-b from-card to-muted/30">
                  <h3 className="text-xl font-semibold text-primary mb-3 group-hover:text-pink transition-colors duration-300">{service.title}</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">{service.description}</p>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-white transition-all duration-300"
                    onClick={() => window.location.href = '/servicos'}
                  >
                    Saiba Mais
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              onClick={() => window.location.href = '/sobre'}
            >
              Conheça Nossa História
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Activities Summary Section */}
      <section className="py-20 bg-gradient-to-b from-green/5 to-blue/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green to-blue bg-clip-text text-transparent mb-6">
              Atividades e Experiências
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Nossa ampla gama de atividades foi cuidadosamente desenvolvida para estimular o desenvolvimento integral 
              das crianças. Desde jiu-jitsu e ballet até música e arte, cada experiência é planejada com foco na 
              criatividade, expressão pessoal e conexão profunda com a natureza.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="group hover:shadow-colorful transition-all duration-500 hover:scale-105 animate-slide-in-left border-t-4 border-t-pink">
              <CardContent className="p-8 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="p-4 bg-gradient-warm rounded-full group-hover:rotate-12 transition-transform duration-300">
                    <Music className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-primary mb-3 group-hover:text-pink transition-colors duration-300">Artes & Música</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ballet, música e expressão artística para desenvolver criatividade, coordenação e sensibilidade estética.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-colorful transition-all duration-500 hover:scale-105 animate-bounce-in border-t-4 border-t-green" style={{animationDelay: '0.2s'}}>
              <CardContent className="p-8 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="p-4 bg-gradient-nature rounded-full group-hover:rotate-12 transition-transform duration-300">
                    <Leaf className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-primary mb-3 group-hover:text-green transition-colors duration-300">Natureza & Movimento</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Jiu-jitsu, atividades ao ar livre e exploração da natureza para desenvolvimento físico completo.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-colorful transition-all duration-500 hover:scale-105 animate-slide-in-right border-t-4 border-t-blue" style={{animationDelay: '0.4s'}}>
              <CardContent className="p-8 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="p-4 bg-gradient-hero rounded-full group-hover:rotate-12 transition-transform duration-300">
                    <Palette className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-primary mb-3 group-hover:text-blue transition-colors duration-300">Criatividade & Expressão</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Oficinas de arte, teatro e projetos criativos que estimulam a imaginação e autoexpressão.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              onClick={() => window.location.href = '/atividades'}
            >
              Ver Todas as Atividades
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Gallery Summary Section */}
      <section className="py-20 bg-gradient-to-b from-card to-pink/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Nossa Galeria
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
              Explore nossos espaços educativos e veja momentos especiais das crianças 
              em atividades, brincadeiras e aprendizado. Cada foto conta uma história 
              de crescimento, alegria e descobertas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="relative group overflow-hidden rounded-lg">
              <img 
                src={heroImage} 
                alt="Sala de aula"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h4 className="font-semibold">Salas de Aula</h4>
                <p className="text-sm text-white/80">Ambientes preparados para aprendizado</p>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-lg">
              <img 
                src={natureImage} 
                alt="Área externa"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-green/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h4 className="font-semibold">Espaços Naturais</h4>
                <p className="text-sm text-white/80">Conexão com a natureza</p>
              </div>
            </div>

            <div className="relative group overflow-hidden rounded-lg">
              <img 
                src={creativeImage} 
                alt="Atividades criativas"
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pink/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h4 className="font-semibold">Atividades Criativas</h4>
                <p className="text-sm text-white/80">Expressão e arte</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8"
              onClick={() => window.location.href = '/galeria'}
            >
              Ver Galeria Completa
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              O que as famílias dizem
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Depoimentos reais de pais e famílias que confiam na Betteryou Kids.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-colorful transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-accent fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <h4 className="font-semibold text-primary">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8"
              onClick={() => window.location.href = '/sobre'}
            >
              Ver Mais Depoimentos
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para conhecer a Betteryou Kids?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">
            Agende uma visita e descubra como podemos contribuir para o desenvolvimento do seu filho.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-primary font-semibold px-8 py-4 text-lg"
              onClick={() => window.location.href = '/contato'}
            >
              Agendar Visita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-primary px-8 py-4 text-lg"
              onClick={() => window.location.href = '/sobre'}
            >
              Conhecer Mais
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;