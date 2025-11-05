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
import { useLicitaciones, CalendarEvent, LicitacionItem } from '@/hooks/useLicitaciones';

interface LicitacionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const LicitacionForm = ({ open, onOpenChange, onSuccess }: LicitacionFormProps) => {
  const { toast } = useToast();
  const { createLicitacion } = useLicitaciones();
  const [oferentesEmails, setOferentesEmails] = useState<string[]>(['']);
  const [emailInput, setEmailInput] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [calendarEvents, setCalendarEvents] = useState<Array<{
    id: string;
    fecha: Date | undefined;
    titulo: string;
    descripcion: string;
    requiereArchivos: boolean;
  }>>([]);
  const [documentos, setDocumentos] = useState<File[]>([]);
  const [especificaciones, setEspecificaciones] = useState('');
  const [items, setItems] = useState<Array<{
    id: string;
    descripcion: string;
    unidad: string;
    cantidad: number;
    precio_unitario: number;
    precio_total: number;
  }>>([]);
  const [gastosGenerales, setGastosGenerales] = useState<number>(0);
  const [ivaPorcentaje, setIvaPorcentaje] = useState<number>(19);
  const [submitting, setSubmitting] = useState(false);

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
    const newEvent = {
      id: Math.random().toString(),
      fecha: undefined,
      titulo: '',
      descripcion: '',
      requiereArchivos: false
    };
    setCalendarEvents([...calendarEvents, newEvent]);
  };

  const handleRemoveEvent = (id: string) => {
    setCalendarEvents(calendarEvents.filter(e => e.id !== id));
  };

  const handleUpdateEvent = (id: string, field: 'titulo' | 'descripcion' | 'requiereArchivos', value: string | boolean) => {
    setCalendarEvents(calendarEvents.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const handleUpdateEventDate = (id: string, date: Date | undefined) => {
    setCalendarEvents(calendarEvents.map(e => 
      e.id === id ? { ...e, fecha: date } : e
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

  const handleAddItem = () => {
    const newItem = {
      id: Math.random().toString(),
      descripcion: '',
      unidad: '',
      cantidad: 0,
      precio_unitario: 0,
      precio_total: 0
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof Omit<typeof items[0], 'id'>, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Calcular precio total automáticamente
        if (field === 'cantidad' || field === 'precio_unitario') {
          updated.precio_total = updated.cantidad * updated.precio_unitario;
        }
        return updated;
      }
      return item;
    }));
  };

  const calcularTotalCostosDirectos = () => {
    return items.reduce((sum, item) => sum + item.precio_total, 0);
  };

  const calcularCostoNetoTotal = () => {
    return calcularTotalCostosDirectos() + gastosGenerales;
  };

  const calcularIVA = () => {
    return calcularCostoNetoTotal() * (ivaPorcentaje / 100);
  };

  const calcularTotal = () => {
    return calcularCostoNetoTotal() + calcularIVA();
  };

  const handleSubmit = async () => {
    if (!nombre || !descripcion) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // Convertir eventos del calendario al formato correcto
      const eventosFormateados: CalendarEvent[] = calendarEvents.map(event => ({
        fecha: event.fecha ? event.fecha.toISOString() : '',
        titulo: event.titulo,
        descripcion: event.descripcion,
        requiereArchivos: event.requiereArchivos
      }));

      const itemsFormateados: LicitacionItem[] = items.map((item, index) => ({
        descripcion: item.descripcion,
        unidad: item.unidad,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        precio_total: item.precio_total,
        orden: index
      }));

      const result = await createLicitacion({
        nombre,
        descripcion,
        mensaje_oferentes: mensaje,
        oferentes_emails: oferentesEmails.filter(e => e),
        calendario_eventos: eventosFormateados,
        especificaciones,
        documentos: documentos.map(f => ({ nombre: f.name, size: f.size, tipo: f.type })),
        items: itemsFormateados.length > 0 ? itemsFormateados : undefined,
        gastos_generales: gastosGenerales > 0 ? gastosGenerales : undefined,
        iva_porcentaje: ivaPorcentaje
      });

      if (result) {
        // Limpiar el formulario
        setNombre('');
        setDescripcion('');
        setMensaje('');
        setOferentesEmails(['']);
        setCalendarEvents([]);
        setDocumentos([]);
        setEspecificaciones('');
        setItems([]);
        setGastosGenerales(0);
        setIvaPorcentaje(19);
        
        onSuccess?.();
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
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
                  <Label className="text-base font-medium">Ingresar contacto oferentes</Label>
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
                  <Label htmlFor="mensaje" className="text-base font-medium">Mensaje para los Oferentes</Label>
                  <Textarea
                    id="mensaje"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Mensaje que se enviará a los oferentes..."
                    rows={8}
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
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "justify-start text-left font-normal",
                                !event.fecha && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {event.fecha ? format(event.fecha, "PPP") : "Seleccionar fecha"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={event.fecha}
                              onSelect={(date) => handleUpdateEventDate(event.id, date)}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
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
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`archivos-${event.id}`}
                          checked={event.requiereArchivos}
                          onChange={(e) => handleUpdateEvent(event.id, 'requiereArchivos', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`archivos-${event.id}`} className="text-sm cursor-pointer">
                          Requiere recibir archivos de oferentes
                        </Label>
                      </div>
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

          {/* Itemizado (Opcional) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-rubik flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Itemizado (Opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleAddItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>

              {items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left text-sm font-medium">Descripción</th>
                        <th className="p-2 text-left text-sm font-medium w-24">Unidad</th>
                        <th className="p-2 text-right text-sm font-medium w-24">Cantidad</th>
                        <th className="p-2 text-right text-sm font-medium w-32">P.U.</th>
                        <th className="p-2 text-right text-sm font-medium w-32">Total</th>
                        <th className="p-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">
                            <Input
                              placeholder="Descripción del item"
                              value={item.descripcion}
                              onChange={(e) => handleUpdateItem(item.id, 'descripcion', e.target.value)}
                              className="h-8"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              placeholder="Ej: m²"
                              value={item.unidad}
                              onChange={(e) => handleUpdateItem(item.id, 'unidad', e.target.value)}
                              className="h-8"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              value={item.cantidad || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'cantidad', parseFloat(e.target.value) || 0)}
                              className="h-8 text-right"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              value={item.precio_unitario || ''}
                              onChange={(e) => handleUpdateItem(item.id, 'precio_unitario', parseFloat(e.target.value) || 0)}
                              className="h-8 text-right"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              value={item.precio_total || 0}
                              readOnly
                              className="h-8 text-right bg-muted"
                            />
                          </td>
                          <td className="p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-muted/50 font-medium">
                        <td colSpan={4} className="p-2 text-right">Total Costos Directos:</td>
                        <td className="p-2 text-right">${calcularTotalCostosDirectos().toLocaleString('es-CL')}</td>
                        <td></td>
                      </tr>
                      <tr className="border-t">
                        <td colSpan={4} className="p-2 text-right">Gastos Generales:</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={gastosGenerales || ''}
                            onChange={(e) => setGastosGenerales(parseFloat(e.target.value) || 0)}
                            className="h-8 text-right"
                          />
                        </td>
                        <td></td>
                      </tr>
                      <tr className="border-t bg-muted/50 font-medium">
                        <td colSpan={4} className="p-2 text-right">Costo Neto Total:</td>
                        <td className="p-2 text-right">${calcularCostoNetoTotal().toLocaleString('es-CL')}</td>
                        <td></td>
                      </tr>
                      <tr className="border-t">
                        <td colSpan={3} className="p-2 text-right">IVA (%):</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={ivaPorcentaje || ''}
                            onChange={(e) => setIvaPorcentaje(parseFloat(e.target.value) || 0)}
                            className="h-8 text-right"
                            max={100}
                            min={0}
                          />
                        </td>
                        <td className="p-2 text-right">${calcularIVA().toLocaleString('es-CL')}</td>
                        <td></td>
                      </tr>
                      <tr className="border-t bg-primary/10 font-bold">
                        <td colSpan={4} className="p-2 text-right">TOTAL:</td>
                        <td className="p-2 text-right">${calcularTotal().toLocaleString('es-CL')}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear Licitación'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LicitacionForm;
