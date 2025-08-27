
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentApprovalHookProps {
  paymentId: string;
  payment?: any; // Recibir payment data directamente en lugar de hacer query separada
  onStatusChange?: () => void;
}

export const usePaymentApproval = ({ paymentId, payment, onStatusChange }: PaymentApprovalHookProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updatePaymentStatus = async (status: 'Aprobado' | 'Rechazado', notes: string) => {
    try {
      setLoading(true);
      
      // Set session context for RLS if we have mandante access
      const mandanteAccess = sessionStorage.getItem('mandanteAccess');
      if (mandanteAccess) {
        const accessInfo = JSON.parse(mandanteAccess);
        if (accessInfo.email) {
          // Set the email context for RLS policy verification
          await supabase.rpc('set_config', {
            setting_name: 'custom.email_access',
            setting_value: accessInfo.email,
            is_local: true
          });
        }
      }

      // Update payment status
      const { error } = await supabase
        .from('Estados de pago')
        .update({ 
          Status: status,
          Notes: notes || null
        })
        .eq('id', parseInt(paymentId));

      if (error) {
        console.error('Error updating payment status:', error);
        throw new Error(`Error al actualizar el estado del pago: ${error.message}`);
      }

      console.log(`✅ Payment status updated to ${status}`);
    } finally {
      setLoading(false);
    }
  };

  const sendContractorNotification = async (paymentData: any, status: 'Aprobado' | 'Rechazado', rejectionReason?: string) => {
    console.log('📤 Starting contractor notification process...', {
      paymentId,
      status,
      rejectionReason,
      hasProjectData: !!paymentData.projectData,
      hasContractor: !!paymentData.projectData?.Contratista
    });

    // Validar que existe el email del contratista usando los datos ya disponibles
    const contractorEmail = paymentData.projectData?.Contratista?.ContactEmail;
    console.log('📧 Contractor email validation:', {
      found: !!contractorEmail,
      email: contractorEmail,
      contractorData: paymentData.projectData?.Contratista
    });

    if (!contractorEmail) {
      console.error('❌ No contractor email found in provided payment data');
      console.log('🔍 Available contractor data:', paymentData.projectData?.Contratista);
      throw new Error('No se encontró email del contratista en los datos del pago');
    }

    const contractorNotificationData = {
      paymentId: paymentId,
      contractorEmail: contractorEmail,
      contractorName: paymentData.projectData.Contratista.ContactName || 'Contratista',
      contractorCompany: paymentData.projectData.Contratista.CompanyName || '',
      mandanteCompany: paymentData.projectData.Owner?.CompanyName || '',
      proyecto: paymentData.projectData.Name || '',
      mes: paymentData.Mes || '',
      año: paymentData.Año || new Date().getFullYear(),
      amount: paymentData.Total || 0,
      currency: paymentData.projectData.Currency || 'CLP',
      status: status,
      rejectionReason: rejectionReason || '',
      platformUrl: `${window.location.origin}/contractor-access/${paymentId}`,
    };

    console.log('📤 Invoking send-contractor-notification with data:', contractorNotificationData);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('send-contractor-notification', {
        body: contractorNotificationData,
      });

      console.log('📡 Edge function response:', { result, error });

      if (error) {
        console.error('❌ Error calling send-contractor-notification:', error);
        throw new Error(`Error en edge function: ${error.message}`);
      }

      if (!result || !result.success) {
        console.error('❌ Edge function returned unsuccessful result:', result);
        throw new Error(result?.error || 'La función de notificación no fue exitosa');
      }

      console.log('✅ Contractor notification sent successfully:', result);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error in sendContractorNotification:', error);
      throw error;
    }
  };

  const handleApprove = async () => {
    console.log('🟢 handleApprove called with paymentId:', paymentId);
    
    if (loading) {
      console.log('⏳ Already processing, skipping...');
      return;
    }

    if (!payment || !payment.projectData) {
      console.error('❌ No payment data available for approval');
      toast({
        title: "Error",
        description: "No se pueden cargar los datos del estado de pago",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🟢 Starting approval process for payment:', paymentId);
      console.log('🟢 Using payment data:', payment.projectData?.Contratista);

      // 1. Update payment status
      const approvalNotes = `Aprobado el ${new Date().toLocaleString('es-CL')}`;
      await updatePaymentStatus('Aprobado', approvalNotes);

      // 2. Send notification using existing payment data (no additional query needed)
      await sendContractorNotification(payment, 'Aprobado');

      toast({
        title: "Estado de pago aprobado",
        description: "El estado de pago ha sido aprobado exitosamente y se ha notificado al contratista.",
      });

      // 3. Update UI immediately
      onStatusChange?.();
      
      console.log('✅ Approval process completed successfully');

    } catch (error) {
      console.error('❌ Error in approval process:', error);
      toast({
        title: "Error en el proceso",
        description: error.message || "Hubo un problema en el proceso de aprobación.",
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

    if (!payment || !payment.projectData) {
      console.error('❌ No payment data available for rejection');
      toast({
        title: "Error",
        description: "No se pueden cargar los datos del estado de pago",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔴 Starting rejection process for payment:', paymentId);

      // 1. Update payment status with rejection notes
      const rejectionNotes = `Rechazado el ${new Date().toLocaleString('es-CL')}: ${rejectionReason}`;
      await updatePaymentStatus('Rechazado', rejectionNotes);

      // 2. Send rejection notification using existing payment data
      await sendContractorNotification(payment, 'Rechazado', rejectionReason);

      toast({
        title: "Estado de pago rechazado",
        description: "El estado de pago ha sido rechazado y se ha notificado al contratista.",
      });

      // 3. Update UI immediately
      onStatusChange?.();
      
      console.log('✅ Rejection process completed successfully');

    } catch (error) {
      console.error('❌ Error in rejection process:', error);
      toast({
        title: "Error en el proceso",
        description: error.message || "Hubo un problema en el proceso de rechazo.",
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
