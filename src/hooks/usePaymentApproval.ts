import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentApprovalHookProps {
  paymentId: string;
  payment?: any;
  onStatusChange?: () => void;
}

export const usePaymentApproval = ({ paymentId, payment, onStatusChange }: PaymentApprovalHookProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getCurrentUserEmail = (): string | null => {
    const mandanteAccess = sessionStorage.getItem('mandanteAccess');
    if (mandanteAccess) {
      const data = JSON.parse(mandanteAccess);
      return data.email || null;
    }
    return null;
  };

  const getApprovalConfig = async (projectId: number) => {
    console.log('🔍 Fetching approval config for project:', projectId);
    
    const { data: config, error } = await supabase
      .from('project_approval_config')
      .select('id, required_approvals, approval_order_matters')
      .eq('project_id', projectId)
      .single();

    if (error) {
      console.log('⚠️ No approval config found for project', projectId, '- using defaults (1 approval)');
      return { required_approvals: 1, approval_order_matters: false };
    }

    console.log('📋 Found approval config:', config);
    return config;
  };

  const getApprovalCount = async () => {
    const { data, error } = await supabase
      .from('payment_approvals')
      .select('id')
      .eq('payment_id', parseInt(paymentId))
      .eq('approval_status', 'Aprobado');

    if (error) {
      console.error('Error getting approval count:', error);
      return 0;
    }

    return data?.length || 0;
  };

  const recordIndividualApproval = async (
    status: 'Aprobado' | 'Rechazado',
    notes: string
  ): Promise<{ approvalCount: number; requiredApprovals: number }> => {
    console.log('🔴🔴🔴 recordIndividualApproval INICIANDO 🔴🔴🔴');
    
    const userEmail = getCurrentUserEmail();
    console.log('📧 User email from session:', userEmail);
    
    if (!userEmail) {
      console.error('❌❌❌ CRÍTICO: No user email found in session');
      throw new Error('No se pudo determinar el email del usuario. Por favor, vuelve a acceder desde el enlace de email.');
    }

    const mandanteAccess = sessionStorage.getItem('mandanteAccess');
    console.log('📋 mandanteAccess from session:', mandanteAccess);
    
    const userName = mandanteAccess ? JSON.parse(mandanteAccess).name || userEmail : userEmail;
    const normalizedEmail = userEmail.toLowerCase().trim();

    const requestBody = {
      paymentId,
      approverEmail: normalizedEmail,
      approverName: userName,
      status,
      notes: notes || ''
    };

    console.log('📤📤📤 CALLING record-payment-approval edge function:', requestBody);
    console.log('🔗 Function URL: https://mqzuvqwsaeguphqjwvap.supabase.co/functions/v1/record-payment-approval');

    // ALWAYS use the edge function to record approvals
    let result: any;
    let functionError: any;
    
    try {
      console.log('⏳ Invocando supabase.functions.invoke...');
      const response = await supabase.functions.invoke('record-payment-approval', {
        body: requestBody
      });
      
      console.log('📨 Raw response from invoke:', response);
      result = response.data;
      functionError = response.error;
      
      console.log('📨 Parsed response:', { result, functionError });
    } catch (invokeError: any) {
      console.error('❌❌❌ EXCEPTION en invoke:', invokeError);
      console.error('❌ Error type:', typeof invokeError);
      console.error('❌ Error message:', invokeError?.message);
      console.error('❌ Error stack:', invokeError?.stack);
      throw new Error(`Error de conexión con el servidor: ${invokeError.message || 'Unknown error'}`);
    }

    if (functionError) {
      console.error('❌❌❌ functionError presente:', functionError);
      throw new Error(`Error registrando aprobación: ${functionError.message || JSON.stringify(functionError)}`);
    }

    if (!result) {
      console.error('❌❌❌ result es null/undefined');
      throw new Error('El servidor no respondió correctamente. Intente nuevamente.');
    }

    console.log('📋 Result completo:', JSON.stringify(result, null, 2));

    if (!result.success) {
      console.error('❌❌❌ result.success es false:', result.error);
      throw new Error(result.error || 'Error al registrar la aprobación');
    }

    console.log('✅✅✅ Approval recorded successfully via edge function:', {
      approvalCount: result.approvalCount,
      requiredApprovals: result.requiredApprovals,
      isFullyApproved: result.isFullyApproved
    });
    
    return {
      approvalCount: result.approvalCount,
      requiredApprovals: result.requiredApprovals
    };
  };

  const updatePaymentStatus = async (status: 'Aprobado' | 'Rechazado', notes: string): Promise<{ currentApprovals: number; requiredApprovals: number }> => {
    console.log('🔄 ========== STARTING updatePaymentStatus ==========');
    console.log('📋 Input:', { paymentId, status, notes: notes.substring(0, 50) + '...' });
    
    // 1. Get project config first
    const projectId = payment?.projectData?.id || payment?.Project;
    if (!projectId) {
      console.error('❌ Could not determine project ID from payment:', payment);
      throw new Error('No se pudo determinar el proyecto');
    }
    console.log('📋 Project ID:', projectId);

    // 2. Record individual approval via edge function - this returns the counts
    // THIS MUST SUCCEED BEFORE WE UPDATE THE PAYMENT STATUS
    console.log('📝 Step 2: Calling recordIndividualApproval...');
    const { approvalCount, requiredApprovals } = await recordIndividualApproval(status, notes);

    console.log('📊 ========== MULTI-APPROVER CHECK ==========');
    console.log('📊 approvalCount:', approvalCount);
    console.log('📊 requiredApprovals:', requiredApprovals);
    console.log('📊 isFullyApproved:', approvalCount >= requiredApprovals);
    console.log('📊 ==========================================');

    // 3. If rejection, update payment status immediately
    if (status === 'Rechazado') {
      console.log('❌ Recording rejection - setting status to Rechazado');
      await updatePaymentRecord('Rechazado', notes, 0, requiredApprovals);
      return { currentApprovals: 0, requiredApprovals };
    }

    // 4. CRITICAL MULTI-APPROVER LOGIC - Only approve if ALL approvals are received
    let finalStatus: string;
    let finalNotes: string;
    
    if (approvalCount >= requiredApprovals) {
      // All approvals received - mark as fully approved
      finalStatus = 'Aprobado';
      finalNotes = notes;
      console.log('✅ ALL APPROVALS RECEIVED - Setting status to Aprobado');
    } else {
      // Partial approval - keep as "En Revisión" - NOT fully approved yet
      finalStatus = 'En Revisión';
      finalNotes = `${approvalCount}/${requiredApprovals} aprobaciones completadas. Esperando ${requiredApprovals - approvalCount} aprobación(es) adicional(es).`;
      console.log(`⏳ PARTIAL APPROVAL - ${approvalCount}/${requiredApprovals} - Setting status to En Revisión`);
    }
    
    console.log('📝 Step 4: Updating payment record with:', { finalStatus, approvalCount, requiredApprovals });
    await updatePaymentRecord(finalStatus, finalNotes, approvalCount, requiredApprovals);
    
    console.log('🔄 ========== updatePaymentStatus COMPLETE ==========');
    return { currentApprovals: approvalCount, requiredApprovals };
  };

  const updatePaymentRecord = async (
    status: string,
    notes: string,
    approvalProgress: number,
    totalRequired: number
  ) => {
    const mandanteAccess = sessionStorage.getItem('mandanteAccess');
    let useServiceFunction = false;
    let mandanteEmail = '';
    
    if (mandanteAccess) {
      const accessData = JSON.parse(mandanteAccess);
      if (accessData.userType === 'mandante' && (accessData.isLimitedAccess || !accessData.hasFullAccess)) {
        useServiceFunction = true;
        mandanteEmail = accessData.email;
      }
    }

    if (useServiceFunction) {
      const { data: result, error: functionError } = await supabase.functions.invoke(
        'update-payment-status-mandante',
        {
          body: {
            paymentId,
            status,
            notes,
            mandanteEmail,
            approvalProgress,
            totalRequired
          }
        }
      );

      if (functionError || !result?.success) {
        throw new Error(`Error al actualizar: ${functionError?.message || result?.error}`);
      }
    } else {
      const { error } = await supabase
        .from('Estados de pago')
        .update({ 
          Status: status,
          Notes: notes || null,
          approval_progress: approvalProgress,
          total_approvals_required: totalRequired
        })
        .eq('id', parseInt(paymentId));

      if (error) {
        throw new Error(`Error al actualizar: ${error.message}`);
      }
    }
  };

  const sendContractorNotification = async (paymentData: any, status: 'Aprobado' | 'Rechazado', rejectionReason?: string) => {
    const contractorEmail = paymentData.projectData?.Contratista?.ContactEmail;

    if (!contractorEmail) {
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
      currency: paymentData.projectData.Currency || 'CLP',
      status: status,
      rejectionReason: rejectionReason || '',
      platformUrl: `https://gloster-project-hub.lovable.app/contractor-access/${paymentId}`,
    };
    
    const { data: result, error } = await supabase.functions.invoke('send-contractor-notification', {
      body: contractorNotificationData,
    });

    if (error || !result?.success) {
      throw new Error(result?.error || 'La función de notificación no fue exitosa');
    }

    return { success: true, messageId: result.messageId };
  };

  const handleApprove = async () => {
    console.log('🚀🚀🚀 handleApprove INICIANDO 🚀🚀🚀');
    console.log('📋 Estado inicial:', { 
      loading, 
      hasPayment: !!payment,
      hasProjectData: !!payment?.projectData, 
      paymentId,
      userEmail: getCurrentUserEmail()
    });
    
    if (loading) {
      console.log('⚠️ Already loading, returning early');
      return;
    }
    
    if (!payment) {
      console.error('❌❌❌ CRÍTICO: payment es null/undefined');
      toast({
        title: "Error",
        description: "No se encontró el estado de pago. Recarga la página.",
        variant: "destructive"
      });
      return;
    }
    
    if (!payment.projectData) {
      console.error('❌❌❌ CRÍTICO: payment.projectData es null/undefined');
      console.error('❌ Payment object:', JSON.stringify(payment, null, 2));
      toast({
        title: "Error",
        description: "No se encontraron los datos del proyecto. Recarga la página.",
        variant: "destructive"
      });
      return;
    }
    
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
      console.error('❌❌❌ CRÍTICO: No se encontró email del usuario en sesión');
      toast({
        title: "Error",
        description: "No se pudo identificar tu email. Vuelve a acceder desde el enlace de email.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('✅ Validaciones pasadas, iniciando proceso de aprobación');
    setLoading(true);
    
    try {
      const approvalNotes = `Aprobado el ${new Date().toLocaleString('es-CL')} por ${userEmail}`;
      console.log('📝 Calling updatePaymentStatus with notes:', approvalNotes);
      
      const { currentApprovals, requiredApprovals } = await updatePaymentStatus('Aprobado', approvalNotes);

      console.log('📊 updatePaymentStatus completado:', { currentApprovals, requiredApprovals });

      if (currentApprovals >= requiredApprovals) {
        console.log('📤 Todas las aprobaciones recibidas, enviando notificación al contratista...');
        await sendContractorNotification(payment, 'Aprobado');
        toast({
          title: "Estado de pago aprobado",
          description: "El estado de pago ha sido aprobado completamente y se ha notificado al contratista.",
        });
      } else {
        toast({
          title: "Aprobación registrada",
          description: `Tu aprobación ha sido registrada. ${currentApprovals}/${requiredApprovals} aprobaciones completadas.`,
        });
      }

      console.log('🔄 Llamando onStatusChange...');
      onStatusChange?.();
      console.log('✅✅✅ handleApprove COMPLETADO ✅✅✅');

    } catch (error: any) {
      console.error('❌❌❌ ERROR en handleApprove:', error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error stack:', error?.stack);
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
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo requerido",
        description: "Por favor ingrese el motivo del rechazo.",
        variant: "destructive"
      });
      return;
    }

    if (loading || !payment?.projectData) {
      if (!payment?.projectData) {
        toast({
          title: "Error",
          description: "No se pueden cargar los datos del estado de pago",
          variant: "destructive"
        });
      }
      return;
    }

    setLoading(true);
    try {
      const rejectionNotes = `Rechazado el ${new Date().toLocaleString('es-CL')} por ${getCurrentUserEmail()}: ${rejectionReason}`;
      await updatePaymentStatus('Rechazado', rejectionNotes);

      await sendContractorNotification(payment, 'Rechazado', rejectionReason);

      toast({
        title: "Estado de pago rechazado",
        description: "El estado de pago ha sido rechazado y se ha notificado al contratista.",
      });

      onStatusChange?.();

    } catch (error: any) {
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

