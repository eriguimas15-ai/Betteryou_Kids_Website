import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Play, Image as ImageIcon, Calendar, Users, Maximize2 } from "lucide-react";
import heroImage from "@/assets/hero-classroom.jpg";
import natureImage from "@/assets/nature-play.jpg";
import creativeImage from "@/assets/creative-activities.jpg";
import { getPublicGallery, uploadPublicUrl } from "@/lib/api";

type GalleryMediaItem = {
  id: string | number;
  type: "image" | "video";
  src: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  date: string;
};

const DEFAULT_MEDIA_ITEMS: GalleryMediaItem[] = [
  {
    id: 1,
    type: "image",
    src: heroImage,
    title: "Sala de Aula Moderna",
    description: "Ambiente acolhedor e estimulante para a aprendizagem",
    category: "facilities",
    categoryLabel: "Instalações",
    date: "Dezembro 2024",
  },
  {
    id: 2,
    type: "image",
    src: natureImage,
    title: "Actividades na Natureza",
    description: "Crianças explorando e aprendendo ao ar livre",
    category: "activities",
    categoryLabel: "Actividades",
    date: "Novembro 2024",
  },
  {
    id: 3,
    type: "image",
    src: creativeImage,
    title: "Arte e Criatividade",
    description: "Desenvolvendo a expressão artística das crianças",
    category: "activities",
    categoryLabel: "Actividades",
    date: "Outubro 2024",
  },
  {
    id: 4,
    type: "video",
    src: heroImage,
    title: "Um Dia na Betteryou Kids",
    description: "Vídeo mostrando a rotina diária das crianças",
    category: "events",
    categoryLabel: "Eventos",
    date: "Setembro 2024",
  },
  {
    id: 5,
    type: "image",
    src: natureImage,
    title: "Jardim Sensorial",
    description: "Espaço dedicado à exploração dos sentidos",
    category: "facilities",
    categoryLabel: "Instalações",
    date: "Agosto 2024",
  },
  {
    id: 6,
    type: "image",
    src: creativeImage,
    title: "Festival de Música",
    description: "Apresentação musical das crianças",
    category: "events",
    categoryLabel: "Eventos",
    date: "Julho 2024",
  },
];

const CATEGORY_COLORS = ["blue", "green", "pink", "accent"];

const Gallery = () => {
  const [selectedMedia, setSelectedMedia] = useState<GalleryMediaItem | null>(
    null,
  );
  const [activeFilter, setActiveFilter] = useState("all");
  const [mediaItems, setMediaItems] =
    useState<GalleryMediaItem[]>(DEFAULT_MEDIA_ITEMS);

  useEffect(() => {
    let cancelled = false;
    getPublicGallery()
      .then((albums) => {
        if (cancelled) return;
        const items: GalleryMediaItem[] = [];
        for (const album of albums) {
          for (const item of album.items) {
            if (!item.media?.filePath) continue;
            items.push({
              id: item.id,
              type: "image",
              src: uploadPublicUrl(item.media.filePath),
              title: item.title || album.title,
              description: item.caption || item.media.altText || album.title,
              category: album.slug,
              categoryLabel: album.title,
              date: "",
            });
          }
        }
        if (items.length > 0) setMediaItems(items);
      })
      .catch(() => {
        // Mantém a galeria hardcoded como fallback.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    let index = 0;
    for (const item of mediaItems) {
      if (!map.has(item.category)) {
        map.set(item.category, CATEGORY_COLORS[index % CATEGORY_COLORS.length]);
        index += 1;
      }
    }
    return map;
  }, [mediaItems]);

  const categoryLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of mediaItems) {
      if (!map.has(item.category)) map.set(item.category, item.categoryLabel);
    }
    return map;
  }, [mediaItems]);

  const filters = useMemo(() => {
    const base = [
      { id: "all", label: "Todos", count: mediaItems.length },
    ];
    for (const [category, label] of categoryLabelMap.entries()) {
      base.push({
        id: category,
        label,
        count: mediaItems.filter((item) => item.category === category).length,
      });
    }
    return base;
  }, [mediaItems, categoryLabelMap]);

  const filteredItems =
    activeFilter === "all"
      ? mediaItems
      : mediaItems.filter((item) => item.category === activeFilter);

  const getCategoryColor = (category: string) =>
    categoryColorMap.get(category) || "accent";

  const getCategoryLabel = (category: string) =>
    categoryLabelMap.get(category) || "Outros";

  return (
    <section id="gallery" className="pt-32 pb-20 bg-gradient-to-b from-white to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Galeria
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore nossos espaços, actividades e momentos especiais através de 
            fotos e vídeos que capturam a essência da Betteryou Kids.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "outline"}
              onClick={() => setActiveFilter(filter.id)}
              className={`${
                activeFilter === filter.id 
                  ? "bg-primary hover:bg-primary/90" 
                  : "hover:bg-primary/10"
              } transition-all duration-300`}
            >
              {filter.label}
              <Badge 
                variant="secondary" 
                className="ml-2 text-xs"
              >
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className="group overflow-hidden shadow-soft hover:shadow-colorful transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedMedia(item)}
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-white/80 text-sm">{item.description}</p>
                  </div>
                </div>

                {/* Media Type Icon */}
                <div className="absolute top-4 right-4">
                  {item.type === "video" ? (
                    <div className="p-2 bg-black/50 rounded-full backdrop-blur-sm">
                      <Play className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <div className="p-2 bg-black/50 rounded-full backdrop-blur-sm group-hover:bg-primary/80 transition-colors duration-300">
                      <Maximize2 className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <Badge className={`bg-${getCategoryColor(item.category)}/90 text-white`}>
                    {getCategoryLabel(item.category)}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    {item.date && (
                      <>
                        <Calendar className="h-4 w-4 mr-1" />
                        {item.date}
                      </>
                    )}
                  </div>
                  <div className="flex items-center">
                    {item.type === "video" ? (
                      <Play className="h-4 w-4 mr-1" />
                    ) : (
                      <ImageIcon className="h-4 w-4 mr-1" />
                    )}
                    {item.type === "video" ? "Vídeo" : "Foto"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-warm rounded-2xl p-8 md:p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">
              Quer ver mais?
            </h3>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Agende uma visita para conhecer pessoalmente nossas instalações, 
              conversar com nossa equipa e ver as crianças em acção.
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

      {/* Media Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedMedia && (
            <>
              <div className="relative">
                <img
                  src={selectedMedia.src}
                  alt={selectedMedia.title}
                  className="w-full h-auto max-h-[70vh] object-cover"
                />
                {selectedMedia.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button 
                      size="lg" 
                      className="bg-black/50 hover:bg-black/70 text-white rounded-full p-4"
                    >
                      <Play className="h-8 w-8" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-primary flex items-center justify-between">
                    {selectedMedia.title}
                    <Badge className={`bg-${getCategoryColor(selectedMedia.category)}/10 text-${getCategoryColor(selectedMedia.category)}`}>
                      {getCategoryLabel(selectedMedia.category)}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  {selectedMedia.description}
                </p>
                {selectedMedia.date && (
                  <div className="flex items-center mt-4 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {selectedMedia.date}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Gallery;