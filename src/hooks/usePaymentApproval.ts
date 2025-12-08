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
    const { data: config, error } = await supabase
      .from('project_approval_config')
      .select('id, required_approvals, approval_order_matters')
      .eq('project_id', projectId)
      .single();

    if (error) {
      console.log('No approval config found, using defaults');
      return { required_approvals: 1, approval_order_matters: false };
    }

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
  ) => {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
      throw new Error('No se pudo determinar el email del usuario');
    }

    const mandanteAccess = sessionStorage.getItem('mandanteAccess');
    const userName = mandanteAccess ? JSON.parse(mandanteAccess).name || userEmail : userEmail;

    // Upsert: update if exists, insert if not
    const { error } = await supabase
      .from('payment_approvals')
      .upsert({
        payment_id: parseInt(paymentId),
        approver_email: userEmail.toLowerCase().trim(),
        approver_name: userName,
        approval_status: status,
        notes: notes || null,
        approved_at: status === 'Aprobado' ? new Date().toISOString() : null
      }, {
        onConflict: 'payment_id,approver_email'
      });

    if (error) {
      console.error('Error recording individual approval:', error);
      throw error;
    }

    console.log(`✅ Individual ${status} recorded for ${userEmail}`);
  };

  const updatePaymentStatus = async (status: 'Aprobado' | 'Rechazado', notes: string) => {
    console.log('🔄 Starting updatePaymentStatus with:', { paymentId, status, notes });
    
    const mandanteAccess = sessionStorage.getItem('mandanteAccess');
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('🔍 DEBUGGING APPROVAL CONTEXT:', {
      paymentId,
      status,
      hasMandanteAccess: !!mandanteAccess,
      timestamp: new Date().toISOString()
    });
    
    try {
      setLoading(true);
      
      // 1. Record individual approval first
      await recordIndividualApproval(status, notes);

      // 2. If rejection, update payment status immediately
      if (status === 'Rechazado') {
        await updatePaymentRecord('Rechazado', notes, 0, 0);
        return;
      }

      // 3. For approvals, check if we have enough
      const projectId = payment?.projectData?.id || payment?.Project;
      if (!projectId) {
        throw new Error('No se pudo determinar el proyecto');
      }

      const config = await getApprovalConfig(projectId);
      const currentApprovals = await getApprovalCount();
      
      console.log('📊 Approval progress:', {
        currentApprovals,
        requiredApprovals: config.required_approvals
      });

      // 4. Update payment with progress
      if (currentApprovals >= config.required_approvals) {
        // All approvals received - mark as fully approved
        await updatePaymentRecord('Aprobado', notes, currentApprovals, config.required_approvals);
      } else {
        // Partial approval - keep as "En Revisión" or similar
        await updatePaymentRecord('En Revisión', `${currentApprovals}/${config.required_approvals} aprobaciones`, currentApprovals, config.required_approvals);
      }

    } finally {
      setLoading(false);
    }
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
      await updatePaymentStatus('Aprobado', approvalNotes);

      // Re-fetch approval count after recording to get accurate numbers
      const projectId = payment?.projectData?.id;
      const config = await getApprovalConfig(projectId);
      const currentApprovals = await getApprovalCount();
      
      console.log('📊 Final approval check:', { currentApprovals, required: config.required_approvals });

      if (currentApprovals >= config.required_approvals) {
        // Fully approved - send notification to contractor
        await sendContractorNotification(payment, 'Aprobado');
        toast({
          title: "Estado de pago aprobado",
          description: "El estado de pago ha sido aprobado completamente y se ha notificado al contratista.",
        });
      } else {
        toast({
          title: "Aprobación registrada",
          description: `Tu aprobación ha sido registrada. ${currentApprovals}/${config.required_approvals} aprobaciones completadas.`,
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

