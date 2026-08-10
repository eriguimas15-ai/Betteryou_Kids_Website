import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Target, Eye, Heart, Users, Award, Globe, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getPublicCmsPage } from "@/lib/api";
import { cmsIcon } from "@/lib/cms-icons";
import {
  CMS_JORNADA_SECTION,
  CMS_JORNADA_SLUG,
  CMS_SERVICOS_SECTION,
  CMS_SERVICOS_SLUG,
  DEFAULT_CMS_JOURNEY,
  DEFAULT_CMS_SERVICES,
  parseJourneyJson,
  parseServicesJson,
  sectionValue,
  type CmsJourneyItem,
  type CmsServiceCard,
} from "@/lib/site-content-cms";

const About = () => {
  const [timeline, setTimeline] = useState<CmsJourneyItem[]>(DEFAULT_CMS_JOURNEY);
  const [serviceCards, setServiceCards] = useState<CmsServiceCard[]>(
    DEFAULT_CMS_SERVICES,
  );

  useEffect(() => {
    getPublicCmsPage(CMS_JORNADA_SLUG)
      .then((page) => {
        const parsed = parseJourneyJson(sectionValue(page, CMS_JORNADA_SECTION));
        if (parsed?.length) setTimeline(parsed);
      })
      .catch(() => undefined);
    getPublicCmsPage(CMS_SERVICOS_SLUG)
      .then((page) => {
        const parsed = parseServicesJson(
          sectionValue(page, CMS_SERVICOS_SECTION),
        );
        if (parsed?.length) setServiceCards(parsed);
      })
      .catch(() => undefined);
  }, []);

  const values = [
    {
      icon: Heart,
      title: "Amor",
      description: "O amor é a base de tudo o que fazemos, criando um ambiente acolhedor e seguro.",
      color: "text-pink"
    },
    {
      icon: Users,
      title: "Família",
      description: "Valorizamos a parceria com as famílias para o desenvolvimento integral da criança.",
      color: "text-blue"
    },
    {
      icon: Award,
      title: "Excelência",
      description: "Buscamos constantemente a excelência em nossos serviços e metodologias.",
      color: "text-accent"
    },
    {
      icon: Globe,
      title: "Inovação",
      description: "Implementamos práticas inovadoras para preparar as crianças para o futuro.",
      color: "text-green"
    }
  ];

  const serviceColorClasses = {
    pink: { iconBg: "bg-pink/10", iconText: "text-pink", ageText: "text-pink" },
    secondary: { iconBg: "bg-secondary/10", iconText: "text-secondary", ageText: "text-secondary" },
    green: { iconBg: "bg-green/10", iconText: "text-green", ageText: "text-green" },
    accent: { iconBg: "bg-accent/10", iconText: "text-accent", ageText: "text-accent" },
    purple: { iconBg: "bg-purple/10", iconText: "text-purple", ageText: "text-purple" },
    red: { iconBg: "bg-red/10", iconText: "text-red", ageText: "text-red" },
    blue: { iconBg: "bg-blue/10", iconText: "text-blue", ageText: "text-blue" },
  } as const;

  const timelineColorClasses = {
    pink: { bg: "bg-pink/10", text: "text-pink" },
    blue: { bg: "bg-blue/10", text: "text-blue" },
    green: { bg: "bg-green/10", text: "text-green" },
    secondary: { bg: "bg-secondary/10", text: "text-secondary" },
    accent: { bg: "bg-accent/10", text: "text-accent" },
    purple: { bg: "bg-purple/10", text: "text-purple" },
    red: { bg: "bg-red/10", text: "text-red" },
  } as const;

  const activities = [
    { title: "Música e Movimento", description: "Desenvolvimento rítmico e expressão corporal" },
    { title: "Arte e Criatividade", description: "Estímulo à imaginação através de actividades artísticas" },
    { title: "Natureza e Descobertas", description: "Exploração do meio ambiente e consciência ecológica" },
    { title: "Jiu-Jitsu Infantil", description: "Disciplina, respeito e desenvolvimento físico" },
    { title: "Ballet Clássico", description: "Graciosidade, postura e expressão artística" },
    { title: "Culinária Saudável", description: "Alimentação consciente e habilidades práticas" }
  ];

  const events = [
    {
      title: "Festival de Primavera",
      date: "21 de Setembro",
      description: "Celebração da natureza com actividades ao ar livre"
    },
    {
      title: "Mostra Cultural",
      date: "15 de Novembro", 
      description: "Apresentação dos talentos artísticos das crianças"
    },
    {
      title: "Festa de Fim de Ano",
      date: "15 de Dezembro",
      description: "Confraternização entre famílias e comunidade"
    }
  ];

  return (
    <section id="about" className="pt-32 pb-20 bg-gradient-to-b from-white to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Sobre a Betteryou Kids
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Somos uma instituição de ensino dedicada ao desenvolvimento integral 
            das crianças, baseada nos pilares do amor, natureza e criatividade.
          </p>
        </div>

        {/* Mission, Vision, Values Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Mission */}
          <Card className="shadow-soft hover:shadow-colorful transition-shadow duration-300 border-l-4 border-l-primary">
            <CardContent className="p-8">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full mr-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-primary">Missão</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Proporcionar uma educação afectiva e inovadora que desenvolva o 
                potencial único de cada criança, preparando-as para serem cidadãos 
                conscientes, criativos e felizes.
              </p>
            </CardContent>
          </Card>

          {/* Vision */}
          <Card className="shadow-soft hover:shadow-colorful transition-shadow duration-300 border-l-4 border-l-secondary">
            <CardContent className="p-8">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-secondary/10 rounded-full mr-4">
                  <Eye className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">Visão</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Ser referência em educação infantil premium em Angola e no mundo 
                lusófono, reconhecida pela excelência e inovação em metodologias 
                pedagógicas afectivas.
              </p>
            </CardContent>
          </Card>

          {/* Approach */}
          <Card className="shadow-soft hover:shadow-colorful transition-shadow duration-300 border-l-4 border-l-accent">
            <CardContent className="p-8">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-accent/10 rounded-full mr-4">
                  <Heart className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-accent">Abordagem</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Nossa abordagem pedagógica integra afecto, natureza e criatividade, 
                proporcionando um ambiente onde cada criança pode crescer de forma 
                saudável e equilibrada.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-primary mb-4">Nossos Valores</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Os valores que norteiam nossa prática pedagógica e nossa relação 
              com as famílias e a comunidade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-transform duration-300">
                <div className="mb-4 flex justify-center">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full group-hover:shadow-colorful transition-shadow duration-300">
                    <value.icon className={`h-8 w-8 ${value.color}`} />
                  </div>
                </div>
                <h4 className="text-xl font-semibold text-primary mb-2">{value.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-primary mb-4">Nossa Jornada</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Conheça os marcos importantes da nossa história e como evoluímos 
              para nos tornar referência em educação infantil.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-primary via-secondary to-accent"></div>
            
            <div className="space-y-12">
              {timeline.map((item, index) => {
                const timelineStyle =
                  timelineColorClasses[
                    item.color as keyof typeof timelineColorClasses
                  ] || timelineColorClasses.pink;
                const Icon = cmsIcon(item.icon);
                return (
                  <div key={item.id} className={`flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                      <Card className="shadow-soft hover:shadow-colorful transition-all duration-300 group">
                        <CardContent className="p-6">
                          <div className={`flex items-center gap-3 mb-3 ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                            <div className={`${timelineStyle.bg} p-2 rounded-full`}>
                              <Icon className={`h-5 w-5 ${timelineStyle.text}`} />
                            </div>
                            <span className={`text-2xl font-bold ${timelineStyle.text}`}>{item.year}</span>
                          </div>
                          <h4 className="text-lg font-semibold text-primary mb-2">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-primary to-secondary rounded-full border-4 border-white shadow-lg"></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Services Carousel */}
        <div className="mt-16 bg-gradient-to-r from-muted/20 to-accent/10 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-primary mb-4">Nossos Serviços</h3>
            <p className="text-muted-foreground">Programas educacionais para cada faixa etária</p>
          </div>

          <Carousel className="max-w-4xl mx-auto">
            <CarouselContent>
              {serviceCards.map((service) => {
                const serviceStyle =
                  serviceColorClasses[
                    service.color as keyof typeof serviceColorClasses
                  ] || serviceColorClasses.pink;
                const Icon = cmsIcon(service.icon);
                return (
                  <CarouselItem key={service.id} className="md:basis-1/2 lg:basis-1/3">
                    <Card className="shadow-soft hover:shadow-colorful transition-all duration-300 group h-full">
                      <CardContent className="p-6 text-center h-full flex flex-col">
                        <div className="mb-4 flex justify-center">
                          <div className={`${serviceStyle.iconBg} p-3 rounded-full group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className={`h-8 w-8 ${serviceStyle.iconText}`} />
                          </div>
                        </div>
                        <h4 className="text-xl font-semibold text-primary mb-2">{service.title}</h4>
                        <p className={`${serviceStyle.ageText} font-medium mb-3`}>{service.ageRange}</p>
                        <p className="text-sm text-muted-foreground flex-grow">{service.description}</p>
                        <Button 
                          asChild
                          variant="outline" 
                          size="sm" 
                          className="mt-4 w-full"
                        >
                          <Link to="/servicos">Saiba Mais</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Activities Summary */}
        <div className="mt-16 bg-white rounded-2xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-primary mb-4">Resumo de Actividades</h3>
            <p className="text-muted-foreground">Experiências enriquecedoras para o desenvolvimento integral</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity, index) => (
              <div key={index} className="text-center p-4 rounded-lg bg-gradient-to-b from-muted/20 to-transparent hover:shadow-soft transition-all duration-300 group">
                <h4 className="font-semibold text-primary mb-2 group-hover:text-pink transition-colors duration-300">{activity.title}</h4>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button 
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            >
              <Link to="/actividades">
                Ver Todas as Actividades
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Events Section */}
        <div className="mt-16 text-center">
          <h3 className="text-3xl font-bold text-primary mb-8">Próximos Eventos</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {events.map((event, index) => (
              <Card key={index} className="shadow-soft hover:shadow-colorful transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-warm rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-primary mb-2 group-hover:text-pink transition-colors duration-300">{event.title}</h4>
                  <p className="text-accent font-medium mb-2">{event.date}</p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;