import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  HelpCircle, 
  Calendar, 
  Forward, 
  Loader2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Users,
  CheckCircle,
  Lock
} from 'lucide-react';
import { RFI } from '@/hooks/useRFI';
import { useContactos } from '@/hooks/useContactos';
import { useRFIDestinatarios } from '@/hooks/useRFIDestinatarios';
import { useRFIMessages } from '@/hooks/useRFIMessages';
import { ContactoSelector } from './ContactoSelector';
import { RFIConversationHistory } from './RFIConversationHistory';
import { RFIResponseForm } from './RFIResponseForm';
import { RFIAttachmentViewer } from './RFIAttachmentViewer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RFIDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfi: RFI | null;
  isMandante?: boolean;
  isContratista?: boolean;
  projectId?: string;
  userEmail?: string;
  userName?: string;
  onSuccess?: () => void;
}

const getStatusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'pendiente':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'respondido':
      return 'bg-blue-100 text-blue-700 border-blue-200';
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
  isContratista = false,
  projectId,
  userEmail,
  userName,
  onSuccess
}) => {
  const [showForwardSection, setShowForwardSection] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { toast } = useToast();
  
  const { contactos, loading: contactosLoading, addContacto } = useContactos(projectId || '');
  const { destinatarios, addDestinatarios } = useRFIDestinatarios(rfi?.id || null);
  const { 
    messages, 
    loading: messagesLoading, 
    sending, 
    sendMessage, 
    closeRFI: closeRFIAction,
    fetchMessages 
  } = useRFIMessages(rfi?.id || null);

  const userRole = useMemo(() => {
    if (isContratista) return 'contratista';
    if (isMandante) return 'mandante';
    return 'especialista';
  }, [isMandante, isContratista]);

  const hasResponses = useMemo(() => {
    return messages.length > 0 || !!rfi?.Respuesta;
  }, [messages, rfi?.Respuesta]);

  useEffect(() => {
    if (!open) {
      setShowForwardSection(false);
      setSelectedContactIds([]);
    } else if (rfi?.id) {
      fetchMessages();
    }
  }, [open, rfi?.id, fetchMessages]);

  if (!rfi) return null;

  const isPending = rfi.Status?.toLowerCase() === 'pendiente';
  const isRespondido = rfi.Status?.toLowerCase() === 'respondido';
  const isCerrado = rfi.Status?.toLowerCase() === 'cerrado';
  
  const canRespond = !isCerrado && !!userEmail;
  const canForward = !isCerrado && !!projectId;
  const canClose = isContratista && (isPending || isRespondido) && hasResponses;

  const handleForward = async () => {
    if (selectedContactIds.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un especialista",
        variant: "destructive",
      });
      return;
    }

    const pid = projectId ? parseInt(projectId) : NaN;
    if (Number.isNaN(pid)) {
      toast({
        title: "Error",
        description: "No se puede reenviar el RFI: proyecto no identificado",
        variant: "destructive",
      });
      return;
    }

    setIsForwarding(true);
    try {
      const idsToNotify = [...selectedContactIds];
      await addDestinatarios(rfi.id, idsToNotify);

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
          }
        });

      toast({
        title: "RFI reenviado",
        description: `Se reenvió a ${idsToNotify.length} especialista(s)`,
      });

      setShowForwardSection(false);
      setSelectedContactIds([]);
    } catch (error) {
      console.error('❌ Error forwarding RFI:', error);
      toast({
        title: "Error",
        description: "No se pudo reenviar el RFI",
        variant: "destructive",
      });
    } finally {
      setIsForwarding(false);
    }
  };

  const handleCloseRFI = async () => {
    if (!userEmail) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive",
      });
      return;
    }

    setIsClosing(true);
    try {
      const success = await closeRFIAction({
        authorEmail: userEmail,
        authorName: userName,
      });

      if (success) {
        onOpenChange(false);
        onSuccess?.();
      }
    } finally {
      setIsClosing(false);
    }
  };

  const handleSendMessage = async (params: Parameters<typeof sendMessage>[0]) => {
    const success = await sendMessage(params);
    if (success) {
      onSuccess?.();
    }
    return success;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              {isCerrado && (
                <Badge className="bg-gray-100 text-gray-600 border-gray-200 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Cerrado
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

          {/* Original attachment - Using embedded viewer instead of external link */}
          {rfi.URL && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Documento original</h3>
              <RFIAttachmentViewer attachmentsUrl={rfi.URL} />
            </div>
          )}

          {/* Destinatarios (forwarded specialists) */}
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

          {/* Conversation History */}
          {rfi.id && projectId && (
            <RFIConversationHistory 
              rfiId={rfi.id} 
              projectId={parseInt(projectId)} 
            />
          )}

          {/* Legacy response (backwards compatibility) */}
          {rfi.Respuesta && messages.length === 0 && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-md">
              <h4 className="text-sm font-medium text-green-700 mb-2">Respuesta anterior</h4>
              <p className="text-sm whitespace-pre-wrap">{rfi.Respuesta}</p>
              {rfi.Fecha_Respuesta && (
                <p className="text-xs text-muted-foreground mt-2">
                  Respondido el: {new Date(rfi.Fecha_Respuesta).toLocaleDateString('es-CL')}
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Response Form (if not closed) */}
          {canRespond && userEmail && projectId && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Agregar respuesta</h3>
              <RFIResponseForm
                rfiId={rfi.id}
                projectId={parseInt(projectId)}
                authorEmail={userEmail}
                authorName={userName}
                authorRole={userRole}
                onSubmit={handleSendMessage}
                sending={sending}
                disabled={isCerrado}
              />
            </div>
          )}

          {/* Closed message */}
          {isCerrado && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-md text-center">
              <Lock className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                Este RFI ha sido cerrado y no permite más respuestas.
              </p>
            </div>
          )}

          {/* Forward section */}
          {canForward && (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setShowForwardSection(!showForwardSection)}
                disabled={isForwarding}
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
                    disabled={isForwarding || selectedContactIds.length === 0}
                    variant="secondary"
                    className="w-full"
                  >
                    {isForwarding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Reenviar RFI ({selectedContactIds.length} seleccionado(s))
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Close RFI button (only for contratista) */}
          {canClose && (
            <div className="pt-2">
              <Button
                variant="default"
                onClick={handleCloseRFI}
                disabled={isClosing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isClosing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Cerrar RFI
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Al cerrar el RFI, se notificará a todos los involucrados.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
