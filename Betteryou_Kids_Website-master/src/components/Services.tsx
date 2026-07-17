import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Baby, Users, GraduationCap, Clock, Star, ArrowRight, Gift } from "lucide-react";

const Services = () => {
  const colorStyles = {
    pink: {
      iconBackground: "hsl(var(--pink) / 0.1)",
      icon: "hsl(var(--pink))",
      age: "hsl(var(--pink))",
      bullet: "hsl(var(--pink))",
      button: "hsl(var(--pink))",
      gradient: "linear-gradient(90deg, hsl(var(--pink)), hsl(var(--pink) / 0.8))"
    },
    secondary: {
      iconBackground: "hsl(var(--secondary) / 0.1)",
      icon: "hsl(var(--secondary))",
      age: "hsl(var(--secondary))",
      bullet: "hsl(var(--secondary))",
      button: "hsl(var(--secondary))",
      gradient: "linear-gradient(90deg, hsl(var(--secondary)), hsl(var(--secondary) / 0.8))"
    },
    green: {
      iconBackground: "hsl(var(--green) / 0.1)",
      icon: "hsl(var(--green))",
      age: "hsl(var(--green))",
      bullet: "hsl(var(--green))",
      button: "hsl(var(--green))",
      gradient: "linear-gradient(90deg, hsl(var(--green)), hsl(var(--green) / 0.8))"
    },
    accent: {
      iconBackground: "hsl(var(--accent) / 0.1)",
      icon: "hsl(var(--accent))",
      age: "hsl(var(--accent))",
      bullet: "hsl(var(--accent))",
      button: "hsl(var(--accent))",
      gradient: "linear-gradient(90deg, hsl(var(--accent)), hsl(var(--accent) / 0.8))"
    },
    purple: {
      iconBackground: "hsl(var(--purple) / 0.1)",
      icon: "hsl(var(--purple))",
      age: "hsl(var(--purple))",
      bullet: "hsl(var(--purple))",
      button: "hsl(var(--purple))",
      gradient: "linear-gradient(90deg, hsl(var(--purple)), hsl(var(--purple) / 0.8))"
    },
    red: {
      iconBackground: "hsl(var(--red) / 0.1)",
      icon: "hsl(var(--red))",
      age: "hsl(var(--red))",
      bullet: "hsl(var(--red))",
      button: "hsl(var(--red))",
      gradient: "linear-gradient(90deg, hsl(var(--red)), hsl(var(--red) / 0.8))"
    }
  } as const;

  const services = [
    {
      icon: Baby,
      title: "Creche",
      ageRange: "1-3 anos",
      description: "Cuidados especializados para os primeiros anos, com foco no desenvolvimento motor, emocional e cognitivo.",
      features: [
        "Cuidados personalizados",
        "Desenvolvimento motor",
        "Primeiras interações sociais",
        "Alimentação saudável",
        "Ambiente seguro e acolhedor"
      ],
      color: "pink",
      gradient: "from-pink to-pink/80"
    },
    {
      icon: Users,
      title: "Pré-Escolar",
      ageRange: "3-5 anos",
      description: "Preparação para a vida escolar através de actividades lúdicas e educativas que estimulam a curiosidade.",
      features: [
        "Preparação escolar",
        "Actividades lúdicas",
        "Desenvolvimento da linguagem",
        "Coordenação motora",
        "Socialização"
      ],
      color: "secondary",
      gradient: "from-secondary to-secondary/80"
    },
    {
      icon: GraduationCap,
      title: "Jardim de Infância",
      ageRange: "5-6 anos",
      description: "Transição suave para o ensino primário com actividades que desenvolvem a autonomia e responsabilidade.",
      features: [
        "Preparação para o primário",
        "Desenvolvimento da autonomia",
        "Iniciação à leitura e escrita",
        "Raciocínio lógico",
        "Responsabilidade social"
      ],
      color: "green",
      gradient: "from-green to-green/80"
    },
    {
      icon: GraduationCap,
      title: "1º Ciclo",
      ageRange: "6-10 anos",
      description: "Apoio educacional completo para o 1º Ciclo do Ensino Básico, com reforço escolar, actividades criativas e acompanhamento socioemocional.",
      features: [
        "Reforço escolar e trabalhos de casa",
        "Aulas de apoio em português, matemática e ciências",
        "Actividades lúdicas que fortalecem a autonomia",
        "Estímulo à leitura e expressão criativa",
        "Preparação para avaliações e organização do estudo",
        "Horários flexíveis adaptados às famílias"
      ],
      color: "accent",
      gradient: "from-accent to-accent/80"
    },
    {
      icon: Clock,
      title: "ATL",
      ageRange: "3-10 anos",
      description: "Actividades de tempos livres que complementam o ensino regular com diversão e aprendizado.",
      features: [
        "Apoio aos trabalhos de casa",
        "Actividades recreativas",
        "Desenvolvimento de hobbies",
        "Convívio social",
        "Flexibilidade de horários"
      ],
      color: "purple",
      gradient: "from-purple to-purple/80"
    },
    {
      icon: Gift,
      title: "Festas e Eventos Infantis",
      ageRange: "3-10 anos",
      description: "Transformamos cada celebração numa experiência única, com um espaço acolhedor, divertido e preparado para receber aniversários, batizados, festas temáticas e outros eventos infantis.",
      features: [
        "Aluguer exclusivo do espaço",
        "Parque de estacionamento",
        "Ambiente seguro e confortável",
        "Apoio na organização do evento",
        "Festas de aniversário temáticas",
        "Área de brincadeiras e entretenimento",
        "Flexibilidade de horários",
        "Espaço amplo para família e convidados",
        "Pacotes adaptados às suas necessidades"
      ],
      color: "red",
      gradient: "from-red to-red/80"
    }
  ];

  const additionalServices = [
    {
      title: "Refeições Nutritivas",
      description: "Cardápio balanceado preparado por nutricionista",
      icon: "🍎"
    },
    {
      title: "Transporte Escolar",
      description: "Serviço seguro e confiável para maior comodidade",
      icon: "🚌"
    },
    {
      title: "Acompanhamento Pedagógico",
      description: "Relatórios detalhados do desenvolvimento",
      icon: "📊"
    },
    {
      title: "Suporte Psicológico",
      description: "Apoio especializado quando necessário",
      icon: "🧠"
    }
  ];

  return (
    <section id="services" className="pt-32 pb-20 bg-gradient-to-b from-muted/30 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Nossos Serviços
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Oferecemos modalidades educativas adaptadas a cada faixa etária, 
            garantindo o desenvolvimento integral de cada criança.
          </p>
        </div>

        {/* Main Services Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {services.map((service, index) => {
            const palette = colorStyles[service.color as keyof typeof colorStyles] || colorStyles.pink;

            return (
              <Card key={index} className="shadow-soft hover:shadow-colorful transition-all duration-300 group overflow-hidden">
                <div className="h-2" style={{ backgroundImage: palette.gradient }}></div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className="p-3 rounded-full group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: palette.iconBackground }}
                      >
                        <service.icon className="h-8 w-8" style={{ color: palette.icon }} />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-primary">{service.title}</CardTitle>
                        <p className="font-semibold" style={{ color: palette.age }}>{service.ageRange}</p>
                      </div>
                    </div>
                    <Star className="h-6 w-6 text-accent animate-pulse-glow" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {service.description}
                  </p>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-primary">Principais Características:</h4>
                    <ul className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.bullet }}></div>
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    asChild
                    className="mt-6 w-full text-white hover:opacity-90"
                    style={{ backgroundColor: palette.button }}
                  >
                    <Link to="/contato">
                      Saiba Mais
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Services */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-primary mb-4">Serviços Complementares</h3>
            <p className="text-muted-foreground">
              Serviços adicionais que tornam nossa proposta ainda mais completa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalServices.map((service, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gradient-to-b from-muted/20 to-transparent hover:shadow-soft transition-shadow duration-300">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h4 className="font-semibold text-primary mb-2">{service.title}</h4>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-warm rounded-2xl p-8 md:p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">
              Pronto para conhecer nossos serviços?
            </h3>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Entre em contacto conosco para agendar uma visita e conhecer de perto 
              como podemos contribuir para o desenvolvimento do seu filho.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8"
              >
                <Link to="/contato">
                  <Users className="mr-2 h-5 w-5" />
                  Agendar Visita
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;