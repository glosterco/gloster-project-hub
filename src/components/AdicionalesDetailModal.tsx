import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Clock, FileText, TrendingUp, Paperclip, Check, X, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { Adicional } from '@/hooks/useAdicionales';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RFIAttachmentViewer } from './RFIAttachmentViewer';

interface AdicionalesDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adicional: Adicional | null;
  currency?: string;
  isMandante?: boolean;
  onSuccess?: () => void;
}

const getStatusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pendiente':
      return 'secondary';
    case 'aprobado':
      return 'default';
    case 'rechazado':
      return 'destructive';
    case 'enviado':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusColor = (status: string) => {
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

export const AdicionalesDetailModal: React.FC<AdicionalesDetailModalProps> = ({
  open,
  onOpenChange,
  adicional,
  currency = 'CLP',
  isMandante = false,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [montoAprobado, setMontoAprobado] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const { toast } = useToast();

  if (!adicional) return null;

  const canApprove = isMandante && (adicional.Status === 'Pendiente' || adicional.Status === 'Enviado');

  const handleApprove = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || 'mandante@email.com';
      
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

      // Send response notification to contractor
      try {
        const { error: notifError } = await supabase.functions.invoke('send-adicional-response', {
          body: { 
            adicionalId: adicional.id,
            action: 'approved',
            montoAprobado: montoAprobado ? parseFloat(montoAprobado) : adicional.Monto_presentado
          }
        });
        
        if (notifError) {
          console.error('⚠️ Error sending response notification:', notifError);
        } else {
          console.log('✅ Response notification sent to contractor');
        }
      } catch (notifError) {
        console.error('⚠️ Error sending response notification:', notifError);
      }

      toast({
        title: "Adicional aprobado",
        description: "El adicional ha sido aprobado exitosamente",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error approving adicional:', error);
      toast({
        title: "Error",
        description: "No se pudo aprobar el adicional",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || 'mandante@email.com';
      
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

      // Send rejection notification to contractor
      try {
        const { error: notifError } = await supabase.functions.invoke('send-adicional-response', {
          body: { 
            adicionalId: adicional.id,
            action: 'rejected',
            rejectionNotes: rejectionNotes
          }
        });
        
        if (notifError) {
          console.error('⚠️ Error sending rejection notification:', notifError);
        } else {
          console.log('✅ Rejection notification sent to contractor');
        }
      } catch (notifError) {
        console.error('⚠️ Error sending rejection notification:', notifError);
      }

      toast({
        title: "Adicional rechazado",
        description: "El adicional ha sido rechazado",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error rejecting adicional:', error);
      toast({
        title: "Error",
        description: "No se pudo rechazar el adicional",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowRejectForm(false);
      setRejectionNotes('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-rubik text-xl">
              Adicional #{adicional.Correlativo || adicional.id}
            </DialogTitle>
            <Badge 
              variant={getStatusVariant(adicional.Status)}
              className={`${getStatusColor(adicional.Status)} font-rubik`}
            >
              {adicional.Status || 'Pendiente'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik">
                <FileText className="h-5 w-5" />
                <span>Información General</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground font-rubik">Categoría</p>
                  <p className="font-semibold font-rubik">{adicional.Categoria || 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground font-rubik">Especialidad</p>
                  <p className="font-semibold font-rubik">{adicional.Especialidad || 'No especificada'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground font-rubik">Título</p>
                  <p className="font-semibold font-rubik">{adicional.Titulo || 'Sin título'}</p>
                </div>
              </div>
              
              {adicional.Descripcion && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground font-rubik">Descripción</p>
                  <p className="text-sm font-rubik mt-1">{adicional.Descripcion}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground font-rubik">Fecha de Creación</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-rubik">{new Date(adicional.created_at).toLocaleDateString('es-CL')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Financiera */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik">
                <DollarSign className="h-5 w-5" />
                <span>Información Financiera</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-700 font-rubik">Monto Presentado</p>
                    <p className="text-xl font-bold text-blue-800 font-rubik">
                      {adicional.Monto_presentado ? 
                        formatCurrency(adicional.Monto_presentado, currency) : 
                        'No especificado'
                      }
                    </p>
                  </div>
                  
                  {adicional.GG && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-purple-700 font-rubik">GG (%)</p>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="text-xl font-bold text-purple-800 font-rubik">{adicional.GG}%</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-700 font-rubik">Monto Aprobado</p>
                    <p className="text-xl font-bold text-green-800 font-rubik">
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
                <CardTitle className="flex items-center space-x-2 font-rubik">
                  <Clock className="h-5 w-5" />
                  <span>Fechas y Plazos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-medium text-orange-700 font-rubik">Fecha de Vencimiento</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span className="text-lg font-semibold text-orange-800 font-rubik">
                      {new Date(adicional.Vencimiento).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información de aprobación/rechazo */}
          {adicional.approved_at && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-rubik">
                  {adicional.Status === 'Aprobado' ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                  <span>Historial de Revisión</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-rubik">
                  <span className="text-muted-foreground">Revisado por:</span>{' '}
                  <span className="font-medium">{adicional.approved_by_email}</span>
                </p>
                <p className="text-sm font-rubik">
                  <span className="text-muted-foreground">Fecha:</span>{' '}
                  <span className="font-medium">{new Date(adicional.approved_at).toLocaleDateString('es-CL')}</span>
                </p>
                {adicional.rejection_notes && (
                  <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-700 font-rubik">Motivo de rechazo:</p>
                    <p className="text-sm text-red-600 font-rubik mt-1">{adicional.rejection_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Acciones de Mandante */}
          {canApprove && (
            <Card>
              <CardHeader>
                <CardTitle className="font-rubik">Acciones de Aprobación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showRejectForm ? (
                  <>
                    <div className="space-y-2">
                      <Label className="font-rubik">Monto a Aprobar ({currency})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={adicional.Monto_presentado?.toString() || '0'}
                        value={montoAprobado}
                        onChange={(e) => setMontoAprobado(e.target.value)}
                        className="font-rubik"
                      />
                      <p className="text-xs text-muted-foreground font-rubik">
                        Deje vacío para aprobar el monto presentado
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleApprove} 
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 font-rubik"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Aprobar
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => setShowRejectForm(true)}
                        disabled={loading}
                        className="flex-1 font-rubik"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-rubik">Motivo del Rechazo *</Label>
                      <Textarea
                        placeholder="Ingrese el motivo del rechazo..."
                        value={rejectionNotes}
                        onChange={(e) => setRejectionNotes(e.target.value)}
                        className="min-h-[100px] font-rubik"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectionNotes('');
                        }}
                        disabled={loading}
                        className="flex-1 font-rubik"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={handleReject}
                        disabled={loading}
                        className="flex-1 font-rubik"
                      >
                        {loading ? (
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

          {/* Documentos adjuntos - usando visor embebido sin referencias a Drive */}
          {adicional.URL && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-rubik">
                  <Paperclip className="h-5 w-5" />
                  <span>Documentos adjuntos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RFIAttachmentViewer attachmentsUrl={adicional.URL} />
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};