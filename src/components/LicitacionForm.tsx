import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Upload, Calendar as CalendarIcon, Mail, FileText, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface LicitacionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface CalendarEvent {
  id: string;
  fecha: Date;
  titulo: string;
  descripcion: string;
}

const LicitacionForm = ({ open, onOpenChange, onSuccess }: LicitacionFormProps) => {
  const { toast } = useToast();
  const [oferentesEmails, setOferentesEmails] = useState<string[]>(['']);
  const [emailInput, setEmailInput] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [documentos, setDocumentos] = useState<File[]>([]);
  const [especificaciones, setEspecificaciones] = useState('');

  const handleAddEmail = () => {
    if (emailInput && emailInput.includes('@')) {
      setOferentesEmails([...oferentesEmails, emailInput]);
      setEmailInput('');
    } else {
      toast({
        title: "Email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive"
      });
    }
  };

  const handleRemoveEmail = (index: number) => {
    setOferentesEmails(oferentesEmails.filter((_, i) => i !== index));
  };

  const handleAddCalendarEvent = () => {
    const newEvent: CalendarEvent = {
      id: Math.random().toString(),
      fecha: new Date(),
      titulo: '',
      descripcion: ''
    };
    setCalendarEvents([...calendarEvents, newEvent]);
  };

  const handleRemoveEvent = (id: string) => {
    setCalendarEvents(calendarEvents.filter(e => e.id !== id));
  };

  const handleUpdateEvent = (id: string, field: 'titulo' | 'descripcion', value: string) => {
    setCalendarEvents(calendarEvents.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocumentos([...documentos, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setDocumentos(documentos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!nombre || !descripcion) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Licitación creada",
      description: "La licitación se ha creado exitosamente"
    });

    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-rubik">Nueva Licitación</DialogTitle>
          <DialogDescription>
            Completa la información para crear una nueva licitación
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-rubik flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la Licitación *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Construcción de Edificio Principal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe el alcance del proyecto..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Oferentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-rubik flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Oferentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Columna Izquierda - Correos */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="email@ejemplo.com"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                    />
                    <Button onClick={handleAddEmail} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {oferentesEmails.filter(e => e).map((email, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                        <span className="text-sm">{email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEmail(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Columna Derecha - Mensaje */}
                <div className="space-y-2">
                  <Label htmlFor="mensaje">Mensaje para los Oferentes</Label>
                  <Textarea
                    id="mensaje"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Mensaje que se enviará a los oferentes..."
                    rows={12}
                    className="h-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendario de Licitación */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-rubik flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Calendario de Licitación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleAddCalendarEvent} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Evento
              </Button>

              <div className="space-y-3">
                {calendarEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-muted-foreground">
                          {format(event.fecha, "PPP")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEvent(event.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Título del evento"
                        value={event.titulo}
                        onChange={(e) => handleUpdateEvent(event.id, 'titulo', e.target.value)}
                      />
                      <Input
                        placeholder="Descripción"
                        value={event.descripcion}
                        onChange={(e) => handleUpdateEvent(event.id, 'descripcion', e.target.value)}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-rubik flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  multiple
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                {documentos.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Especificaciones Especiales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-rubik flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Especificaciones Especiales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={especificaciones}
                onChange={(e) => setEspecificaciones(e.target.value)}
                placeholder="Requisitos técnicos, certificaciones necesarias, condiciones especiales..."
                rows={6}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Crear Licitación
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LicitacionForm;
