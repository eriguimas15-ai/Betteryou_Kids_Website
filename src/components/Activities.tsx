import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Dumbbell, Palette, Camera, TreePine, BookOpen, Utensils, Globe, Calendar, Clock, Users } from "lucide-react";
import ActivityRegistration from "@/components/ActivityRegistration";
import natureImage from "@/assets/nature-play.jpg";
import creativeImage from "@/assets/creative-activities.jpg";

const Activities = () => {
  const activities = [
    {
      icon: Music,
      title: "Música",
      description: "Exploração musical com instrumentos, canto e movimento corporal para desenvolvimento rítmico e auditivo.",
      category: "Artística",
      color: "pink",
      image: creativeImage
    },
    {
      icon: Dumbbell,
      title: "Jiu-Jitsu",
      description: "Arte marcial que desenvolve disciplina, respeito, coordenação motora e autoconfiança.",
      category: "Desportiva",
      color: "blue"
    },
    {
      icon: Palette,
      title: "Ballet",
      description: "Dança clássica que promove graciosidade, equilíbrio, postura e expressão artística.",
      category: "Artística",
      color: "pink"
    },
    {
      icon: TreePine,
      title: "Atividades na Natureza",
      description: "Exploração do ambiente natural, jardinagem e consciência ecológica.",
      category: "Natureza",
      color: "green",
      image: natureImage
    },
    {
      icon: Palette,
      title: "Artes Plásticas",
      description: "Pintura, desenho, escultura e artesanato para estimular a criatividade e expressão.",
      category: "Artística",
      color: "accent"
    },
    {
      icon: BookOpen,
      title: "Contação de Histórias",
      description: "Desenvolvimento da linguagem, imaginação e amor pela leitura através de narrativas envolventes.",
      category: "Educativa",
      color: "secondary"
    },
    {
      icon: Utensils,
      title: "Culinária Infantil",
      description: "Introdução à culinária saudável, desenvolvendo coordenação motora e autonomia.",
      category: "Prática",
      color: "accent"
    },
    {
      icon: Globe,
      title: "Línguas Estrangeiras",
      description: "Introdução lúdica ao inglês e outras línguas através de jogos e músicas.",
      category: "Educativa",
      color: "blue"
    }
  ];

  const upcomingActivities = [
    {
      id: "music-workshop",
      title: "Oficina de Música",
      type: "upcoming" as const,
      date: "25 de Janeiro, 2025",
      time: "14:00 - 16:00",
      location: "Sala de Música - Unidade Central",
      capacity: 15,
      enrolled: 8,
      description: "Exploração musical com instrumentos e canto",
      instructor: "Prof. Ana Costa"
    },
    {
      id: "nature-exploration",
      title: "Exploração da Natureza",
      type: "upcoming" as const,
      date: "30 de Janeiro, 2025",
      time: "09:00 - 11:00",
      location: "Jardim Botânico",
      capacity: 20,
      enrolled: 15,
      description: "Descoberta do mundo natural",
      instructor: "Prof. João Silva"
    },
    {
      id: "art-creative",
      title: "Arte Criativa",
      type: "upcoming" as const,
      date: "5 de Fevereiro, 2025",
      time: "15:00 - 17:00",
      location: "Ateliê de Arte",
      capacity: 12,
      enrolled: 12,
      description: "Pintura e expressão artística",
      instructor: "Prof. Maria Santos"
    }
  ];

  const pastActivities = [
    {
      id: "ballet-performance",
      title: "Apresentação de Ballet",
      type: "past" as const,
      date: "15 de Dezembro, 2024",
      time: "16:00 - 18:00",
      location: "Auditório Principal",
      capacity: 25,
      enrolled: 25,
      description: "Apresentação de fim de ano das turmas de ballet",
      instructor: "Prof. Clara Mendes",
      summary: "Foi uma apresentação magnífica! As crianças mostraram toda a graciosidade e dedicação desenvolvidas ao longo do ano. Pais e familiares ficaram emocionados com as performances.",
      images: [creativeImage, natureImage],
      videos: ["video1.mp4", "video2.mp4"]
    },
    {
      id: "nature-festival",
      title: "Festival da Natureza",
      type: "past" as const,
      date: "20 de Setembro, 2024",
      time: "09:00 - 15:00",
      location: "Área Externa",
      capacity: 50,
      enrolled: 45,
      description: "Celebração da primavera com atividades ao ar livre",
      instructor: "Equipe Completa",
      summary: "Um dia especial de conexão com a natureza! As crianças participaram de plantio, observação de insetos, jogos ecológicos e muito mais. Foi uma experiência enriquecedora para todos.",
      images: [natureImage, creativeImage],
      videos: ["festival1.mp4"]
    }
  ];

  const events = [
    {
      title: "Festival de Primavera",
      description: "Celebração da natureza com apresentações, jardinagem e atividades ao ar livre.",
      date: "Setembro 2024",
      color: "green"
    },
    {
      title: "Mostra Cultural",
      description: "Exposição dos trabalhos artísticos e apresentações musicais das crianças.",
      date: "Novembro 2024",
      color: "pink"
    },
    {
      title: "Dia das Famílias",
      description: "Evento especial de integração entre famílias, crianças e educadores.",
      date: "Dezembro 2024",
      color: "accent"
    },
    {
      title: "Olimpíadas Kids",
      description: "Competições esportivas e recreativas que promovem o espírito de equipe.",
      date: "Março 2025",
      color: "blue"
    }
  ];

  return (
    <section id="activities" className="pt-32 pb-20 bg-gradient-to-b from-white to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Atividades Extracurriculares
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Um programa rico e diversificado que estimula diferentes habilidades 
            e talentos, promovendo o desenvolvimento integral das crianças.
          </p>
        </div>

        {/* Activities Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
          {activities.map((activity, index) => (
            <Card key={index} className="shadow-soft hover:shadow-colorful transition-all duration-300 group overflow-hidden">
              {activity.image && (
                <div className="h-32 overflow-hidden">
                  <img 
                    src={activity.image} 
                    alt={activity.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              )}
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 bg-${activity.color}/10 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                    <activity.icon className={`h-6 w-6 text-${activity.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {activity.category}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-primary mb-2">{activity.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {activity.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upcoming Activities */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-soft mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-primary mb-4">Próximas Atividades</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Inscreva sua criança nas próximas atividades especiais e workshops.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingActivities.map((activity) => (
              <Card key={activity.id} className="shadow-soft hover:shadow-colorful transition-all duration-300 group">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-primary mb-2 group-hover:text-pink transition-colors duration-300">
                    {activity.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">{activity.description}</p>
                  
                  <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{activity.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{activity.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{activity.enrolled}/{activity.capacity} inscritos</span>
                    </div>
                  </div>

                  <ActivityRegistration activity={activity} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Past Activities */}
        <div className="bg-gradient-to-r from-muted/20 to-accent/10 rounded-2xl p-8 md:p-12 mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-primary mb-4">Atividades Realizadas</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Veja como foram nossas atividades anteriores e os momentos especiais que vivemos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {pastActivities.map((activity) => (
              <Card key={activity.id} className="shadow-soft hover:shadow-colorful transition-all duration-300 group">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-primary mb-2 group-hover:text-pink transition-colors duration-300">
                    {activity.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">{activity.description}</p>
                  
                  <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{activity.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{activity.enrolled} participantes</span>
                    </div>
                  </div>

                  <ActivityRegistration activity={activity} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Events Section */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-primary mb-4">Eventos Comunitários</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Eventos especiais que fortalecem os laços entre escola, família e comunidade, 
              criando memórias inesquecíveis para as crianças.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((event, index) => (
              <div key={index} className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-br from-${event.color}/20 to-${event.color}/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="relative p-6 border border-border rounded-xl hover:border-primary/30 transition-colors duration-300">
                  <div className={`w-12 h-12 bg-${event.color}/10 rounded-full flex items-center justify-center mb-4`}>
                    <div className={`w-6 h-6 bg-${event.color} rounded-full animate-pulse-glow`}></div>
                  </div>
                  <h4 className="font-semibold text-primary mb-2">{event.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {event.description}
                  </p>
                  <Badge className={`bg-${event.color}/10 text-${event.color} hover:bg-${event.color}/20`}>
                    {event.date}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-16 text-center">
          <h3 className="text-3xl font-bold text-primary mb-8">
            Benefícios das Atividades Extracurriculares
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-6">
              <div className="w-16 h-16 bg-gradient-warm rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h4 className="font-semibold text-primary mb-2">Desenvolvimento Cognitivo</h4>
              <p className="text-sm text-muted-foreground">
                Estímulo à concentração, memória e raciocínio através de atividades diversificadas.
              </p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-gradient-nature rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h4 className="font-semibold text-primary mb-2">Habilidades Sociais</h4>
              <p className="text-sm text-muted-foreground">
                Fortalecimento das relações interpessoais e trabalho em equipe.
              </p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💪</span>
              </div>
              <h4 className="font-semibold text-primary mb-2">Bem-estar Físico</h4>
              <p className="text-sm text-muted-foreground">
                Desenvolvimento motor, coordenação e hábitos saudáveis de vida.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Activities;