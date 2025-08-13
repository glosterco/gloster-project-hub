import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResubmissionNotificationData {
  paymentId: string;
  contratista: string;
  mandanteCompany: string;
  contractorCompany: string;
  proyecto: string;
  mes: string;
  año: number;
  amount: number;
  mandanteEmail: string;
  dueDate: string;
}

export const useContractorResubmission = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResubmission = async (paymentId: string) => {
    setLoading(true);
    try {
      console.log('🔄 Handling contractor resubmission for payment:', paymentId);

      // Intentar usar acceso público del contratista (sin auth_id)
      try {
        const contractorAccess = sessionStorage.getItem('contractorAccess');
        const mandanteAccess = sessionStorage.getItem('mandanteAccess');
        const accessInfo = contractorAccess
          ? JSON.parse(contractorAccess)
          : (mandanteAccess ? JSON.parse(mandanteAccess) : null);
        const accessToken = accessInfo?.accessToken;
        const userType = accessInfo?.userType;

        if (accessToken && userType === 'contratista') {
          const { data: fnData, error: fnError } = await supabase.functions.invoke('update-payment-detail-public', {
            body: {
              paymentId: parseInt(paymentId),
              token: accessToken,
              markAsSent: true
            }
          });
          if (fnError || !fnData?.success) {
            throw fnError || new Error('No se pudo actualizar el estado (función pública)');
          }
        } else {
          // Usuario autenticado o sin token: actualizar directamente
          const { error: statusError } = await supabase
            .from('Estados de pago')
            .update({ Status: 'Enviado' })
            .eq('id', parseInt(paymentId));

          if (statusError) {
            console.error('❌ Error updating status to Enviado:', statusError);
            throw new Error(`Error al actualizar el estado: ${statusError.message}`);
          }
        }
      } catch (e) {
        throw e;
      }

      console.log('✅ Payment status updated to "Enviado" for resubmission');

      toast({
        title: "Estado de pago reenviado",
        description: "El estado de pago ha sido enviado nuevamente para revisión del mandante.",
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error in resubmission process:', error);
      toast({
        title: "Error al reenviar",
        description: error.message || "Hubo un problema al reenviar el estado de pago.",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleResubmission
  };
};