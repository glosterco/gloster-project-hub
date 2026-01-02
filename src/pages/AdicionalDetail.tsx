import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText, 
  TrendingUp, 
  ExternalLink, 
  Check, 
  X, 
  Loader2,
  ArrowLeft,
  Package
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Adicional {
  id: number;
  Correlativo: number | null;
  Categoria: string | null;
  Especialidad: string | null;
  Titulo: string | null;
  Descripcion: string | null;
  Monto_presentado: number | null;
  Monto_aprobado: number | null;
  GG: number | null;
  Status: string | null;
  Vencimiento: string | null;
  URL: string | null;
  created_at: string;
  approved_at: string | null;
  approved_by_email: string | null;
  rejection_notes: string | null;
  Proyecto: number | null;
}

interface Project {
  Currency: string | null;
}

const getStatusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'pendiente':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'aprobado':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'rechazado':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'enviado':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const AdicionalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [adicional, setAdicional] = useState<Adicional | null>(null);
  const [currency, setCurrency] = useState('CLP');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [montoAprobado, setMontoAprobado] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Get user type from URL params (set by email access flow)
  const userType = searchParams.get('userType');
  const isMandante = userType === 'mandante' || userType === 'approver';

  useEffect(() => {
    const fetchAdicional = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('Adicionales')
          .select('*')
          .eq('id', parseInt(id))
          .single();

        if (error) throw error;
        setAdicional(data);

        // Fetch project currency
        if (data?.Proyecto) {
          const { data: projectData } = await supabase
            .from('Proyectos')
            .select('Currency')
            .eq('id', data.Proyecto)
            .single();
          
          if (projectData?.Currency) {
            setCurrency(projectData.Currency);
          }
        }
      } catch (error) {
        console.error('Error fetching adicional:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el adicional",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdicional();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!adicional) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Adicional no encontrado</h1>
        <p className="text-muted-foreground">El adicional solicitado no existe o no tiene acceso.</p>
      </div>
    );
  }

  const canApprove = isMandante && (adicional.Status === 'Pendiente' || adicional.Status === 'Enviado');

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const userEmail = sessionStorage.getItem('verifiedEmail') || 'mandante@email.com';
      
      const { error } = await supabase
        .from('Adicionales')
        .update({
          Status: 'Aprobado',
          Monto_aprobado: montoAprobado ? parseFloat(montoAprobado) : adicional.Monto_presentado,
          approved_by_email: userEmail,
          approved_at: new Date().toISOString()
        })
        .eq('id', adicional.id);

      if (error) throw error;

      // Send response notification
      supabase.functions.invoke('send-adicional-response', {
        body: { 
          adicionalId: adicional.id,
          action: 'approved',
          montoAprobado: montoAprobado ? parseFloat(montoAprobado) : adicional.Monto_presentado
        }
      }).catch(console.error);

      toast({
        title: "Adicional aprobado",
        description: "El adicional ha sido aprobado exitosamente",
      });

      // Update local state
      setAdicional({
        ...adicional,
        Status: 'Aprobado',
        Monto_aprobado: montoAprobado ? parseFloat(montoAprobado) : adicional.Monto_presentado,
        approved_by_email: userEmail,
        approved_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error approving adicional:', error);
      toast({
        title: "Error",
        description: "No se pudo aprobar el adicional",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionNotes.trim()) {
      toast({
        title: "Error",
        description: "Debe ingresar un motivo de rechazo",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const userEmail = sessionStorage.getItem('verifiedEmail') || 'mandante@email.com';
      
      const { error } = await supabase
        .from('Adicionales')
        .update({
          Status: 'Rechazado',
          rejection_notes: rejectionNotes,
          approved_by_email: userEmail,
          approved_at: new Date().toISOString()
        })
        .eq('id', adicional.id);

      if (error) throw error;

      // Send rejection notification
      supabase.functions.invoke('send-adicional-response', {
        body: { 
          adicionalId: adicional.id,
          action: 'rejected',
          rejectionNotes: rejectionNotes
        }
      }).catch(console.error);

      toast({
        title: "Adicional rechazado",
        description: "El adicional ha sido rechazado",
      });

      // Update local state
      setAdicional({
        ...adicional,
        Status: 'Rechazado',
        rejection_notes: rejectionNotes,
        approved_by_email: userEmail,
        approved_at: new Date().toISOString()
      });
      setShowRejectForm(false);
    } catch (error) {
      console.error('Error rejecting adicional:', error);
      toast({
        title: "Error",
        description: "No se pudo rechazar el adicional",
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Adicional #{adicional.Correlativo || adicional.id}</h1>
            </div>
          </div>
          <Badge className={getStatusColor(adicional.Status)}>
            {adicional.Status || 'Pendiente'}
          </Badge>
        </div>

        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categoría</p>
                <p className="font-semibold">{adicional.Categoria || 'No especificada'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Especialidad</p>
                <p className="font-semibold">{adicional.Especialidad || 'No especificada'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Título</p>
                <p className="font-semibold">{adicional.Titulo || 'Sin título'}</p>
              </div>
            </div>
            
            {adicional.Descripcion && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descripción</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{adicional.Descripcion}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(adicional.created_at).toLocaleDateString('es-CL')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Financiera */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Información Financiera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-700">Monto Presentado</p>
                  <p className="text-xl font-bold text-blue-800">
                    {adicional.Monto_presentado ? 
                      formatCurrency(adicional.Monto_presentado, currency) : 
                      'No especificado'
                    }
                  </p>
                </div>
                
                {adicional.GG && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-medium text-purple-700">GG (%)</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-xl font-bold text-purple-800">{adicional.GG}%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-700">Monto Aprobado</p>
                  <p className="text-xl font-bold text-green-800">
                    {adicional.Monto_aprobado ? 
                      formatCurrency(adicional.Monto_aprobado, currency) : 
                      'Pendiente de aprobación'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fechas y Plazos */}
        {adicional.Vencimiento && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Fechas y Plazos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm font-medium text-orange-700">Fecha de Vencimiento</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span className="text-lg font-semibold text-orange-800">
                    {new Date(adicional.Vencimiento).toLocaleDateString('es-CL')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial de Revisión */}
        {adicional.approved_at && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {adicional.Status === 'Aprobado' ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <X className="h-5 w-5 text-red-600" />
                )}
                Historial de Revisión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Revisado por:</span>{' '}
                <span className="font-medium">{adicional.approved_by_email}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Fecha:</span>{' '}
                <span className="font-medium">{new Date(adicional.approved_at).toLocaleDateString('es-CL')}</span>
              </p>
              {adicional.rejection_notes && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-700">Motivo de rechazo:</p>
                  <p className="text-sm text-red-600 mt-1">{adicional.rejection_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Acciones de Aprobación */}
        {canApprove && (
          <Card>
            <CardHeader>
              <CardTitle>Acciones de Aprobación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showRejectForm ? (
                <>
                  <div className="space-y-2">
                    <Label>Monto a Aprobar ({currency})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={adicional.Monto_presentado?.toString() || '0'}
                      value={montoAprobado}
                      onChange={(e) => setMontoAprobado(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Deje vacío para aprobar el monto presentado
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleApprove} 
                      disabled={isSubmitting}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Aprobar
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => setShowRejectForm(true)}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Motivo del Rechazo *</Label>
                    <Textarea
                      placeholder="Ingrese el motivo del rechazo..."
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionNotes('');
                      }}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Confirmar Rechazo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Documentos */}
        {adicional.URL && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open(adicional.URL!, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver documentos externos
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdicionalDetail;
