import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  ExternalLink, 
  HelpCircle, 
  Calendar, 
  MessageSquare, 
  Send, 
  Forward, 
  Loader2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Users
} from 'lucide-react';
import { RFI } from '@/hooks/useRFI';
import { useContactos } from '@/hooks/useContactos';
import { useRFIDestinatarios } from '@/hooks/useRFIDestinatarios';
import { ContactoSelector } from './ContactoSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RFIDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfi: RFI | null;
  isMandante?: boolean;
  projectId?: string;
  onSuccess?: () => void;
}

const getStatusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'pendiente':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'respondido':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'cerrado':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-amber-100 text-amber-700 border-amber-200';
  }
};

const getUrgenciaColor = (urgencia: string | null) => {
  switch (urgencia?.toLowerCase()) {
    case 'muy_urgente':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'urgente':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return 'bg-blue-100 text-blue-700 border-blue-200';
  }
};

const getUrgenciaLabel = (urgencia: string | null) => {
  switch (urgencia?.toLowerCase()) {
    case 'muy_urgente': return 'Muy urgente';
    case 'urgente': return 'Urgente';
    default: return 'No urgente';
  }
};

const getUrgenciaIcon = (urgencia: string | null) => {
  switch (urgencia?.toLowerCase()) {
    case 'muy_urgente':
      return <AlertCircle className="h-4 w-4" />;
    case 'urgente':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export const RFIDetailModal: React.FC<RFIDetailModalProps> = ({
  open,
  onOpenChange,
  rfi,
  isMandante = false,
  projectId,
  onSuccess
}) => {
  const [respuesta, setRespuesta] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForwardSection, setShowForwardSection] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const { toast } = useToast();
  
  const { contactos, loading: contactosLoading, addContacto } = useContactos(projectId || '');
  const { destinatarios, addDestinatarios } = useRFIDestinatarios(rfi?.id || null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setRespuesta('');
      setShowForwardSection(false);
      setSelectedContactIds([]);
    }
  }, [open]);

  if (!rfi) return null;

  const isPending = rfi.Status?.toLowerCase() === 'pendiente';
  const canRespond = isMandante && isPending;
  // Mandante y contratista pueden reenviar si hay projectId y el RFI está pendiente
  const canForward = isPending && !!projectId;

  const handleSubmitResponse = async () => {
    if (!respuesta.trim()) {
      toast({
        title: "Error",
        description: "Debe ingresar una respuesta",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('RFI' as any)
        .update({
          Respuesta: respuesta,
          Status: 'Respondido',
          Fecha_Respuesta: new Date().toISOString(),
        } as any)
        .eq('id', rfi.id);

      if (error) throw error;

      // Send response notification to contractor
      try {
        const { error: notifError } = await supabase.functions.invoke('send-rfi-response', {
          body: { 
            rfiId: rfi.id,
            respuesta: respuesta
          }
        });
        
        if (notifError) {
          console.error('⚠️ Error sending RFI response notification:', notifError);
        } else {
          console.log('✅ RFI response notification sent to contractor');
        }
      } catch (notifError) {
        console.error('⚠️ Error sending RFI response notification:', notifError);
      }

      toast({
        title: "Respuesta enviada",
        description: "El RFI ha sido respondido correctamente",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la respuesta",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForward = async () => {
    if (selectedContactIds.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un especialista",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const idsToNotify = [...selectedContactIds];
      await addDestinatarios(rfi.id, idsToNotify);

      // Enviar notificación por email a los especialistas seleccionados (fire & forget)
      const pid = projectId ? parseInt(projectId) : NaN;
      if (!Number.isNaN(pid)) {
        supabase.functions
          .invoke('send-rfi-notification', {
            body: {
              rfiId: rfi.id,
              projectId: pid,
              destinatarioIds: idsToNotify,
            },
          })
          .then(({ error: notifError }) => {
            if (notifError) {
              console.error('⚠️ Error sending RFI forward notification:', notifError);
            } else {
              console.log('✅ RFI forward notification sent to specialists');
            }
          })
          .catch((notifError) => {
            console.error('⚠️ Error sending RFI forward notification:', notifError);
          });
      }

      toast({
        title: "RFI reenviado",
        description: `Se reenvió a ${idsToNotify.length} especialista(s)`,
      });

      setShowForwardSection(false);
      setSelectedContactIds([]);
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            RFI #{rfi.Correlativo || rfi.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status, Urgency and Dates */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Badge className={getStatusColor(rfi.Status)}>
                {rfi.Status || 'Pendiente'}
              </Badge>
              {(rfi as any).Urgencia && (
                <Badge className={`${getUrgenciaColor((rfi as any).Urgencia)} flex items-center gap-1`}>
                  {getUrgenciaIcon((rfi as any).Urgencia)}
                  {getUrgenciaLabel((rfi as any).Urgencia)}
                </Badge>
              )}
            </div>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Creado: {new Date(rfi.created_at).toLocaleDateString('es-CL')}</span>
              </div>
              {(rfi as any).Fecha_Vencimiento && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span>Vence: {new Date((rfi as any).Fecha_Vencimiento).toLocaleDateString('es-CL')}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Title */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Título</h3>
            <p className="text-base font-semibold">{rfi.Titulo || 'Sin título'}</p>
          </div>

          {/* Description */}
          {rfi.Descripcion && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Descripción / Pregunta</h3>
              <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                {rfi.Descripcion}
              </p>
            </div>
          )}

          {/* Destinatarios (especialistas reenviados) */}
          {destinatarios.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-medium text-muted-foreground">Reenviado a especialistas</h3>
                </div>
                <div className="space-y-2">
                  {destinatarios.map((dest) => (
                    <div 
                      key={dest.id} 
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-md text-sm"
                    >
                      <div>
                        <span className="font-medium">{dest.contacto?.nombre}</span>
                        <span className="text-muted-foreground ml-2">({dest.contacto?.rol})</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Enviado: {new Date(dest.enviado_at).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Response */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              <h3 className="text-sm font-medium text-muted-foreground">Respuesta</h3>
            </div>

            {rfi.Respuesta ? (
              <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{rfi.Respuesta}</p>
                {rfi.Fecha_Respuesta && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Respondido el: {new Date(rfi.Fecha_Respuesta).toLocaleDateString('es-CL')}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Solo mandante puede responder */}
                {canRespond && (
                  <>
                    <Textarea
                      value={respuesta}
                      onChange={(e) => setRespuesta(e.target.value)}
                      placeholder="Escriba su respuesta aquí..."
                      className="min-h-[100px]"
                    />
                    <Button 
                      onClick={handleSubmitResponse}
                      disabled={isSubmitting || !respuesta.trim()}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Enviar respuesta
                    </Button>
                  </>
                )}

                {/* Mandante y contratista pueden reenviar */}
                {canForward && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowForwardSection(!showForwardSection)}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      <Forward className="h-4 w-4 mr-2" />
                      Reenviar a especialista
                    </Button>

                    {showForwardSection && (
                      <div className="border rounded-md p-4 space-y-4">
                        <ContactoSelector
                          contactos={contactos}
                          selectedIds={selectedContactIds}
                          onSelectionChange={setSelectedContactIds}
                          loading={contactosLoading}
                          onAddContacto={addContacto}
                          projectId={projectId!}
                        />
                        <Button
                          onClick={handleForward}
                          disabled={isSubmitting || selectedContactIds.length === 0}
                          variant="secondary"
                          className="w-full"
                        >
                          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Reenviar RFI ({selectedContactIds.length} seleccionado(s))
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {/* Mensaje cuando no hay respuesta y no puede hacer nada */}
                {!canRespond && !canForward && (
                  <p className="text-sm text-muted-foreground italic">
                    Aún no hay respuesta para este RFI
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Attachment */}
          {rfi.URL && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Documento adjunto</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(rfi.URL!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver documento
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
