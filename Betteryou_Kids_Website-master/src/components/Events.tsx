import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarDays, MapPin, PartyPopper, Ticket, Users } from "lucide-react";
import { getPublicEvents, type PublicEvent } from "@/lib/api";

const TYPE_LABELS: Record<string, string> = {
  FESTA: "Festa",
  EVENTO: "Evento",
  PASSEIO: "Passeio",
  WORKSHOP: "Workshop",
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] || type;
}

function formatDateTime(value: string): string {
  try {
    return format(parseISO(value), "EEEE, d 'de' MMMM · HH:mm", { locale: pt });
  } catch {
    return value.slice(0, 16).replace("T", " ");
  }
}

function formatPrice(priceAkz: number | null): string {
  if (priceAkz == null || priceAkz <= 0) return "Gratuito";
  return `${priceAkz.toLocaleString("pt-PT")} AKZ`;
}

const Events = () => {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    getPublicEvents()
      .then((list) => {
        if (!cancelled) setEvents(list);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filters = useMemo(() => {
    const base = [{ id: "all", label: "Todos", count: events.length }];
    for (const type of Object.keys(TYPE_LABELS)) {
      const count = events.filter((e) => e.type === type).length;
      if (count > 0) {
        base.push({ id: type, label: typeLabel(type), count });
      }
    }
    return base;
  }, [events]);

  const filteredEvents =
    activeFilter === "all"
      ? events
      : events.filter((e) => e.type === activeFilter);

  return (
    <section className="pt-32 pb-20 bg-gradient-to-b from-white to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Eventos e Festas
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Festas, passeios e workshops para as nossas crianças e famílias.
            Consulte a agenda e inscreva-se através do portal do encarregado.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">A carregar eventos…</p>
        ) : events.length === 0 ? (
          <Card className="mx-auto max-w-xl">
            <CardContent className="p-10 text-center">
              <PartyPopper className="mx-auto mb-4 h-12 w-12 text-primary/70" />
              <h3 className="mb-2 text-2xl font-semibold text-primary">
                Sem eventos agendados
              </h3>
              <p className="text-muted-foreground">
                De momento não há eventos ou festas agendados. Volte em breve —
                estamos sempre a preparar novidades para as nossas crianças!
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filter Buttons */}
            {filters.length > 2 && (
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
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {filter.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            )}

            {/* Events Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {filteredEvents.map((event) => (
                <Card
                  key={event.id}
                  className="group overflow-hidden shadow-soft hover:shadow-colorful transition-all duration-300 flex flex-col"
                >
                  {event.imageUrl ? (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-primary/90 text-white">
                          {typeLabel(event.type)}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex h-32 items-center justify-center bg-gradient-warm">
                      <PartyPopper className="h-12 w-12 text-white/90" />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/20 text-white">
                          {typeLabel(event.type)}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <CardContent className="flex flex-1 flex-col p-6">
                    <h3 className="mb-3 text-xl font-semibold text-primary">
                      {event.title}
                    </h3>
                    <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary/70" />
                        <span className="capitalize">
                          {formatDateTime(event.startAt)}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary/70" />
                          {event.location}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-primary/70" />
                        {formatPrice(event.priceAkz)}
                      </div>
                      {event.spotsRemaining != null && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary/70" />
                          {event.isFull
                            ? "Lotação esgotada"
                            : `${event.spotsRemaining} vaga(s) disponível(is)`}
                        </div>
                      )}
                    </div>
                    <p className="mb-4 line-clamp-4 flex-1 text-sm text-muted-foreground">
                      {event.description}
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full hover:bg-primary/10"
                    >
                      <Link to="/plataforma">Inscrever no portal</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-warm rounded-2xl p-8 md:p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">
              Quer organizar uma festa connosco?
            </h3>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Realizamos festas de aniversário e eventos infantis. Fale connosco
              para conhecer as opções e reservar a sua data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8"
              >
                <Link to="/contato">
                  <PartyPopper className="mr-2 h-5 w-5" />
                  Falar connosco
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Events;
