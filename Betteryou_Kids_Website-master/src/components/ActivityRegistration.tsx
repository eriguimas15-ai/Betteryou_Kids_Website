import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Calendar, Clock, MapPin, Users, Star, Image, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  id: string;
  title: string;
  type: 'upcoming' | 'past';
  date: string;
  time: string;
  location: string;
  capacity: number;
  enrolled: number;
  description: string;
  instructor: string;
  images?: string[];
  videos?: string[];
  summary?: string;
}

interface ActivityRegistrationProps {
  activity: Activity;
}

const ActivityRegistration = ({ activity }: ActivityRegistrationProps) => {
  const [formData, setFormData] = useState({
    childName: '',
    parentName: '',
    email: '',
    phone: '',
    age: '',
    observations: ''
  });
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    toast({
      title: "Inscrição realizada!",
      description: "Entraremos em contacto em breve para confirmar a participação.",
    });
    setIsOpen(false);
    setFormData({
      childName: '',
      parentName: '',
      email: '',
      phone: '',
      age: '',
      observations: ''
    });
  };

  if (activity.type === 'past') {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Image className="mr-2 h-4 w-4" />
            Ver Como Foi
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activity.title} - Resumo</DialogTitle>
            <DialogDescription>
              Veja como foi esta actividade e os momentos especiais que vivemos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {activity.summary && (
              <div>
                <h4 className="font-semibold text-primary mb-2">Resumo da Actividade</h4>
                <p className="text-muted-foreground">{activity.summary}</p>
              </div>
            )}

            {activity.images && activity.images.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary mb-4">Galeria de Fotos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {activity.images.map((image, index) => (
                    <div key={index} className="relative group overflow-hidden rounded-lg">
                      <img 
                        src={image} 
                        alt={`${activity.title} - Foto ${index + 1}`}
                        className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activity.videos && activity.videos.length > 0 && (
              <div>
                <h4 className="font-semibold text-primary mb-4">Vídeos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activity.videos.map((video, index) => (
                    <div key={index} className="relative group">
                      <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center group-hover:bg-muted/80 transition-colors duration-300">
                        <Play className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Vídeo {index + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const spotsLeft = activity.capacity - activity.enrolled;
  const isFullyBooked = spotsLeft <= 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className={`w-full ${isFullyBooked ? 'bg-muted text-muted-foreground' : 'bg-primary hover:bg-primary/90'}`}
          disabled={isFullyBooked}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {isFullyBooked ? 'Esgotado' : 'Inscrever-se'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inscrição - {activity.title}</DialogTitle>
          <DialogDescription>
            Preencha os dados para inscrever sua criança nesta actividade
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="childName">Nome da Criança*</Label>
              <Input
                id="childName"
                name="childName"
                value={formData.childName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Idade*</Label>
              <Input
                id="age"
                name="age"
                type="number"
                min="1"
                max="12"
                value={formData.age}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parentName">Nome do Responsável*</Label>
            <Input
              id="parentName"
              name="parentName"
              value={formData.parentName}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email*</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone*</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              name="observations"
              placeholder="Alergias, necessidades especiais, etc."
              value={formData.observations}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="bg-muted/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span>{activity.date}</span>
              <Clock className="h-4 w-4 ml-2" />
              <span>{activity.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4" />
              <span>{activity.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span className="text-muted-foreground">Vagas:</span>
              <Badge variant={spotsLeft <= 3 ? "destructive" : "secondary"}>
                {spotsLeft} disponíveis
              </Badge>
            </div>
          </div>
          
          <Button type="submit" className="w-full">
            Confirmar Inscrição
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityRegistration;