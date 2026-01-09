import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Upload, X, Calculator } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/currencyUtils';

const adicionalesSchema = z.object({
  categoria: z.string().min(1, 'La categoría es requerida'),
  especialidad: z.string().min(1, 'La especialidad es requerida'),
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().optional(),
  subtotal: z.string().min(1, 'El subtotal es requerido'),
  gg: z.string().optional(),
  utilidades: z.string().optional(),
  vencimiento: z.date().optional(),
});

type AdicionalesFormData = z.infer<typeof adicionalesSchema>;

interface AdicionalesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
  currency?: string;
  defaultGG?: number;
  defaultUtilidades?: number;
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
  currency = 'CLP',
  defaultGG = 0,
  defaultUtilidades = 0
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [gg, setGG] = useState<number>(defaultGG);
  const [utilidades, setUtilidades] = useState<number>(defaultUtilidades);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<AdicionalesFormData>({
    resolver: zodResolver(adicionalesSchema),
    defaultValues: {
      gg: defaultGG.toString(),
      utilidades: defaultUtilidades.toString()
    }
  });

  const vencimiento = watch('vencimiento');

  // Calcular total automáticamente
  const montoGG = subtotal * (gg / 100);
  const montoUtilidades = subtotal * (utilidades / 100);
  const total = subtotal + montoGG + montoUtilidades;

  useEffect(() => {
    setGG(defaultGG);
    setUtilidades(defaultUtilidades);
    setValue('gg', defaultGG.toString());
    setValue('utilidades', defaultUtilidades.toString());
  }, [defaultGG, defaultUtilidades, setValue]);

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
      
      const subtotalValue = parseFloat(data.subtotal) || 0;
      const ggValue = parseFloat(data.gg || '0') || 0;
      const utilidadesValue = parseFloat(data.utilidades || '0') || 0;
      const montoTotal = subtotalValue * (1 + ggValue/100 + utilidadesValue/100);
      
      const { data: adicionalData, error } = await supabase
        .from('Adicionales')
        .insert({
          Categoria: data.categoria,
          Especialidad: data.especialidad,
          Titulo: data.titulo,
          Descripcion: data.descripcion || null,
          Subtotal: subtotalValue,
          Monto_presentado: montoTotal,
          Vencimiento: data.vencimiento ? data.vencimiento.toISOString().split('T')[0] : null,
          GG: ggValue,
          Utilidades: utilidadesValue,
          Proyecto: parseInt(projectId),
          Status: 'Enviado'
        } as any)
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
      
      // Si hay archivos, subirlos a Drive
      if (files.length > 0 && adicionalData) {
        try {
          const { error: uploadError } = await supabase.functions.invoke('rfi-message', {
            body: {
              action: 'upload_adicional_attachments',
              projectId: parseInt(projectId),
              adicionalId: (adicionalData as any).id,
              attachments: await Promise.all(files.map(async (file) => ({
                fileName: file.name,
                mimeType: file.type,
                fileContent: await fileToBase64(file)
              })))
            }
          });

          if (uploadError) {
            console.error('⚠️ Error uploading attachments:', uploadError);
          }
        } catch (uploadErr) {
          console.error('⚠️ Error uploading attachments:', uploadErr);
        }
      }
      
      toast({
        title: "Éxito",
        description: "Adicional presentado correctamente",
      });

      reset();
      setFiles([]);
      setSubtotal(0);
      onOpenChange(false);
      onSuccess();
      
      // Send notification to mandante (fire and forget)
      supabase.functions.invoke('send-adicional-notification', {
        body: { 
          adicionalId: (adicionalData as any).id,
          projectId: parseInt(projectId)
        }
      }).catch(console.error);
      
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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

          {/* TABLA DE MONTOS ESTRUCTURADA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-rubik flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Desglose de Montos ({currency})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm">Concepto</th>
                      <th className="text-right p-3 font-medium text-sm">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Subtotal */}
                    <tr className="border-t">
                      <td className="p-3 font-medium">Subtotal *</td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.01"
                          {...register('subtotal')}
                          placeholder="0.00"
                          className="text-right font-rubik"
                          onChange={(e) => {
                            setSubtotal(parseFloat(e.target.value) || 0);
                            setValue('subtotal', e.target.value);
                          }}
                        />
                      </td>
                    </tr>
                    {/* GG */}
                    <tr className="border-t bg-muted/30">
                      <td className="p-3 font-medium">
                        Gastos Generales (%)
                        <span className="block text-xs text-muted-foreground">
                          = {formatCurrency(montoGG, currency)}
                        </span>
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.01"
                          {...register('gg')}
                          placeholder="0.00"
                          className="text-right font-rubik"
                          onChange={(e) => {
                            setGG(parseFloat(e.target.value) || 0);
                            setValue('gg', e.target.value);
                          }}
                        />
                      </td>
                    </tr>
                    {/* Utilidades */}
                    <tr className="border-t bg-muted/30">
                      <td className="p-3 font-medium">
                        Utilidades (%)
                        <span className="block text-xs text-muted-foreground">
                          = {formatCurrency(montoUtilidades, currency)}
                        </span>
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.01"
                          {...register('utilidades')}
                          placeholder="0.00"
                          className="text-right font-rubik"
                          onChange={(e) => {
                            setUtilidades(parseFloat(e.target.value) || 0);
                            setValue('utilidades', e.target.value);
                          }}
                        />
                      </td>
                    </tr>
                    {/* Total */}
                    <tr className="border-t-2 border-primary/30 bg-primary/5">
                      <td className="p-3 font-bold text-lg">TOTAL</td>
                      <td className="p-3 text-right font-bold text-lg text-primary">
                        {formatCurrency(total, currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {errors.subtotal && (
                <p className="text-sm text-destructive font-rubik mt-2">{errors.subtotal.message}</p>
              )}
            </CardContent>
          </Card>

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
            <Label className="font-rubik">Archivos de Respaldo (Opcional)</Label>
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
