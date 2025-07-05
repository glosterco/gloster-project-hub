
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';

interface PaymentApprovalHookProps {
  paymentId: string;
  onStatusChange?: () => void;
}

export const usePaymentApproval = ({ paymentId, onStatusChange }: PaymentApprovalHookProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { sendContractorNotification } = useEmailNotifications();

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

  const sendNotificationToContractor = async (paymentData: any, status: 'Aprobado' | 'Rechazado', rejectionReason?: string) => {
    console.log('📤 Preparing to send notification to contractor...', {
      contractorEmail: paymentData.projectData?.Contratista?.ContactEmail,
      status,
      rejectionReason
    });

    if (paymentData.projectData?.Contratista?.ContactEmail) {
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

      console.log(`📤 Sending ${status.toLowerCase()} notification to contractor:`, contractorNotificationData);
      
      const notificationResult = await sendContractorNotification(contractorNotificationData);
      
      if (!notificationResult.success) {
        console.warn('⚠️ Notification failed but continuing:', notificationResult.error);
      } else {
        console.log(`✅ Contractor ${status.toLowerCase()} notification sent successfully`);
      }
    } else {
      console.warn('⚠️ No contractor email found, skipping notification');
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

      // Update payment status
      const approvalNotes = `Aprobado el ${new Date().toLocaleString('es-CL')}`;
      await updatePaymentStatus('Aprobado', approvalNotes);

      // Fetch payment data for notification
      const paymentData = await fetchPaymentDataForNotification();

      // Send notification to contractor
      await sendNotificationToContractor(paymentData, 'Aprobado');

      // Show success message
      toast({
        title: "Estado de pago aprobado",
        description: "El estado de pago ha sido aprobado exitosamente y se ha notificado al contratista.",
      });

      // Update UI after a delay to prevent loops
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
      console.log('📝 Rejection reason:', rejectionReason);

      // Update payment status with rejection notes
      const rejectionNotes = `Rechazado el ${new Date().toLocaleString('es-CL')}: ${rejectionReason}`;
      await updatePaymentStatus('Rechazado', rejectionNotes);

      // Fetch payment data for notification
      const paymentData = await fetchPaymentDataForNotification();

      // Send rejection notification to contractor
      await sendNotificationToContractor(paymentData, 'Rechazado', rejectionReason);

      // Show success message
      toast({
        title: "Estado de pago rechazado",
        description: "El estado de pago ha sido rechazado y se ha notificado al contratista.",
      });

      // Update UI after a delay to prevent loops
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
