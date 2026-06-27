import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    childAge: '',
    service: '',
    visitDate: '',
    message: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate form submission
    toast({
      title: "Solicitação enviada!",
      description: "Entraremos em contato em breve para agendar sua visita.",
    });
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      childAge: '',
      service: '',
      visitDate: '',
      message: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Endereço Principal",
      info: "Rua das Flores, 123, Luanda Sul",
      extra: "Segunda Unidade: Talatona (em breve)"
    },
    {
      icon: Phone,
      title: "Telefone",
      info: "+244 XXX XXX XXX",
      extra: "WhatsApp disponível"
    },
    {
      icon: Mail,
      title: "Email",
      info: "info@betteryoukids.ao",
      extra: "Resposta em até 24h"
    },
    {
      icon: Clock,
      title: "Horário de Funcionamento",
      info: "Segunda a Sexta: 7h às 18h",
      extra: "Sábado: 8h às 12h (apenas visitas)"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up">
            Entre em Contato
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Estamos aqui para responder suas perguntas e agendar uma visita especial para você conhecer nossa escola.
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((item, index) => (
              <Card key={index} className="text-center hover:shadow-colorful transition-all duration-300 hover:scale-105 animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
                <CardContent className="p-6">
                  <div className="mb-4 flex justify-center">
                    <div className="p-3 bg-gradient-warm rounded-full">
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-primary mb-2">{item.title}</h3>
                  <p className="text-muted-foreground mb-1">{item.info}</p>
                  <p className="text-sm text-muted-foreground">{item.extra}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="hover:shadow-colorful transition-shadow duration-300 animate-slide-up">
              <CardHeader>
                <CardTitle className="text-primary text-2xl">Agendar Visita</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input 
                        id="name" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Seu nome completo" 
                        required
                        className="focus:ring-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="seu@email.com" 
                        required
                        className="focus:ring-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+244 XXX XXX XXX" 
                        required
                        className="focus:ring-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="childAge">Idade da Criança</Label>
                      <Input 
                        id="childAge" 
                        name="childAge"
                        value={formData.childAge}
                        onChange={handleInputChange}
                        placeholder="Ex: 3 anos" 
                        required
                        className="focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="service">Serviço de Interesse</Label>
                    <select 
                      id="service" 
                      name="service"
                      value={formData.service}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Selecione um serviço</option>
                      <option value="creche">Creche (1-3 anos)</option>
                      <option value="pre-escolar">Pré-Escolar (3-5 anos)</option>
                      <option value="jardim">Jardim de Infância (5-6 anos)</option>
                      <option value="atl">ATL (6-8 anos)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="visitDate">Data Preferida para Visita</Label>
                    <Input 
                      id="visitDate" 
                      name="visitDate"
                      type="date" 
                      value={formData.visitDate}
                      onChange={handleInputChange}
                      required
                      className="focus:ring-primary"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Mensagem (Opcional)</Label>
                    <Textarea 
                      id="message" 
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Conte-nos um pouco sobre suas expectativas..."
                      rows={4}
                      className="focus:ring-primary"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 hover:scale-105 transition-all duration-300"
                    size="lg"
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Agendar Visita
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <Card className="animate-slide-up" style={{animationDelay: '0.2s'}}>
              <CardHeader>
                <CardTitle className="text-primary text-2xl">Nossa Localização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center mb-6">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">Mapa em breve</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-primary mb-2">Unidade Principal</h4>
                    <p className="text-muted-foreground">Rua das Flores, 123, Luanda Sul</p>
                    <p className="text-sm text-muted-foreground">Próximo ao Shopping Belas</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-primary mb-2">Segunda Unidade (2025)</h4>
                    <p className="text-muted-foreground">Talatona, Luanda</p>
                    <p className="text-sm text-accent">Em construção</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-nature text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para conhecer nossa escola?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">
            Agende uma visita e veja de perto como cuidamos e educamos com amor.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all duration-300 px-8"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Voltar ao Formulário
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Contact;