import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const adicionalesSchema = z.object({
  categoria: z.string().min(1, 'La categoría es requerida'),
  especialidad: z.string().min(1, 'La especialidad es requerida'),
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().optional(),
  monto_presentado: z.string().optional(),
  vencimiento: z.date().optional(),
  gg: z.string().optional(),
});

type AdicionalesFormData = z.infer<typeof adicionalesSchema>;

interface AdicionalesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
  currency?: string;
}

const categorias = [
  'Trabajo Adicional',
  'Modificación de Diseño',
  'Cambio de Materiales',
  'Extensión de Plazo',
  'Otros'
];

const especialidades = [
  'Arquitectura',
  'Estructura',
  'Electricidad',
  'Sanitario',
  'Climatización',
  'Paisajismo',
  'Otro'
];

export const AdicionalesForm: React.FC<AdicionalesFormProps> = ({
  open,
  onOpenChange,
  projectId,
  onSuccess,
  currency = 'CLP'
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<AdicionalesFormData>({
    resolver: zodResolver(adicionalesSchema)
  });

  const vencimiento = watch('vencimiento');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: AdicionalesFormData) => {
    setLoading(true);
    try {
      console.log('🚀 Submitting adicional:', data);
      
      const { data: adicionalData, error } = await supabase
        .from('Adicionales')
        .insert({
          Categoria: data.categoria,
          Especialidad: data.especialidad,
          Titulo: data.titulo,
          Descripcion: data.descripcion || null,
          Monto_presentado: data.monto_presentado ? parseFloat(data.monto_presentado) : null,
          Vencimiento: data.vencimiento ? data.vencimiento.toISOString().split('T')[0] : null,
          GG: data.gg ? parseFloat(data.gg) : null,
          Proyecto: parseInt(projectId),
          Status: 'Pendiente'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating adicional:', error);
        toast({
          title: "Error",
          description: "No se pudo crear el adicional",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Adicional created:', adicionalData);
      
      toast({
        title: "Éxito",
        description: "Adicional presentado correctamente",
      });

      reset();
      setFiles([]);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('❌ CRITICAL ERROR creating adicional:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al crear el adicional",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-rubik">Presentar Nuevo Adicional</DialogTitle>
          <DialogDescription className="font-rubik">
            Complete la información del trabajo adicional que desea presentar
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Categoría y Especialidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria" className="font-rubik">Categoría *</Label>
              <Select onValueChange={(value) => setValue('categoria', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoria && (
                <p className="text-sm text-destructive font-rubik">{errors.categoria.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="especialidad" className="font-rubik">Especialidad *</Label>
              <Select onValueChange={(value) => setValue('especialidad', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione especialidad" />
                </SelectTrigger>
                <SelectContent>
                  {especialidades.map((esp) => (
                    <SelectItem key={esp} value={esp}>
                      {esp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.especialidad && (
                <p className="text-sm text-destructive font-rubik">{errors.especialidad.message}</p>
              )}
            </div>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo" className="font-rubik">Título *</Label>
            <Input
              id="titulo"
              {...register('titulo')}
              placeholder="Ingrese el título del adicional"
              className="font-rubik"
            />
            {errors.titulo && (
              <p className="text-sm text-destructive font-rubik">{errors.titulo.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion" className="font-rubik">Descripción</Label>
            <Textarea
              id="descripcion"
              {...register('descripcion')}
              placeholder="Describa el trabajo adicional solicitado"
              className="min-h-[100px] font-rubik"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monto Presentado */}
            <div className="space-y-2">
              <Label htmlFor="monto_presentado" className="font-rubik">Monto Presentado ({currency})</Label>
              <Input
                id="monto_presentado"
                type="number"
                step="0.01"
                {...register('monto_presentado')}
                placeholder="0.00"
                className="font-rubik"
              />
            </div>

            {/* GG */}
            <div className="space-y-2">
              <Label htmlFor="gg" className="font-rubik">GG (%)</Label>
              <Input
                id="gg"
                type="number"
                step="0.01"
                {...register('gg')}
                placeholder="0.00"
                className="font-rubik"
              />
            </div>
          </div>

          {/* Fecha de Vencimiento */}
          <div className="space-y-2">
            <Label className="font-rubik">Fecha de Vencimiento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal font-rubik",
                    !vencimiento && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {vencimiento ? format(vencimiento, "PPP") : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={vencimiento}
                  onSelect={(date) => setValue('vencimiento', date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Carga de Archivos */}
          <div className="space-y-2">
            <Label className="font-rubik">Archivos de Respaldo</Label>
            <div className="border-2 border-dashed border-muted rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <Label htmlFor="files" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-primary hover:text-primary/80 font-rubik">
                      Seleccionar archivos
                    </span>
                  </Label>
                  <Input
                    id="files"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-rubik">
                  PDF, DOC, DOCX, JPG, PNG, XLSX (máx. 10MB cada uno)
                </p>
              </div>
            </div>

            {/* Lista de archivos seleccionados */}
            {files.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-rubik">Archivos seleccionados:</Label>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span className="text-sm font-rubik truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-rubik"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="font-rubik">
              {loading ? 'Presentando...' : 'Presentar Adicional'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};