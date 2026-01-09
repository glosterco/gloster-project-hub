import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Clock, FileText, TrendingUp, Paperclip, Check, X, Loader2, Pause, Play, User } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { Adicional, calculateDaysElapsed, calculatePausedDays } from '@/hooks/useAdicionales';
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
    case 'enviado':
      return 'secondary';
    case 'pausado':
      return 'outline';
    case 'aprobado':
      return 'default';
    case 'rechazado':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'enviado':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'pausado':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'aprobado':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'rechazado':
      return 'bg-red-100 text-red-700 border-red-200';
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
  const [actionNotes, setActionNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showPauseForm, setShowPauseForm] = useState(false);
  const { toast } = useToast();

  if (!adicional) return null;

  // Solo mandante puede realizar acciones
  const canApprove = isMandante && adicional.Status === 'Enviado';
  const canPause = isMandante && adicional.Status === 'Enviado';
  const canResume = isMandante && adicional.Status === 'Pausado';
  const canReject = isMandante && (adicional.Status === 'Enviado' || adicional.Status === 'Pausado');

  const daysElapsed = calculateDaysElapsed(adicional);
  const pausedDays = calculatePausedDays(adicional);

  const getVerifiedEmail = (): string => {
    // Intentar obtener email de session storage (para ProjectAccess)
    const accessData = sessionStorage.getItem('mandanteAccess');
    if (accessData) {
      try {
        const parsed = JSON.parse(accessData);
        if (parsed.email) return parsed.email;
      } catch (e) {}
    }
    // Fallback
    return 'mandante@email.com';
  };

  const handleApprove = async () => {
    // Comentario opcional para aprobación
    setLoading(true);
    try {
      const userEmail = getVerifiedEmail();
      
      const { error } = await supabase
        .from('Adicionales')
        .update({
          Status: 'Aprobado',
          Monto_aprobado: montoAprobado ? parseFloat(montoAprobado) : adicional.Monto_presentado,
          approved_by_email: userEmail,
          approved_at: new Date().toISOString(),
          action_notes: actionNotes
        } as any)
        .eq('id', adicional.id);

      if (error) throw error;

      // Send response notification
      supabase.functions.invoke('send-adicional-response', {
        body: { 
          adicionalId: adicional.id,
          status: 'Aprobado',
          montoAprobado: montoAprobado ? parseFloat(montoAprobado) : adicional.Monto_presentado
        }
      }).catch(console.error);

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

  const handlePause = async () => {
    if (!actionNotes.trim()) {
      toast({
        title: "Comentario requerido",
        description: "Debe ingresar un motivo para pausar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const userEmail = getVerifiedEmail();
      
      const { error } = await supabase
        .from('Adicionales')
        .update({
          Status: 'Pausado',
          paused_at: new Date().toISOString(),
          action_notes: actionNotes,
          approved_by_email: userEmail
        } as any)
        .eq('id', adicional.id);

      if (error) throw error;

      // Send notification
      supabase.functions.invoke('send-adicional-response', {
        body: { 
          adicionalId: adicional.id,
          status: 'Pausado'
        }
      }).catch(console.error);

      toast({
        title: "Adicional pausado",
        description: "El adicional ha sido pausado. El conteo de días se ha detenido.",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error pausing adicional:', error);
      toast({
        title: "Error",
        description: "No se pudo pausar el adicional",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowPauseForm(false);
      setActionNotes('');
    }
  };

  const handleResume = async () => {
    setLoading(true);
    try {
      // Calcular días pausados acumulados
      const currentPausedDays = calculatePausedDays(adicional);
      
      const { error } = await supabase
        .from('Adicionales')
        .update({
          Status: 'Enviado',
          paused_at: null,
          paused_days: currentPausedDays
        } as any)
        .eq('id', adicional.id);

      if (error) throw error;

      toast({
        title: "Adicional reactivado",
        description: "El adicional ha sido reactivado. El conteo de días continúa.",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error resuming adicional:', error);
      toast({
        title: "Error",
        description: "No se pudo reactivar el adicional",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!actionNotes.trim()) {
      toast({
        title: "Comentario requerido",
        description: "Debe ingresar un motivo de rechazo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const userEmail = getVerifiedEmail();
      
      // Si estaba pausado, calcular días pausados finales
      const finalPausedDays = adicional.Status === 'Pausado' ? calculatePausedDays(adicional) : (adicional.paused_days || 0);
      
      const { error } = await supabase
        .from('Adicionales')
        .update({
          Status: 'Rechazado',
          rejection_notes: actionNotes,
          action_notes: actionNotes,
          approved_by_email: userEmail,
          approved_at: new Date().toISOString(),
          paused_days: finalPausedDays,
          paused_at: null
        } as any)
        .eq('id', adicional.id);

      if (error) throw error;

      // Send rejection notification
      supabase.functions.invoke('send-adicional-response', {
        body: { 
          adicionalId: adicional.id,
          status: 'Rechazado',
          rejectionNotes: actionNotes
        }
      }).catch(console.error);

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
      setActionNotes('');
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
              {adicional.Status || 'Enviado'}
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

              {/* Documentos adjuntos - dentro de Información General */}
              {adicional.URL && (
                <div className="pt-4 border-t">
                  <div className="flex items-center space-x-2 mb-3">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground font-rubik">Documentos adjuntos</p>
                  </div>
                  <RFIAttachmentViewer attachmentsUrl={adicional.URL} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fechas y Plazos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik">
                <Clock className="h-5 w-5" />
                <span>Fechas y Plazos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-700 font-rubik">Fecha de Creación</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-800 font-rubik">
                      {new Date(adicional.created_at).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </div>

                {adicional.Vencimiento && adicional.Status !== 'Aprobado' && adicional.Status !== 'Rechazado' && (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm font-medium text-orange-700 font-rubik">
                      {adicional.Status === 'Pausado' ? 'Vencimiento (Pausado)' : 'Fecha de Vencimiento'}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold text-orange-800 font-rubik">
                        {new Date(adicional.Vencimiento).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                  </div>
                )}

                {(adicional.Status === 'Aprobado' || adicional.Status === 'Rechazado') && adicional.approved_at && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-700 font-rubik">Fecha de Cierre</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-800 font-rubik">
                        {new Date(adicional.approved_at).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-medium text-purple-700 font-rubik">Plazo Transcurrido</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold text-purple-800 font-rubik">
                      {daysElapsed} días
                    </span>
                  </div>
                </div>

                {(pausedDays > 0 || adicional.Status === 'Pausado') && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-700 font-rubik">Días en Pausa</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Pause className="h-4 w-4 text-amber-600" />
                      <span className="font-semibold text-amber-800 font-rubik">
                        {pausedDays} días
                      </span>
                    </div>
                  </div>
                )}
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
                  {adicional.Subtotal && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-sm font-medium text-slate-700 font-rubik">Subtotal</p>
                      <p className="text-lg font-bold text-slate-800 font-rubik">
                        {formatCurrency(adicional.Subtotal, currency)}
                      </p>
                    </div>
                  )}
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-700 font-rubik">Monto Presentado (Total)</p>
                    <p className="text-xl font-bold text-blue-800 font-rubik">
                      {adicional.Monto_presentado ? 
                        formatCurrency(adicional.Monto_presentado, currency) : 
                        'No especificado'
                      }
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    {adicional.GG !== null && adicional.GG !== undefined && (
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 flex-1">
                        <p className="text-xs font-medium text-purple-700 font-rubik">GG</p>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3 text-purple-600" />
                          <span className="text-sm font-bold text-purple-800 font-rubik">{adicional.GG}%</span>
                        </div>
                      </div>
                    )}
                    {adicional.Utilidades !== null && adicional.Utilidades !== undefined && (
                      <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 flex-1">
                        <p className="text-xs font-medium text-indigo-700 font-rubik">Utilidades</p>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3 text-indigo-600" />
                          <span className="text-sm font-bold text-indigo-800 font-rubik">{adicional.Utilidades}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-700 font-rubik">Monto Aprobado</p>
                    <p className="text-xl font-bold text-green-800 font-rubik">
                      {adicional.Monto_aprobado && adicional.Status === 'Aprobado' ? 
                        formatCurrency(adicional.Monto_aprobado, currency) : 
                        '-'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historial de acciones */}
          {(adicional.approved_at || adicional.paused_at || adicional.action_notes || adicional.rejection_notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-rubik">
                  {adicional.Status === 'Aprobado' ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : adicional.Status === 'Rechazado' ? (
                    <X className="h-5 w-5 text-red-600" />
                  ) : adicional.Status === 'Pausado' ? (
                    <Pause className="h-5 w-5 text-amber-600" />
                  ) : null}
                  <span>Historial de Revisión</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {adicional.approved_by_email && (
                  <div className="flex items-center space-x-2 text-sm font-rubik">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Revisado por:</span>
                    <span className="font-medium">{adicional.approved_by_email}</span>
                  </div>
                )}

                {/* Fecha de Aprobación */}
                {adicional.Status === 'Aprobado' && adicional.approved_at && (
                  <div className="flex items-center space-x-2 text-sm font-rubik">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Fecha de aprobación:</span>
                    <span className="font-medium text-green-700">
                      {new Date(adicional.approved_at).toLocaleDateString('es-CL', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {/* Fecha de Rechazo */}
                {adicional.Status === 'Rechazado' && adicional.approved_at && (
                  <div className="flex items-center space-x-2 text-sm font-rubik">
                    <Calendar className="h-4 w-4 text-red-600" />
                    <span className="text-muted-foreground">Fecha de rechazo:</span>
                    <span className="font-medium text-red-700">
                      {new Date(adicional.approved_at).toLocaleDateString('es-CL', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {/* Fecha de Pausa */}
                {adicional.Status === 'Pausado' && adicional.paused_at && (
                  <div className="flex items-center space-x-2 text-sm font-rubik">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <span className="text-muted-foreground">Fecha de pausa:</span>
                    <span className="font-medium text-amber-700">
                      {new Date(adicional.paused_at).toLocaleDateString('es-CL', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {adicional.action_notes && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground font-rubik">Comentario:</p>
                    <p className="text-sm font-rubik mt-1">{adicional.action_notes}</p>
                  </div>
                )}
                {adicional.rejection_notes && adicional.Status === 'Rechazado' && (
                  <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-700 font-rubik">Motivo de rechazo:</p>
                    <p className="text-sm text-red-600 font-rubik mt-1">{adicional.rejection_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Acciones de Mandante - Solo visible para mandante */}
          {isMandante && (canApprove || canPause || canResume || canReject) && (
            <Card>
              <CardHeader>
                <CardTitle className="font-rubik">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showRejectForm && !showPauseForm ? (
                  <>
                    {/* Campo de comentario (opcional para aprobación) */}
                    <div className="space-y-2">
                      <Label className="font-rubik">Comentario / Nota (opcional)</Label>
                      <Textarea
                        placeholder="Ingrese un comentario para su acción..."
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        className="min-h-[80px] font-rubik"
                      />
                    </div>

                    {canApprove && (
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
                    )}

                    <div className="flex flex-wrap gap-3">
                      {canApprove && (
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
                      )}
                      
                      {canPause && (
                        <Button 
                          variant="outline"
                          onClick={() => setShowPauseForm(true)}
                          disabled={loading}
                          className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-50 font-rubik"
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pausar
                        </Button>
                      )}

                      {canResume && (
                        <Button 
                          onClick={handleResume}
                          disabled={loading}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 font-rubik"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Reactivar
                        </Button>
                      )}

                      {canReject && (
                        <Button 
                          variant="destructive"
                          onClick={() => setShowRejectForm(true)}
                          disabled={loading}
                          className="flex-1 font-rubik"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Rechazar
                        </Button>
                      )}
                    </div>
                  </>
                ) : showPauseForm ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-rubik">Motivo de la Pausa *</Label>
                      <Textarea
                        placeholder="Ingrese el motivo de la pausa..."
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        className="min-h-[100px] font-rubik"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowPauseForm(false);
                          setActionNotes('');
                        }}
                        disabled={loading}
                        className="flex-1 font-rubik"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handlePause}
                        disabled={loading}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 font-rubik"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Pause className="h-4 w-4 mr-2" />
                        )}
                        Confirmar Pausa
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-rubik">Motivo del Rechazo *</Label>
                      <Textarea
                        placeholder="Ingrese el motivo del rechazo..."
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        className="min-h-[100px] font-rubik"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowRejectForm(false);
                          setActionNotes('');
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

        </div>
      </DialogContent>
    </Dialog>
  );
};
