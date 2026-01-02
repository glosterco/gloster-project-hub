import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Users,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useContactos } from '@/hooks/useContactos';
import { useRFIDestinatarios } from '@/hooks/useRFIDestinatarios';
import { ContactoSelector } from '@/components/ContactoSelector';

interface RFI {
  id: number;
  Correlativo: number | null;
  Titulo: string | null;
  Descripcion: string | null;
  Status: string | null;
  Urgencia: string | null;
  Fecha_Vencimiento: string | null;
  Respuesta: string | null;
  Fecha_Respuesta: string | null;
  URL: string | null;
  created_at: string;
  Proyecto: number | null;
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

const RFIDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rfi, setRfi] = useState<RFI | null>(null);
  const [loading, setLoading] = useState(true);
  const [respuesta, setRespuesta] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForwardSection, setShowForwardSection] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);

  // Get user type from URL params (set by email access flow)
  const userType = searchParams.get('userType');
  const isMandante = userType === 'mandante' || userType === 'approver';

  const projectId = rfi?.Proyecto?.toString() || '';
  const { contactos, loading: contactosLoading, addContacto } = useContactos(projectId);
  const { destinatarios, addDestinatarios } = useRFIDestinatarios(rfi?.id || null);

  useEffect(() => {
    const fetchRFI = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('RFI')
          .select('*')
          .eq('id', parseInt(id))
          .single();

        if (error) throw error;
        setRfi(data);
      } catch (error) {
        console.error('Error fetching RFI:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el RFI",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRFI();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!rfi) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <HelpCircle className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">RFI no encontrado</h1>
        <p className="text-muted-foreground">El RFI solicitado no existe o no tiene acceso.</p>
      </div>
    );
  }

  const isPending = rfi.Status?.toLowerCase() === 'pendiente';
  const canRespond = isMandante && isPending;
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
        .from('RFI')
        .update({
          Respuesta: respuesta,
          Status: 'Respondido',
          Fecha_Respuesta: new Date().toISOString(),
        })
        .eq('id', rfi.id);

      if (error) throw error;

      // Send response notification
      supabase.functions.invoke('send-rfi-response', {
        body: { rfiId: rfi.id, respuesta }
      }).catch(console.error);

      toast({
        title: "Respuesta enviada",
        description: "El RFI ha sido respondido correctamente",
      });

      // Refresh data
      setRfi({ ...rfi, Respuesta: respuesta, Status: 'Respondido', Fecha_Respuesta: new Date().toISOString() });
      setRespuesta('');
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

    const pid = parseInt(projectId);
    if (isNaN(pid)) {
      toast({
        title: "Error",
        description: "No se puede reenviar el RFI: proyecto no identificado",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDestinatarios(rfi.id, selectedContactIds);

      supabase.functions.invoke('send-rfi-notification', {
        body: { rfiId: rfi.id, projectId: pid, destinatarioIds: selectedContactIds }
      }).catch(console.error);

      toast({
        title: "RFI reenviado",
        description: `Se reenvió a ${selectedContactIds.length} especialista(s)`,
      });

      setShowForwardSection(false);
      setSelectedContactIds([]);
    } catch (error) {
      console.error('Error forwarding RFI:', error);
      toast({
        title: "Error",
        description: "No se pudo reenviar el RFI",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold">RFI #{rfi.Correlativo || rfi.id}</h1>
          </div>
        </div>

        {/* Status and Dates */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(rfi.Status)}>
                  {rfi.Status || 'Pendiente'}
                </Badge>
                {rfi.Urgencia && (
                  <Badge className={`${getUrgenciaColor(rfi.Urgencia)} flex items-center gap-1`}>
                    {getUrgenciaIcon(rfi.Urgencia)}
                    {getUrgenciaLabel(rfi.Urgencia)}
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Creado: {new Date(rfi.created_at).toLocaleDateString('es-CL')}</span>
                </div>
                {rfi.Fecha_Vencimiento && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <Clock className="h-4 w-4" />
                    <span>Vence: {new Date(rfi.Fecha_Vencimiento).toLocaleDateString('es-CL')}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Title and Description */}
        <Card>
          <CardHeader>
            <CardTitle>Título</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg font-semibold">{rfi.Titulo || 'Sin título'}</p>
            
            {rfi.Descripcion && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Descripción / Pregunta</h3>
                  <p className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md">
                    {rfi.Descripcion}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Destinatarios */}
        {destinatarios.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Reenviado a especialistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {destinatarios.map((dest) => (
                  <div 
                    key={dest.id} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-md"
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
            </CardContent>
          </Card>
        )}

        {/* Response Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" />
              Respuesta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rfi.Respuesta ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{rfi.Respuesta}</p>
                {rfi.Fecha_Respuesta && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Respondido el: {new Date(rfi.Fecha_Respuesta).toLocaleDateString('es-CL')}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {canRespond && (
                  <>
                    <Textarea
                      value={respuesta}
                      onChange={(e) => setRespuesta(e.target.value)}
                      placeholder="Escriba su respuesta aquí..."
                      className="min-h-[120px]"
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
                          projectId={projectId}
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

                {!canRespond && !canForward && (
                  <p className="text-sm text-muted-foreground italic text-center py-4">
                    Aún no hay respuesta para este RFI
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attachment */}
        {rfi.URL && (
          <Card>
            <CardHeader>
              <CardTitle>Documento adjunto</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => window.open(rfi.URL!, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver documento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RFIDetail;
