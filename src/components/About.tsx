import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Target, Eye, Heart, Users, Award, Globe, Baby, GraduationCap, Clock, Calendar, MapPin, Trophy, Sparkles, ArrowRight } from "lucide-react";

const About = () => {
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

  const services = [
    {
      icon: Baby,
      title: "Creche",
      age: "1-3 anos",
      description: "Cuidados especializados para os primeiros anos",
      color: "pink"
    },
    {
      icon: Users,
      title: "Pré-Escolar", 
      age: "3-5 anos",
      description: "Desenvolvimento cognitivo e social",
      color: "secondary"
    },
    {
      icon: GraduationCap,
      title: "Jardim de Infância",
      age: "5-6 anos", 
      description: "Preparação para o ensino fundamental",
      color: "green"
    },
    {
      icon: Clock,
      title: "ATL",
      age: "6-8 anos",
      description: "Atividades complementares",
      color: "accent"
    }
  ];

  const timeline = [
    {
      year: "2019",
      title: "Fundação",
      description: "Nascimento da Betteryou Kids com o sonho de revolucionar a educação infantil",
      icon: Sparkles,
      color: "pink"
    },
    {
      year: "2020",
      title: "Primeira Unidade",
      description: "Abertura da primeira unidade com metodologia inovadora",
      icon: MapPin,
      color: "blue"
    },
    {
      year: "2021",
      title: "Expansão",
      description: "Crescimento da comunidade e ampliação das atividades",
      icon: Users,
      color: "green"
    },
    {
      year: "2022",
      title: "Reconhecimento",
      description: "Premiação como melhor instituição de educação infantil",
      icon: Trophy,
      color: "accent"
    },
    {
      year: "2023",
      title: "Segunda Unidade",
      description: "Expansão com abertura da segunda unidade",
      icon: MapPin,
      color: "secondary"
    },
    {
      year: "2024",
      title: "Inovação Contínua",
      description: "Implementação de novas tecnologias educacionais",
      icon: Globe,
      color: "pink"
    }
    ,
    {
      year: "2025",
      title: "Abertura do Novo Espaço",
      description: "Inauguração do novo espaço da Betteryou Kids em 1 de Setembro de 2025, ampliando o atendimento e atividades.",
      icon: MapPin,
      color: "blue"
    },
    {
      year: "2026",
      title: "Abertura do 1º Ciclo",
      description: "Início das atividades do 1º Ciclo a partir de 14 de Setembro de 2026, com projeto pedagógico expandido.",
      icon: GraduationCap,
      color: "secondary"
    }
  ];

  const activities = [
    { title: "Música e Movimento", description: "Desenvolvimento rítmico e expressão corporal" },
    { title: "Arte e Criatividade", description: "Estímulo à imaginação através de atividades artísticas" },
    { title: "Natureza e Descobertas", description: "Exploração do meio ambiente e consciência ecológica" },
    { title: "Jiu-Jitsu Infantil", description: "Disciplina, respeito e desenvolvimento físico" },
    { title: "Ballet Clássico", description: "Graciosidade, postura e expressão artística" },
    { title: "Culinária Saudável", description: "Alimentação consciente e habilidades práticas" }
  ];

  const events = [
    {
      title: "Festival de Primavera",
      date: "21 de Setembro",
      description: "Celebração da natureza com atividades ao ar livre"
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
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Sobre a Betteryou Kids
          </h2>
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
                Proporcionar uma educação afetiva e inovadora que desenvolva o 
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
                pedagógicas afetivas.
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
                Nossa abordagem pedagógica integra afeto, natureza e criatividade, 
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
              {timeline.map((item, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <Card className="shadow-soft hover:shadow-colorful transition-all duration-300 group">
                      <CardContent className="p-6">
                        <div className={`flex items-center gap-3 mb-3 ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-2 bg-${item.color}/10 rounded-full`}>
                            <item.icon className={`h-5 w-5 text-${item.color}`} />
                          </div>
                          <span className={`text-2xl font-bold text-${item.color}`}>{item.year}</span>
                        </div>
                        <h4 className="text-lg font-semibold text-primary mb-2">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-primary to-secondary rounded-full border-4 border-white shadow-lg"></div>
                </div>
              ))}
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
              {services.map((service, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="shadow-soft hover:shadow-colorful transition-all duration-300 group h-full">
                    <CardContent className="p-6 text-center h-full flex flex-col">
                      <div className="mb-4 flex justify-center">
                        <div className={`p-3 bg-${service.color}/10 rounded-full group-hover:scale-110 transition-transform duration-300`}>
                          <service.icon className={`h-8 w-8 text-${service.color}`} />
                        </div>
                      </div>
                      <h4 className="text-xl font-semibold text-primary mb-2">{service.title}</h4>
                      <p className={`text-${service.color} font-medium mb-3`}>{service.age}</p>
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
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Activities Summary */}
        <div className="mt-16 bg-white rounded-2xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-primary mb-4">Resumo de Atividades</h3>
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
              <Link to="/atividades">
                Ver Todas as Atividades
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