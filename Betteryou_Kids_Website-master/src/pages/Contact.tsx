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
      description: "Entraremos em contacto em breve para agendar sua visita.",
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
      icon: Clock,
      title: "Horário de Funcionamento",
      info: "07h30 às 17h30",
      extra: "Sábado, domingo e feriados: Encerrado"
    },
    {
      icon: MapPin,
      title: "Unidade Principal",
      info: "Av. Cmte. Gika 150, Sagrada Família",
      extra: "À direita da maternidade Lucrécia Paím"
    },
    {
      icon: Phone,
      title: "Contacto Geral",
      info: "+244 921 669 893",
      extra: "geral@betteryoukids.com"
    },
    {
      icon: MapPin,
      title: "Segunda Unidade",
      info: "Rua Urbanização Harmonia, 540 A Patriota casa N, Luanda",
      extra: "Contacto: +244 942 043 710 | Email: patriota@betteryoukids.com"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-white">
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up">
            Entre em Contacto
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
                      <option value="">Seleccione um serviço</option>
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
                <div className="grid gap-8">
                  <div className="rounded-2xl overflow-hidden shadow-soft">
                    <iframe
                      title="Mapa Unidade Principal"
                      src="https://www.google.com/maps?width=600&height=450&hl=pt&q=Av.%20Cmte.%20Gika%20150,%20Luanda&ie=UTF8&t=&z=17&iwloc=B&output=embed"
                      className="w-full h-64"
                      loading="lazy"
                    />
                    <div className="p-6 bg-background">
                      <h4 className="font-semibold text-primary mb-2">Unidade Principal</h4>
                      <p className="text-muted-foreground mb-1">Av. Cmte. Gika 150, Luanda</p>
                      <p className="text-sm text-muted-foreground mb-3">À direita da maternidade Lucrécia Paím</p>
                      <a
                        href="https://maps.app.goo.gl/gPe2Mm9EDUtqfcVUA"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-accent transition-colors duration-200"
                      >
                        Abrir no Google Maps
                      </a>
                    </div>
                  </div>

                  <div className="rounded-2xl overflow-hidden shadow-soft">
                    <iframe
                      title="Mapa Segunda Unidade"
                      src="https://www.google.com/maps?width=600&height=450&hl=pt&q=Urbaniza%C3%A7%C3%A3o%20Harmonia,%20540%20A%20Patriota%20casa%20N,%20Luanda&ie=UTF8&t=&z=17&iwloc=B&output=embed"
                      className="w-full h-64"
                      loading="lazy"
                    />
                    <div className="p-6 bg-background">
                      <h4 className="font-semibold text-primary mb-2">Segunda Unidade</h4>
                      <p className="text-muted-foreground mb-1">Urbanização Harmonia, 540 A Patriota casa N, Luanda</p>
                      <p className="text-sm text-muted-foreground mb-3">Contacto: +244 942 043 710 | Email: patriota@betteryoukids.com</p>
                      <a
                        href="https://maps.app.goo.gl/p2JSVXcqrAAmPTYSA"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-accent transition-colors duration-200"
                      >
                        Abrir no Google Maps
                      </a>
                    </div>
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