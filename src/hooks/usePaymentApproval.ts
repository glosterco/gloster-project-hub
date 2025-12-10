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
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
      console.error('❌ No user email found in session');
      throw new Error('No se pudo determinar el email del usuario. Por favor, vuelve a acceder desde el enlace de email.');
    }

    const mandanteAccess = sessionStorage.getItem('mandanteAccess');
    const userName = mandanteAccess ? JSON.parse(mandanteAccess).name || userEmail : userEmail;
    const normalizedEmail = userEmail.toLowerCase().trim();

    console.log('📝 Recording individual approval via edge function:', { 
      paymentId, 
      status, 
      email: normalizedEmail,
      userName 
    });

    // ALWAYS use the edge function to record approvals
    // This ensures the approval is recorded using service role (bypasses RLS issues)
    const { data: result, error: functionError } = await supabase.functions.invoke(
      'record-payment-approval',
      {
        body: {
          paymentId,
          approverEmail: normalizedEmail,
          approverName: userName,
          status,
          notes: notes || ''
        }
      }
    );

    if (functionError) {
      console.error('❌ Error calling record-payment-approval:', functionError);
      throw new Error(`Error registrando aprobación: ${functionError.message}`);
    }

    if (!result?.success) {
      console.error('❌ record-payment-approval failed:', result?.error);
      throw new Error(result?.error || 'Error al registrar la aprobación');
    }

    console.log('✅ Approval recorded via edge function:', result);
    
    return {
      approvalCount: result.approvalCount || 0,
      requiredApprovals: result.requiredApprovals || 1
    };
  };

  const updatePaymentStatus = async (status: 'Aprobado' | 'Rechazado', notes: string): Promise<{ currentApprovals: number; requiredApprovals: number }> => {
    console.log('🔄 Starting updatePaymentStatus with:', { paymentId, status, notes });
    
    // 1. Get project config first
    const projectId = payment?.projectData?.id || payment?.Project;
    if (!projectId) {
      console.error('❌ Could not determine project ID from payment:', payment);
      throw new Error('No se pudo determinar el proyecto');
    }

    // 2. Record individual approval via edge function - this returns the counts
    const { approvalCount, requiredApprovals } = await recordIndividualApproval(status, notes);

    console.log('📊 CRITICAL CHECK - Approval progress:', { 
      currentApprovals: approvalCount, 
      requiredApprovals,
      isFullyApproved: approvalCount >= requiredApprovals,
      status
    });

    // 3. If rejection, update payment status immediately
    if (status === 'Rechazado') {
      console.log('❌ Recording rejection - setting status to Rechazado');
      await updatePaymentRecord('Rechazado', notes, 0, requiredApprovals);
      return { currentApprovals: 0, requiredApprovals };
    }

    // 4. Update payment based on progress - THIS IS THE CRITICAL MULTI-APPROVER LOGIC
    if (approvalCount >= requiredApprovals) {
      // All approvals received - mark as fully approved
      console.log('✅ ALL APPROVALS RECEIVED - Marking as Aprobado');
      await updatePaymentRecord('Aprobado', notes, approvalCount, requiredApprovals);
    } else {
      // Partial approval - keep as "En Revisión" - NOT fully approved yet
      console.log(`⏳ PARTIAL APPROVAL - ${approvalCount}/${requiredApprovals} - Keeping as En Revisión`);
      const progressNotes = `${approvalCount}/${requiredApprovals} aprobaciones completadas. Esperando ${requiredApprovals - approvalCount} aprobación(es) adicional(es).`;
      await updatePaymentRecord('En Revisión', progressNotes, approvalCount, requiredApprovals);
    }

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
      const approvalNotes = `Aprobado el ${new Date().toLocaleString('es-CL')} por ${getCurrentUserEmail()}`;
      const { currentApprovals, requiredApprovals } = await updatePaymentStatus('Aprobado', approvalNotes);

      console.log('📊 Final approval result:', { currentApprovals, requiredApprovals });

      if (currentApprovals >= requiredApprovals) {
        // Fully approved - send notification to contractor
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

      onStatusChange?.();

    } catch (error: any) {
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

