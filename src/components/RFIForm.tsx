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
  especialidad: z.string().optional(),
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
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { contactos, loading: contactosLoading, addContacto } = useContactos(projectId);

  const defaultDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  const form = useForm<RFIFormData>({
    resolver: zodResolver(rfiSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      urgencia: 'no_urgente',
      especialidad: '',
      fecha_vencimiento: defaultDate,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        titulo: '',
        descripcion: '',
        urgencia: 'no_urgente',
        especialidad: '',
        fecha_vencimiento: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      });
      setSelectedContactIds([]);
      setAttachedFiles([]);
    }
  }, [open]);

  const validateAndAddFiles = (files: File[]) => {
    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > 12 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} no puede superar los 12MB`,
          variant: "destructive",
        });
        continue;
      }
      validFiles.push(file);
    }
    if (validFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    validateAndAddFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging false if we're actually leaving the drop zone
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      validateAndAddFiles(files);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

      // First create the RFI to get its ID and Correlativo
      const { data: rfiData, error: rfiError } = await supabase
        .from('RFI' as any)
        .insert({
          Proyecto: pid,
          Titulo: data.titulo,
          Descripcion: data.descripcion,
          Status: 'Pendiente',
          Urgencia: data.urgencia,
          Especialidad: data.especialidad || null,
          Fecha_Vencimiento: data.fecha_vencimiento,
        } as any)
        .select()
        .single();

      if (rfiError) throw rfiError;

      const rfiId = (rfiData as any).id;
      const rfiCorrelativo = (rfiData as any).Correlativo || rfiId;

      // Upload files using upload_attachments action (updates RFI.URL, no message created)
      if (attachedFiles.length > 0) {
        try {
          const attachments = await Promise.all(
            attachedFiles.map(async (file) => {
              const base64 = await convertFileToBase64(file);
              const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
              return {
                fileName: file.name,
                fileContent: base64Data,
                mimeType: file.type || 'application/octet-stream'
              };
            })
          );

          // Use upload_attachments action - stores in RFI.URL, no message, no status change
          const { data: uploadData, error: uploadError } = await supabase.functions.invoke('rfi-message', {
            body: {
              action: 'upload_attachments',
              rfiId,
              projectId: pid,
              attachments
            }
          });

          if (uploadError) {
            console.error('Error uploading attachments:', uploadError);
            toast({
              title: "Advertencia",
              description: "No se pudieron adjuntar los documentos, pero el RFI se creó correctamente",
              variant: "destructive",
            });
          } else {
            console.log('✅ Attachments uploaded to RFI.URL:', uploadData?.attachmentsUrl);
          }
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
          toast({
            title: "Advertencia",
            description: "No se pudieron adjuntar los documentos, pero el RFI se creó correctamente",
            variant: "destructive",
          });
        }
      }

      // Add destinatarios if selected
      if (selectedContactIds.length > 0) {
        const inserts = selectedContactIds.map(contacto_id => ({
          rfi_id: rfiId,
          contacto_id
        }));

        await supabase
          .from('rfi_destinatarios' as any)
          .insert(inserts as any);
      }

      toast({
        title: "RFI creado",
        description: attachedFiles.length > 0 
          ? `El RFI y ${attachedFiles.length} documento(s) han sido registrados` 
          : "El RFI ha sido registrado correctamente",
      });

      form.reset();
      setSelectedContactIds([]);
      setAttachedFiles([]);
      onOpenChange(false);
      onSuccess?.();
      
      // Send notification (fire and forget)
      supabase.functions.invoke('send-rfi-notification', {
        body: { 
          rfiId,
          projectId: pid,
          destinatarioIds: selectedContactIds
        }
      }).catch(console.error);

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
                name="especialidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="arquitectura">Arquitectura</SelectItem>
                        <SelectItem value="estructura">Estructura</SelectItem>
                        <SelectItem value="electricidad">Electricidad</SelectItem>
                        <SelectItem value="sanitario">Sanitario</SelectItem>
                        <SelectItem value="mecanico">Mecánico</SelectItem>
                        <SelectItem value="climatizacion">Climatización</SelectItem>
                        <SelectItem value="incendio">Incendio</SelectItem>
                        <SelectItem value="paisajismo">Paisajismo</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            {/* File attachment section with drag and drop */}
            <div className="space-y-2">
              <FormLabel>Documentos adjuntos (opcional)</FormLabel>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.dwg"
                multiple
              />
              
              {/* Drop zone */}
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                  ${isDragging 
                    ? 'border-brand-yellow bg-brand-yellow/10' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50'
                  }
                `}
              >
                <Paperclip className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragging 
                    ? 'Suelta los archivos aquí' 
                    : 'Arrastra archivos aquí o haz clic para seleccionar'
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Word, Excel, Imágenes, DWG (máx. 12MB)
                </p>
              </div>
              
              {attachedFiles.length > 0 && (
                <div className="space-y-1.5">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({formatFileSize(file.size)})
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
