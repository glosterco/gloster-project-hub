
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useDirectDownload } from '@/hooks/useDirectDownload';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import PaymentDetailHeader from '@/components/payment/PaymentDetailHeader';
import PaymentDetailForm from '@/components/payment/PaymentDetailForm';
import DocumentationSection from '@/components/payment/DocumentationSection';
import PaymentDetailActions from '@/components/payment/PaymentDetailActions';
import NavigationGuard from '@/components/payment/NavigationGuard';

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

  const handleBackClick = () => {
    guardedNavigate(() => navigate(`/project/${payment?.Project}`));
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

  const canDownloadFiles = ['enviado', 'aprobado', 'rechazado'].includes(payment.Status?.toLowerCase() || '');

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <NavigationGuard 
        showConfirm={showConfirm}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />

      <div className="container mx-auto px-6 py-8">
        <PaymentDetailHeader 
          payment={payment}
          onBackClick={handleBackClick}
        />

        {!canPreviewOrSend() && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Debes completar el monto total y progreso antes de poder ver la vista previa o enviar el estado de pago.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PaymentDetailForm
            total={total}
            progress={progress}
            onTotalChange={setTotal}
            onProgressChange={setProgress}
            onSave={handleSave}
            hasUnsavedChanges={hasUnsavedChanges}
            isUpdating={isUpdating}
          />

          <DocumentationSection
            canDownloadFiles={canDownloadFiles}
            onDownloadFiles={handleDownloadFiles}
            downloadLoading={downloadLoading}
          />
        </div>

        <PaymentDetailActions
          canPreviewOrSend={canPreviewOrSend()}
          onPreview={handlePreview}
          onSendToMandante={handleSendToMandante}
        />
      </div>
    </div>
  );
};

export default PaymentDetail;
