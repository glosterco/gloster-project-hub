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

  /**
   * CRITICAL FUNCTION: Records individual approval via edge function
   * This MUST succeed before the payment status can be updated
   */
  /**
   * CRITICAL FUNCTION: Records individual approval via edge function
   * Returns approval counts from the edge function
   */
  const recordIndividualApproval = async (
    status: 'Aprobado' | 'Rechazado',
    notes: string
  ): Promise<{ approvalCount: number; requiredApprovals: number }> => {
    console.log('══════════════════════════════════════════════════════');
    console.log('🔵 recordIndividualApproval INICIANDO');
    console.log('══════════════════════════════════════════════════════');
    
    // Get user email - CRITICAL
    const userEmail = getCurrentUserEmail();
    console.log('📧 Email del usuario:', userEmail);
    
    if (!userEmail) {
      console.error('❌ NO HAY EMAIL EN SESIÓN');
      // Return defaults instead of throwing - let backend handle validation
      return { approvalCount: 0, requiredApprovals: 1 };
    }

    const mandanteAccess = sessionStorage.getItem('mandanteAccess');
    const parsedAccess = mandanteAccess ? JSON.parse(mandanteAccess) : {};
    const userName = parsedAccess.name || userEmail;

    const requestBody = {
      paymentId,
      approverEmail: userEmail.toLowerCase().trim(),
      approverName: userName,
      status,
      notes: notes || ''
    };

    console.log('📤 Llamando record-payment-approval con:', requestBody);

    try {
      const response = await supabase.functions.invoke('record-payment-approval', {
        body: requestBody
      });
      
      console.log('📨 Respuesta de record-payment-approval:', response);

      if (response.error) {
        console.error('❌ Error en response:', response.error);
        // Don't throw - return defaults, backend will validate
        return { approvalCount: 0, requiredApprovals: 1 };
      }

      const result = response.data;
      if (!result?.success) {
        console.error('❌ result.success = false:', result?.error);
        return { approvalCount: 0, requiredApprovals: 1 };
      }

      console.log('✅ Aprobación registrada exitosamente');
      console.log('📊 Conteo:', result.approvalCount, '/', result.requiredApprovals);
      
      return {
        approvalCount: result.approvalCount || 0,
        requiredApprovals: result.requiredApprovals || 1
      };
    } catch (error: any) {
      console.error('❌ Exception en invoke:', error?.message);
      // Don't throw - return defaults, backend will validate
      return { approvalCount: 0, requiredApprovals: 1 };
    }
  };

  /**
   * MAIN APPROVAL LOGIC: Updates payment status based on approval count
   * CRITICAL: This must WAIT for recordIndividualApproval to complete
   */
  const updatePaymentStatus = async (status: 'Aprobado' | 'Rechazado', notes: string): Promise<{ currentApprovals: number; requiredApprovals: number }> => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔄 updatePaymentStatus STARTING');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Input:', { paymentId, status, notes: notes.substring(0, 50) + '...' });
    
    // 1. Get project ID
    const projectId = payment?.projectData?.id || payment?.Project;
    if (!projectId) {
      console.error('❌ FATAL: Could not determine project ID');
      console.error('❌ payment object:', JSON.stringify(payment, null, 2));
      throw new Error('No se pudo determinar el proyecto');
    }
    console.log('📋 Project ID:', projectId);

    // 2. CRITICAL: Record individual approval FIRST via edge function
    // This MUST complete successfully before we determine the final status
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📝 CALLING recordIndividualApproval - AWAITING RESULT...');
    console.log('═══════════════════════════════════════════════════════════');
    
    let approvalResult: { approvalCount: number; requiredApprovals: number };
    
    try {
      approvalResult = await recordIndividualApproval(status, notes);
      console.log('✅ recordIndividualApproval COMPLETED SUCCESSFULLY');
      console.log('✅ approvalResult:', approvalResult);
    } catch (approvalError: any) {
      console.error('❌ recordIndividualApproval FAILED');
      console.error('❌ Error:', approvalError?.message);
      // RE-THROW the error - DO NOT continue with approval
      throw approvalError;
    }

    const { approvalCount, requiredApprovals } = approvalResult;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 MULTI-APPROVER DECISION POINT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 approvalCount:', approvalCount);
    console.log('📊 requiredApprovals:', requiredApprovals);
    console.log('📊 Comparison: approvalCount >= requiredApprovals ?', approvalCount >= requiredApprovals);

    // 3. If rejection, update payment status immediately
    if (status === 'Rechazado') {
      console.log('❌ Recording rejection - setting status to Rechazado');
      await updatePaymentRecord('Rechazado', notes, 0, requiredApprovals);
      return { currentApprovals: 0, requiredApprovals };
    }

    // 4. CRITICAL MULTI-APPROVER LOGIC
    // Only set status to "Aprobado" if ALL required approvals are received
    let finalStatus: string;
    let finalNotes: string;
    
    if (approvalCount >= requiredApprovals) {
      finalStatus = 'Aprobado';
      finalNotes = notes;
      console.log('✅ DECISION: ALL APPROVALS RECEIVED → Status = Aprobado');
    } else {
      finalStatus = 'En Revisión';
      finalNotes = `${approvalCount}/${requiredApprovals} aprobaciones completadas. Esperando ${requiredApprovals - approvalCount} aprobación(es) adicional(es).`;
      console.log(`⏳ DECISION: PARTIAL APPROVAL (${approvalCount}/${requiredApprovals}) → Status = En Revisión`);
    }
    
    console.log('📝 Calling updatePaymentRecord with:', { finalStatus, approvalCount, requiredApprovals });
    await updatePaymentRecord(finalStatus, finalNotes, approvalCount, requiredApprovals);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔄 updatePaymentStatus COMPLETED');
    console.log('═══════════════════════════════════════════════════════════');
    
    return { currentApprovals: approvalCount, requiredApprovals };
  };

  /**
   * Updates the payment record in the database
   */
  const updatePaymentRecord = async (
    status: string,
    notes: string,
    approvalProgress: number,
    totalRequired: number
  ) => {
    console.log('📝 updatePaymentRecord called with:', { status, notes: notes.substring(0, 50), approvalProgress, totalRequired });
    
    const mandanteAccess = sessionStorage.getItem('mandanteAccess');
    let useServiceFunction = false;
    let mandanteEmail = '';
    
    if (mandanteAccess) {
      const accessData = JSON.parse(mandanteAccess);
      console.log('📋 accessData:', { 
        userType: accessData.userType, 
        isLimitedAccess: accessData.isLimitedAccess, 
        hasFullAccess: accessData.hasFullAccess 
      });
      
      if (accessData.userType === 'mandante' && (accessData.isLimitedAccess || !accessData.hasFullAccess)) {
        useServiceFunction = true;
        mandanteEmail = accessData.email;
      }
    }

    console.log('📋 useServiceFunction:', useServiceFunction);

    if (useServiceFunction) {
      console.log('📤 Calling update-payment-status-mandante edge function');
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

      console.log('📨 update-payment-status-mandante response:', { result, functionError });

      if (functionError || !result?.success) {
        console.error('❌ update-payment-status-mandante failed');
        throw new Error(`Error al actualizar: ${functionError?.message || result?.error}`);
      }
      
      console.log('✅ update-payment-status-mandante succeeded');
    } else {
      console.log('📤 Updating directly via Supabase client');
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
        console.error('❌ Direct update failed:', error);
        throw new Error(`Error al actualizar: ${error.message}`);
      }
      
      console.log('✅ Direct update succeeded');
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
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 handleApprove STARTING');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Initial state:', { 
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
      console.error('❌ FATAL: payment is null/undefined');
      toast({
        title: "Error",
        description: "No se encontró el estado de pago. Recarga la página.",
        variant: "destructive"
      });
      return;
    }
    
    if (!payment.projectData) {
      console.error('❌ FATAL: payment.projectData is null/undefined');
      console.error('❌ payment object:', JSON.stringify(payment, null, 2));
      toast({
        title: "Error",
        description: "No se encontraron los datos del proyecto. Recarga la página.",
        variant: "destructive"
      });
      return;
    }
    
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
      console.error('❌ FATAL: No user email in session');
      toast({
        title: "Error",
        description: "No se pudo identificar tu email. Vuelve a acceder desde el enlace de email.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('✅ All validations passed, starting approval process');
    setLoading(true);
    
    try {
      const approvalNotes = `Aprobado el ${new Date().toLocaleString('es-CL')} por ${userEmail}`;
      console.log('📝 Calling updatePaymentStatus...');
      
      const { currentApprovals, requiredApprovals } = await updatePaymentStatus('Aprobado', approvalNotes);

      console.log('📊 updatePaymentStatus completed:', { currentApprovals, requiredApprovals });

      if (currentApprovals >= requiredApprovals) {
        console.log('📤 All approvals received, sending contractor notification...');
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

      console.log('🔄 Calling onStatusChange...');
      onStatusChange?.();
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ handleApprove COMPLETED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════════');

    } catch (error: any) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ handleApprove FAILED');
      console.error('═══════════════════════════════════════════════════════════');
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
