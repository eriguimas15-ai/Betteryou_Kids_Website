import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, Users, Award, Heart } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Maria Santos",
      role: "Mãe da Sofia (4 anos)",
      content: "A Betteryou Kids transformou a vida da nossa família. A Sofia desenvolveu não apenas academicamente, mas também emocionalmente. O carinho e dedicação da equipe são únicos.",
      rating: 5,
      service: "Pré-Escolar",
      image: "👩🏽",
      highlight: "Desenvolvimento emocional excepcional"
    },
    {
      name: "João Pereira",
      role: "Pai do Miguel (6 anos)",
      content: "Estamos há 3 anos na Betteryou Kids e não podemos estar mais satisfeitos. O Miguel adora ir à escola e sempre chega em casa cheio de histórias para contar sobre suas descobertas.",
      rating: 5,
      service: "Jardim de Infância",
      image: "👨🏽",
      highlight: "3 anos de satisfação total"
    },
    {
      name: "Ana Costa",
      role: "Mãe da Beatriz (2 anos)",
      content: "Como mãe de primeira viagem, estava muito nervosa em deixar a Beatriz numa creche. A equipe da Betteryou Kids me tranquilizou desde o primeiro dia. É realmente uma extensão da nossa família.",
      rating: 5,
      service: "Creche",
      image: "👩🏾",
      highlight: "Ambiente familiar e acolhedor"
    },
    {
      name: "Carlos Mendes",
      role: "Pai do Lucas (7 anos)",
      content: "O programa de atividades extracurriculares é fantástico. O Lucas faz jiu-jitsu e música, e vemos como essas atividades contribuem para seu desenvolvimento integral.",
      rating: 5,
      service: "ATL",
      image: "👨🏾",
      highlight: "Atividades extracurriculares excepcionais"
    },
    {
      name: "Fernanda Lima",
      role: "Mãe dos gêmeos Pedro e Paulo (5 anos)",
      content: "Ter gêmeos é um desafio, mas a Betteryou Kids soube lidar perfeitamente com as necessidades individuais de cada um, respeitando suas personalidades únicas.",
      rating: 5,
      service: "Pré-Escolar",
      image: "👩🏻",
      highlight: "Atendimento personalizado"
    },
    {
      name: "Ricardo Silva",
      role: "Pai da Mariana (3 anos)",
      content: "A abordagem pedagógica baseada no amor, natureza e criatividade é exatamente o que procurávamos. A Mariana está sempre animada e aprendendo coisas novas.",
      rating: 5,
      service: "Pré-Escolar",
      image: "👨🏻",
      highlight: "Metodologia inovadora"
    }
  ];

  const stats = [
    {
      icon: Users,
      value: "98%",
      label: "Satisfação das Famílias",
      color: "blue"
    },
    {
      icon: Heart,
      value: "100+",
      label: "Famílias Felizes",
      color: "pink"
    },
    {
      icon: Award,
      value: "5",
      label: "Anos de Excelência",
      color: "accent"
    },
    {
      icon: Star,
      value: "4.9",
      label: "Avaliação Média",
      color: "green"
    }
  ];

  const partnerships = [
    {
      name: "Associação de Pediatras de Angola",
      description: "Parceria para acompanhamento da saúde infantil",
      icon: "🏥"
    },
    {
      name: "Universidade Metodista de Angola",
      description: "Colaboração em pesquisas pedagógicas",
      icon: "🎓"
    },
    {
      name: "Instituto de Música de Luanda",
      description: "Programa de educação musical especializada",
      icon: "🎵"
    },
    {
      name: "Fundação Natureza Angola",
      description: "Projetos de educação ambiental",
      icon: "🌱"
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-b from-muted/30 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            O que as Famílias Dizem
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Os depoimentos das nossas famílias são o melhor reflexo do nosso 
            compromisso com a excelência em educação infantil.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-soft hover:shadow-colorful transition-shadow duration-300 text-center">
              <CardContent className="p-6">
                <div className={`w-16 h-16 bg-${stat.color}/10 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className={`h-8 w-8 text-${stat.color}`} />
                </div>
                <div className={`text-3xl font-bold text-${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="shadow-soft hover:shadow-colorful transition-all duration-300 group">
              <CardContent className="p-6">
                {/* Quote Icon */}
                <Quote className="h-8 w-8 text-accent mb-4 group-hover:scale-110 transition-transform duration-300" />
                
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-accent fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-muted-foreground mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>

                {/* Highlight */}
                <Badge className="mb-4 bg-gradient-warm text-white">
                  {testimonial.highlight}
                </Badge>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{testimonial.image}</div>
                    <div>
                      <div className="font-semibold text-primary">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {testimonial.service}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Partnerships Section */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-primary mb-4">Parcerias Estratégicas</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Colaboramos com instituições renomadas para oferecer sempre o melhor 
              em educação, saúde e desenvolvimento infantil.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerships.map((partnership, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gradient-to-b from-muted/20 to-transparent hover:shadow-soft transition-shadow duration-300">
                <div className="text-4xl mb-4">{partnership.icon}</div>
                <h4 className="font-semibold text-primary mb-2 text-sm leading-tight">
                  {partnership.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {partnership.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-hero rounded-2xl p-8 md:p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">
              Junte-se à Nossa Família
            </h3>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Faça parte da comunidade Betteryou Kids e proporcione ao seu filho 
              uma educação baseada no amor, natureza e criatividade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-accent hover:bg-accent/90 text-primary font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:shadow-lg">
                Agendar Visita
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-3 rounded-lg transition-all duration-300">
                Falar com Consultora
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;