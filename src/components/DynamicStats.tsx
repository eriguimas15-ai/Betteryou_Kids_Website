import { useState, useEffect } from "react";

const DynamicStats = () => {
  const [stats, setStats] = useState({
    families: 0,
    experience: 0,
    activities: 0,
    units: 0
  });

  const finalStats = {
    families: 100,
    experience: 5,
    activities: 15,
    units: 2
  };

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    const timer = setInterval(() => {
      setStats(current => ({
        families: Math.min(current.families + Math.ceil(finalStats.families / steps), finalStats.families),
        experience: Math.min(current.experience + Math.ceil(finalStats.experience / steps), finalStats.experience),
        activities: Math.min(current.activities + Math.ceil(finalStats.activities / steps), finalStats.activities),
        units: Math.min(current.units + Math.ceil(finalStats.units / steps), finalStats.units)
      }));
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-16 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center group hover:scale-110 transition-transform duration-300 animate-bounce-in" style={{animationDelay: '0.1s'}}>
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stats.families}+</div>
            <div className="text-muted-foreground font-medium">Famílias Felizes</div>
          </div>
          <div className="text-center group hover:scale-110 transition-transform duration-300 animate-bounce-in" style={{animationDelay: '0.2s'}}>
            <div className="text-4xl md:text-5xl font-bold text-green mb-2">{stats.experience}</div>
            <div className="text-muted-foreground font-medium">Anos de Experiência</div>
          </div>
          <div className="text-center group hover:scale-110 transition-transform duration-300 animate-bounce-in" style={{animationDelay: '0.3s'}}>
            <div className="text-4xl md:text-5xl font-bold text-pink mb-2">{stats.activities}+</div>
            <div className="text-muted-foreground font-medium">Atividades</div>
          </div>
          <div className="text-center group hover:scale-110 transition-transform duration-300 animate-bounce-in" style={{animationDelay: '0.4s'}}>
            <div className="text-4xl md:text-5xl font-bold text-blue mb-2">{stats.units}</div>
            <div className="text-muted-foreground font-medium">Unidades</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DynamicStats;