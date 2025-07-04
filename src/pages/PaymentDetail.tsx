
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft, Eye, Send, Download, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useDirectDownload } from '@/hooks/useDirectDownload';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { supabase } from '@/integrations/supabase/client';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { payment, loading, error, refetch } = usePaymentDetail(id || '', true);
  const { downloadFilesDirect, loading: downloadLoading } = useDirectDownload();
  const { toast } = useToast();
  
  const [total, setTotal] = useState('');
  const [progress, setProgress] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { showConfirm, confirmNavigation, cancelNavigation, guardedNavigate } = useNavigationGuard({
    hasUnsavedChanges,
    message: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?'
  });

  useEffect(() => {
    if (payment) {
      setTotal(payment.Total?.toString() || '');
      setProgress(payment.Progress?.toString() || '');
    }
  }, [payment]);

  useEffect(() => {
    if (payment) {
      const currentTotal = payment.Total?.toString() || '';
      const currentProgress = payment.Progress?.toString() || '';
      
      setHasUnsavedChanges(
        total !== currentTotal || progress !== currentProgress
      );
    }
  }, [total, progress, payment]);

  const handleSave = async () => {
    if (!payment) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('Estados de pago')
        .update({
          Total: total ? parseInt(total) : null,
          Progress: progress ? parseInt(progress) : null
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Guardado exitoso",
        description: "Los cambios se han guardado correctamente",
      });

      setHasUnsavedChanges(false);
      refetch();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // PASO 3: Validaciones de Total y Progress
  const canPreviewOrSend = () => {
    const hasTotal = total && parseInt(total) > 0;
    const hasProgress = progress && parseInt(progress) >= 0;
    return hasTotal && hasProgress && !hasUnsavedChanges;
  };

  const handlePreview = () => {
    if (!canPreviewOrSend()) {
      toast({
        title: "Campos requeridos",
        description: "Debes completar el monto total y progreso antes de ver la vista previa",
        variant: "destructive"
      });
      return;
    }

    guardedNavigate(() => {
      navigate(`/submission-preview?paymentId=${payment?.id}`);
    });
  };

  const handleSendToMandante = () => {
    if (!canPreviewOrSend()) {
      toast({
        title: "Campos requeridos", 
        description: "Debes completar el monto total y progreso antes de enviar",
        variant: "destructive"
      });
      return;
    }

    guardedNavigate(() => {
      navigate(`/submission-preview?paymentId=${payment?.id}`);
    });
  };

  // PASO 5: Usar useDirectDownload para descarga de archivos
  const handleDownloadFiles = async () => {
    if (!payment) return;

    console.log('🚀 Starting direct file download for payment:', payment.id);
    
    const result = await downloadFilesDirect(payment.id.toString());
    
    if (result.success) {
      console.log(`✅ Successfully downloaded ${result.filesCount} files`);
    } else {
      console.error('❌ Failed to download files:', result.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Cargando detalle del estado de pago...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gloster-gray mb-4">
              {error || "Estado de pago no encontrado."}
            </p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // PASO 2: Usar status real de la base de datos
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aprobado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'enviado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'programado':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canDownloadFiles = ['enviado', 'aprobado', 'rechazado'].includes(payment.Status?.toLowerCase() || '');

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      {/* Navigation Guard Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar salida</h3>
            <p className="text-gray-600 mb-6">
              Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?
            </p>
            <div className="flex space-x-4 justify-end">
              <Button variant="outline" onClick={cancelNavigation}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmNavigation}>
                Salir sin guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => guardedNavigate(() => navigate(`/project/${payment.Project}`))}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Proyecto
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 font-rubik">
                {payment.Name}
              </h1>
              <p className="text-slate-600 mt-2">
                {payment.Mes} {payment.Año} • Vencimiento: {payment.ExpiryDate}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full border font-medium ${getStatusColor(payment.Status || 'programado')}`}>
              {payment.Status || 'Programado'}
            </div>
          </div>
        </div>

        {!canPreviewOrSend() && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Debes completar el monto total y progreso antes de poder ver la vista previa o enviar el estado de pago.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Información del Estado de Pago</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="total">Monto Total *</Label>
                <Input
                  id="total"
                  type="number"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="Ingrese el monto total"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="progress">Progreso (%) *</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  placeholder="Ingrese el porcentaje de progreso"
                  className="mt-1"
                />
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isUpdating}
                  className="w-full"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Documentación Requerida</h2>
            
            <div className="space-y-3">
              <DocumentUploadCard
                title="Carátula EEPP"
                description="Presentación y resumen del estado de pago"
                onUpload={() => {}}
                onDownload={canDownloadFiles ? handleDownloadFiles : undefined}
                isUploaded={true}
                downloadLoading={downloadLoading}
              />
              
              <DocumentUploadCard
                title="Avance Periódico"
                description="Planilla detallada del avance de obras del período"
                onUpload={() => {}}
                onDownload={canDownloadFiles ? handleDownloadFiles : undefined}
                isUploaded={true}
                downloadLoading={downloadLoading}
              />
              
              <DocumentUploadCard
                title="Certificado de Pago de Cotizaciones"
                description="Certificado de cumplimiento de obligaciones previsionales"
                onUpload={() => {}}
                onDownload={canDownloadFiles ? handleDownloadFiles : undefined}
                isUploaded={true}
                downloadLoading={downloadLoading}
              />
              
              <DocumentUploadCard
                title="Certificado F30"
                description="Certificado de antecedentes laborales y previsionales"
                onUpload={() => {}}
                onDownload={canDownloadFiles ? handleDownloadFiles : undefined}
                isUploaded={true}
                downloadLoading={downloadLoading}
              />
              
              <DocumentUploadCard
                title="Certificado F30-1"
                description="Certificado de cumplimiento de obligaciones laborales y previsionales"
                onUpload={() => {}}
                onDownload={canDownloadFiles ? handleDownloadFiles : undefined}
                isUploaded={true}
                downloadLoading={downloadLoading}
              />
              
              <DocumentUploadCard
                title="Factura"
                description="Factura del período correspondiente"
                onUpload={() => {}}
                onDownload={canDownloadFiles ? handleDownloadFiles : undefined}
                isUploaded={true}
                downloadLoading={downloadLoading}
              />
            </div>
          </Card>
        </div>

        <div className="mt-8 flex space-x-4">
          <Button
            onClick={handlePreview}
            disabled={!canPreviewOrSend()}
            variant="outline"
            className="flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
          
          <Button
            onClick={handleSendToMandante}
            disabled={!canPreviewOrSend()}
            className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black flex items-center"
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar al Mandante
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;
