import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock, Send, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    childName: "",
    childAge: "",
    service: "",
    message: "",
    visitDate: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Formulário Enviado!",
      description: "Entraremos em contacto em breve. Obrigado pelo interesse na Betteryou Kids!",
    });
    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      childName: "",
      childAge: "",
      service: "",
      message: "",
      visitDate: ""
    });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Localização",
      info: "Av. Cmte. Gika 150, Luanda",
      detail: "Espaço Sagrada Família",
      color: "primary"
    },
    {
      icon: Phone,
      title: "Telefone",
      info: "+244 921 669 893",
      detail: "Chamada e WhatsApp",
      color: "secondary"
    },
    {
      icon: Mail,
      title: "Email",
      info: "geral@betteryoukids.com",
      detail: "Resposta em até 24h",
      color: "accent"
    },
    {
      icon: Clock,
      title: "Horário de Funcionamento",
      info: "Segunda a Sexta: 7h às 18h",
      detail: "Sábado: 8h às 12h (apenas visitas)",
      color: "green"
    }
  ];

  const locations = [
    {
      name: "Unidade Principal",
      address: "Av. Cmte. Gika 150, Sagrada Família",
      status: "Aberta",
      mapLink: "https://maps.app.goo.gl/r5rAJXaTU8F2Xccj9",
      description: "À direita da maternidade Lucrécia Paím",
      contact: "+244 921 669 893",
      email: "geral@betteryoukids.com"
    },
    {
      name: "Segunda Unidade",
      address: "Rua Urbanização Harmonia, 540 A Patriota casa N, Luanda",
      status: "Aberta",
      mapLink: "https://maps.app.goo.gl/cukitSpAWHWFv5jR7?g_st=ac",
      description: "Casa N, Patriota",
      contact: "+244 942 043 710",
      email: "patriota@betteryoukids.com"
    }
  ];

  return (
    <section id="contact" className="pt-32 pb-20 bg-gradient-to-b from-muted/30 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Entre em Contacto
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Estamos prontos para receber sua família na Betteryou Kids. 
            Agende uma visita ou solicite mais informações.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Form */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-2xl text-primary flex items-center">
                <Send className="mr-2 h-6 w-6" />
                Formulário de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Responsável *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="childName">Nome da Criança</Label>
                    <Input
                      id="childName"
                      name="childName"
                      value={formData.childName}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="childAge">Idade da Criança</Label>
                    <Select onValueChange={(value) => handleSelectChange("childAge", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccione a idade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 ano</SelectItem>
                        <SelectItem value="2">2 anos</SelectItem>
                        <SelectItem value="3">3 anos</SelectItem>
                        <SelectItem value="4">4 anos</SelectItem>
                        <SelectItem value="5">5 anos</SelectItem>
                        <SelectItem value="6">6 anos</SelectItem>
                        <SelectItem value="7">7 anos</SelectItem>
                        <SelectItem value="8">8 anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="service">Serviço de Interesse</Label>
                    <Select onValueChange={(value) => handleSelectChange("service", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccione o serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="creche">Creche (1-3 anos)</SelectItem>
                        <SelectItem value="pre-escolar">Pré-Escolar (3-5 anos)</SelectItem>
                        <SelectItem value="jardim">Jardim de Infância (5-6 anos)</SelectItem>
                        <SelectItem value="atl">ATL (6-8 anos)</SelectItem>
                        <SelectItem value="actividades">Actividades Extracurriculares</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="visitDate">Data Preferida para Visita</Label>
                  <Input
                    id="visitDate"
                    name="visitDate"
                    type="date"
                    value={formData.visitDate}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1"
                    placeholder="Conte-nos mais sobre suas necessidades e expectativas..."
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-warm text-white hover:shadow-colorful transition-all duration-300"
                  size="lg"
                >
                  <Send className="mr-2 h-5 w-5" />
                  Enviar Mensagem
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-2xl text-primary flex items-center">
                  <Calendar className="mr-2 h-6 w-6" />
                  Agendar Visita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Visite nossas instalações e conheça de perto nossa metodologia. 
                  As visitas são realizadas de segunda a sexta, das 9h às 16h.
                </p>
                <Button
                  type="button"
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => {
                    document.getElementById("name")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    document.getElementById("name")?.focus();
                  }}
                >
                  Agendar Agora
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {contactInfo.map((contact, index) => (
                <Card key={index} className="shadow-soft hover:shadow-colorful transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 bg-${contact.color}/10 rounded-full`}>
                        <contact.icon className={`h-6 w-6 text-${contact.color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary mb-1">{contact.title}</h4>
                        <p className="text-foreground font-medium">{contact.info}</p>
                        <p className="text-sm text-muted-foreground">{contact.detail}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-soft">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-primary mb-4">Nossas Unidades</h3>
            <p className="text-muted-foreground">
              Localizações estratégicas para atender melhor às famílias de Luanda
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {locations.map((location, index) => (
              <Card key={index} className="shadow-soft hover:shadow-colorful transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-semibold text-primary">{location.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      location.status === "Funcionando" 
                        ? "bg-green/10 text-green" 
                        : "bg-accent/10 text-accent"
                    }`}>
                      {location.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-4 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {location.address}
                  </p>
                  <div>
                    <h5 className="font-medium text-primary mb-2">Características:</h5>
                    <ul className="space-y-1">
                      {location.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;