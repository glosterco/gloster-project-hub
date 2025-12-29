import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, Paperclip, X, FileText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ContactoSelector } from './ContactoSelector';
import { useContactos } from '@/hooks/useContactos';
import { format, addDays } from 'date-fns';

const rfiSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().min(1, 'La descripción/pregunta es requerida'),
  urgencia: z.enum(['no_urgente', 'urgente', 'muy_urgente']),
  fecha_vencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
});

type RFIFormData = z.infer<typeof rfiSchema>;

interface RFIFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export const RFIForm: React.FC<RFIFormProps> = ({
  open,
  onOpenChange,
  projectId,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { contactos, loading: contactosLoading, addContacto } = useContactos(projectId);

  // Default date: 1 week from today
  const defaultDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  const form = useForm<RFIFormData>({
    resolver: zodResolver(rfiSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      urgencia: 'no_urgente',
      fecha_vencimiento: defaultDate,
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        titulo: '',
        descripcion: '',
        urgencia: 'no_urgente',
        fecha_vencimiento: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      });
      setSelectedContactIds([]);
      setAttachedFile(null);
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 12MB)
      if (file.size > 12 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "El archivo no puede superar los 12MB",
          variant: "destructive",
        });
        return;
      }
      setAttachedFile(file);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (data: RFIFormData) => {
    setIsSubmitting(true);
    try {
      const pid = parseInt(projectId);
      if (Number.isNaN(pid)) {
        throw new Error('ID de proyecto inválido');
      }

      let documentUrl: string | null = null;

      // Upload file to Drive if attached
      if (attachedFile) {
        const fileContent = await convertFileToBase64(attachedFile);
        const base64Data = fileContent.includes(',') ? fileContent.split(',')[1] : fileContent;

        const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-project-documents', {
          body: {
            projectId: pid,
            documents: [{
              fileName: `RFI_${data.titulo.replace(/[^a-zA-Z0-9]/g, '_')}_${attachedFile.name}`,
              fileContent: base64Data,
              tipo: 'RFI',
              mimeType: attachedFile.type
            }]
          }
        });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast({
            title: "Advertencia",
            description: "No se pudo adjuntar el documento, pero el RFI se creará",
            variant: "destructive",
          });
        } else if (uploadData?.uploadedFiles?.[0]) {
          documentUrl = uploadData.uploadedFiles[0].webViewLink;
        }
      }

      // Create RFI
      const { data: rfiData, error } = await supabase
        .from('RFI' as any)
        .insert({
          Proyecto: pid,
          Titulo: data.titulo,
          Descripcion: data.descripcion,
          Status: 'Pendiente',
          URL: documentUrl,
          Urgencia: data.urgencia,
          Fecha_Vencimiento: data.fecha_vencimiento,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Add destinatarios if selected
      if (selectedContactIds.length > 0 && rfiData) {
        const inserts = selectedContactIds.map(contacto_id => ({
          rfi_id: (rfiData as any).id,
          contacto_id
        }));

        await supabase
          .from('rfi_destinatarios' as any)
          .insert(inserts as any);
      }

      // Send notification to mandante and specialists
      try {
        const { error: notifError } = await supabase.functions.invoke('send-rfi-notification', {
          body: { 
            rfiId: (rfiData as any).id,
            projectId: pid,
            selectedContactIds: selectedContactIds
          }
        });
        
        if (notifError) {
          console.error('⚠️ Error sending RFI notification:', notifError);
        } else {
          console.log('✅ RFI notification sent to mandante and specialists');
        }
      } catch (notifError) {
        console.error('⚠️ Error sending RFI notification:', notifError);
      }

      toast({
        title: "RFI creado",
        description: attachedFile ? "El RFI y documento han sido registrados" : "El RFI ha sido registrado correctamente",
      });

      form.reset();
      setSelectedContactIds([]);
      setAttachedFile(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating RFI:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el RFI",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgenciaLabel = (value: string) => {
    switch (value) {
      case 'no_urgente': return 'No urgente';
      case 'urgente': return 'Urgente';
      case 'muy_urgente': return 'Muy urgente';
      default: return value;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo RFI</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el título del RFI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción / Pregunta</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describa su consulta o pregunta..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="urgencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgencia</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no_urgente">No urgente</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                        <SelectItem value="muy_urgente">Muy urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha_vencimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha vencimiento</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="date"
                          className="pl-10"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* File attachment section */}
            <div className="space-y-2">
              <FormLabel>Documento adjunto (opcional)</FormLabel>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg"
              />
              {attachedFile ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1 truncate">{attachedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAttachedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Adjuntar documento
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos: PDF, Word, Excel, Imágenes, DWG (máx. 12MB)
              </p>
            </div>

            <div className="border-t pt-4">
              <ContactoSelector
                contactos={contactos}
                selectedIds={selectedContactIds}
                onSelectionChange={setSelectedContactIds}
                loading={contactosLoading}
                onAddContacto={addContacto}
                projectId={projectId}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear RFI
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
