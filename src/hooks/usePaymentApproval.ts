
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentApprovalHookProps {
  paymentId: string;
  onStatusChange?: () => void;
}

export const usePaymentApproval = ({ paymentId, onStatusChange }: PaymentApprovalHookProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updatePaymentStatus = async (status: 'Aprobado' | 'Rechazado', notes: string) => {
    console.log('🔄 Updating payment status...', { paymentId, status, notes });
    
    const { error: updateError } = await supabase
      .from('Estados de pago')
      .update({ 
        Status: status,
        Notes: notes
      })
      .eq('id', parseInt(paymentId));

    if (updateError) {
      console.error('❌ Error updating payment status:', updateError);
      throw new Error('Error al actualizar el estado del pago');
    }

    console.log(`✅ Payment status updated to ${status}`);
  };

  const fetchPaymentDataForNotification = async () => {
    console.log('🔍 Fetching payment data for notification...', { paymentId });
    
    const { data: paymentData, error: fetchError } = await supabase
      .from('Estados de pago')
      .select(`
        *,
        projectData:Proyectos!Project (
          Name,
          Currency,
          Owner:Mandantes!Owner (
            CompanyName,
            ContactName,
            ContactEmail
          ),
          Contratista:Contratistas!Contratista (
            CompanyName,
            ContactName,
            ContactEmail
          )
        )
      `)
      .eq('id', parseInt(paymentId))
      .single();

    if (fetchError) {
      console.error('❌ Error fetching payment data for notification:', fetchError);
      throw new Error('Error al obtener datos para la notificación');
    }

    console.log('✅ Payment data fetched for notification:', paymentData);
    return paymentData;
  };

  const sendContractorNotification = async (paymentData: any, status: 'Aprobado' | 'Rechazado', rejectionReason?: string) => {
    console.log('📤 Preparing contractor notification data...', {
      contractorEmail: paymentData.projectData?.Contratista?.ContactEmail,
      status,
      rejectionReason
    });

    if (!paymentData.projectData?.Contratista?.ContactEmail) {
      console.warn('⚠️ No contractor email found, skipping notification');
      return { success: false, error: 'No contractor email found' };
    }

    const contractorNotificationData = {
      paymentId: paymentId,
      contractorEmail: paymentData.projectData.Contratista.ContactEmail,
      contractorName: paymentData.projectData.Contratista.ContactName || 'Contratista',
      contractorCompany: paymentData.projectData.Contratista.CompanyName || '',
      mandanteCompany: paymentData.projectData.Owner?.CompanyName || '',
      proyecto: paymentData.projectData.Name || '',
      mes: paymentData.Mes || '',
      año: paymentData.Año || new Date().getFullYear(),
      amount: paymentData.Total || 0,
      status: status,
      rejectionReason: rejectionReason,
      platformUrl: `${window.location.origin}/payment/${paymentId}`,
    };

    console.log(`📤 Invoking send-contractor-notification edge function with data:`, contractorNotificationData);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('send-contractor-notification', {
        body: contractorNotificationData,
      });

      console.log('📡 Edge function response:', { result, error });

      if (error) {
        console.error('❌ Error calling send-contractor-notification:', error);
        throw error;
      }

      if (!result.success) {
        console.error('❌ Edge function returned error:', result.error);
        throw new Error(result.error || 'Failed to send contractor notification');
      }

      console.log('✅ Contractor notification sent successfully:', result);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending contractor notification:', error);
      return { success: false, error: error.message };
    }
  };

  const handleApprove = async () => {
    console.log('🟢 handleApprove called with paymentId:', paymentId);
    
    if (loading) {
      console.log('⏳ Already processing, skipping...');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🟢 Starting approval process for payment:', paymentId);

      // 1. Update payment status
      const approvalNotes = `Aprobado el ${new Date().toLocaleString('es-CL')}`;
      await updatePaymentStatus('Aprobado', approvalNotes);

      // 2. Fetch payment data for notification
      const paymentData = await fetchPaymentDataForNotification();

      // 3. Send notification to contractor
      const notificationResult = await sendContractorNotification(paymentData, 'Aprobado');

      if (notificationResult.success) {
        toast({
          title: "Estado de pago aprobado",
          description: "El estado de pago ha sido aprobado exitosamente y se ha notificado al contratista.",
        });
      } else {
        toast({
          title: "Estado de pago aprobado",
          description: "El estado de pago ha sido aprobado, pero hubo un problema al enviar la notificación.",
          variant: "destructive"
        });
      }

      // 4. Update UI after a delay to prevent loops
      setTimeout(() => {
        onStatusChange?.();
      }, 2000);
      
      console.log('✅ Approval process completed successfully');

    } catch (error) {
      console.error('❌ Error in approval process:', error);
      toast({
        title: "Error al aprobar",
        description: error.message || "Hubo un problema al aprobar el estado de pago.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (rejectionReason: string) => {
    console.log('🔴 handleReject called with:', { paymentId, rejectionReason });
    
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo requerido",
        description: "Por favor ingrese el motivo del rechazo.",
        variant: "destructive"
      });
      return;
    }

    if (loading) {
      console.log('⏳ Already processing, skipping...');
      return;
    }

    setLoading(true);
    try {
      console.log('🔴 Starting rejection process for payment:', paymentId);

      // 1. Update payment status with rejection notes
      const rejectionNotes = `Rechazado el ${new Date().toLocaleString('es-CL')}: ${rejectionReason}`;
      await updatePaymentStatus('Rechazado', rejectionNotes);

      // 2. Fetch payment data for notification
      const paymentData = await fetchPaymentDataForNotification();

      // 3. Send rejection notification to contractor
      const notificationResult = await sendContractorNotification(paymentData, 'Rechazado', rejectionReason);

      if (notificationResult.success) {
        toast({
          title: "Estado de pago rechazado",
          description: "El estado de pago ha sido rechazado y se ha notificado al contratista.",
        });
      } else {
        toast({
          title: "Estado de pago rechazado",
          description: "El estado de pago ha sido rechazado, pero hubo un problema al enviar la notificación.",
          variant: "destructive"
        });
      }

      // 4. Update UI after a delay to prevent loops
      setTimeout(() => {
        onStatusChange?.();
      }, 2000);
      
      console.log('✅ Rejection process completed successfully');

    } catch (error) {
      console.error('❌ Error in rejection process:', error);
      toast({
        title: "Error al rechazar",
        description: error.message || "Hubo un problema al rechazar el estado de pago.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleApprove,
    handleReject
  };
};
