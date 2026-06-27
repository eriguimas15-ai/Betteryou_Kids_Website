import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Baby, Users, GraduationCap, Clock, Star, ArrowRight } from "lucide-react";

const Services = () => {
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
      description: "Preparação para a vida escolar através de atividades lúdicas e educativas que estimulam a curiosidade.",
      features: [
        "Preparação escolar",
        "Atividades lúdicas",
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
      description: "Transição suave para o ensino primário com atividades que desenvolvem a autonomia e responsabilidade.",
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
      icon: Clock,
      title: "ATL",
      ageRange: "6-8 anos",
      description: "Atividades de tempos livres que complementam o ensino regular com diversão e aprendizado.",
      features: [
        "Apoio aos trabalhos de casa",
        "Atividades recreativas",
        "Desenvolvimento de hobbies",
        "Convívio social",
        "Flexibilidade de horários"
      ],
      color: "accent",
      gradient: "from-accent to-accent/80"
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
          {services.map((service, index) => (
            <Card key={index} className="shadow-soft hover:shadow-colorful transition-all duration-300 group overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${service.gradient}`}></div>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 bg-${service.color}/10 rounded-full group-hover:scale-110 transition-transform duration-300`}>
                      <service.icon className={`h-8 w-8 text-${service.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-primary">{service.title}</CardTitle>
                      <p className={`text-${service.color} font-semibold`}>{service.ageRange}</p>
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
                        <div className={`w-2 h-2 bg-${service.color} rounded-full`}></div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  className={`mt-6 w-full bg-${service.color} hover:bg-${service.color}/90 text-white`}
                  onClick={() => window.location.href = `/servicos/${service.title.toLowerCase()}`}
                >
                  Saiba Mais
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
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
              Entre em contato conosco para agendar uma visita e conhecer de perto 
              como podemos contribuir para o desenvolvimento do seu filho.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8"
                onClick={() => window.location.href = '/contato'}
              >
                Agendar Visita
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-primary px-8"
                onClick={() => window.location.href = '/contato'}
              >
                Solicitar Informações
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;