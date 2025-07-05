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
    
    // Use EXACTLY the same query structure as usePaymentDetail - this is what works correctly
    const { data: paymentData, error: paymentError } = await supabase
      .from('Estados de pago')
      .select(`
        *,
        projectData:Proyectos!Project (
          id,
          Name,
          Location,
          Budget,
          Currency,
          Owner:Mandantes!Owner (
            id,
            CompanyName,
            ContactName,
            ContactEmail,
            ContactPhone
          ),
          Contratista:Contratistas!Contratista (
            id,
            CompanyName,
            ContactName,
            ContactEmail,
            RUT,
            ContactPhone,
            Adress
          )
        )
      `)
      .eq('id', parseInt(paymentId))
      .maybeSingle();

    if (paymentError) {
      console.error('❌ Error fetching payment with project data:', paymentError);
      throw new Error(`Error al obtener datos del pago: ${paymentError.message}`);
    }

    if (!paymentData) {
      console.error('❌ No payment found for ID:', paymentId);
      throw new Error('No se encontró el estado de pago');
    }

    console.log('✅ Payment data with project:', paymentData);
    console.log('📧 Contractor data structure:', {
      hasProjectData: !!paymentData.projectData,
      hasContratista: !!paymentData.projectData?.Contratista,
      contractorEmail: paymentData.projectData?.Contratista?.ContactEmail,
      contractorName: paymentData.projectData?.Contratista?.ContactName,
      contractorCompany: paymentData.projectData?.Contratista?.CompanyName,
      contractorRUT: paymentData.projectData?.Contratista?.RUT,
      contractorPhone: paymentData.projectData?.Contratista?.ContactPhone,
      contractorAddress: paymentData.projectData?.Contratista?.Adress
    });
    console.log('🏢 Mandante data:', paymentData.projectData?.Owner);

    return paymentData;
  };

  const sendContractorNotification = async (paymentData: any, status: 'Aprobado' | 'Rechazado', rejectionReason?: string) => {
    console.log('📤 Starting contractor notification process...', {
      paymentId,
      status,
      rejectionReason,
      hasProjectData: !!paymentData.projectData,
      hasContractor: !!paymentData.projectData?.Contratista
    });

    // Validate contractor email exists
    const contractorEmail = paymentData.projectData?.Contratista?.ContactEmail;
    console.log('📧 Contractor email check:', {
      found: !!contractorEmail,
      email: contractorEmail,
      contractorData: paymentData.projectData?.Contratista
    });

    if (!contractorEmail) {
      console.error('❌ No contractor email found');
      console.log('🔍 Available data structure:', {
        paymentKeys: Object.keys(paymentData),
        projectDataKeys: paymentData.projectData ? Object.keys(paymentData.projectData) : 'No projectData',
        contractorKeys: paymentData.projectData?.Contratista ? Object.keys(paymentData.projectData.Contratista) : 'No Contratista'
      });
      throw new Error('No se encontró email del contratista');
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
      status: status,
      rejectionReason: rejectionReason || '',
      platformUrl: `${window.location.origin}/payment/${paymentId}`,
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
    
    setLoading(true);
    
    try {
      console.log('🟢 Starting approval process for payment:', paymentId);

      // 1. Update payment status
      const approvalNotes = `Aprobado el ${new Date().toLocaleString('es-CL')}`;
      await updatePaymentStatus('Aprobado', approvalNotes);

      // 2. Fetch payment data for notification
      const paymentData = await fetchPaymentDataForNotification();

      // 3. Send notification to contractor
      await sendContractorNotification(paymentData, 'Aprobado');

      toast({
        title: "Estado de pago aprobado",
        description: "El estado de pago ha sido aprobado exitosamente y se ha notificado al contratista.",
      });

      // 4. Update UI after a delay to prevent loops
      setTimeout(() => {
        onStatusChange?.();
      }, 2000);
      
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

    setLoading(true);
    try {
      console.log('🔴 Starting rejection process for payment:', paymentId);

      // 1. Update payment status with rejection notes
      const rejectionNotes = `Rechazado el ${new Date().toLocaleString('es-CL')}: ${rejectionReason}`;
      await updatePaymentStatus('Rechazado', rejectionNotes);

      // 2. Fetch payment data for notification
      const paymentData = await fetchPaymentDataForNotification();

      // 3. Send rejection notification to contractor
      await sendContractorNotification(paymentData, 'Rechazado', rejectionReason);

      toast({
        title: "Estado de pago rechazado",
        description: "El estado de pago ha sido rechazado y se ha notificado al contratista.",
      });

      // 4. Update UI after a delay to prevent loops
      setTimeout(() => {
        onStatusChange?.();
      }, 2000);
      
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
