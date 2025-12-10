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
  ): Promise<number> => {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) {
      console.error('❌ No user email found in session');
      throw new Error('No se pudo determinar el email del usuario. Por favor, vuelve a acceder desde el enlace de email.');
    }

    const mandanteAccess = sessionStorage.getItem('mandanteAccess');
    const userName = mandanteAccess ? JSON.parse(mandanteAccess).name || userEmail : userEmail;
    const normalizedEmail = userEmail.toLowerCase().trim();

    console.log('📝 Recording individual approval:', { 
      paymentId, 
      status, 
      email: normalizedEmail,
      userName 
    });

    // First check if this user already has an approval for this payment
    const { data: existing, error: existingError } = await supabase
      .from('payment_approvals')
      .select('id, approval_status')
      .eq('payment_id', parseInt(paymentId))
      .eq('approver_email', normalizedEmail)
      .maybeSingle();

    if (existingError) {
      console.error('❌ Error checking existing approval:', existingError);
      throw new Error(`Error verificando aprobación existente: ${existingError.message}`);
    }

    if (existing) {
      // Update existing approval
      console.log('📝 Updating existing approval record:', existing.id);
      const { error: updateError } = await supabase
        .from('payment_approvals')
        .update({
          approval_status: status,
          approver_name: userName,
          notes: notes || null,
          approved_at: status === 'Aprobado' ? new Date().toISOString() : null
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('❌ Error updating approval:', updateError);
        throw new Error(`Error actualizando aprobación: ${updateError.message}`);
      }
      console.log(`✅ Updated existing approval to ${status} for ${normalizedEmail}`);
    } else {
      // Insert new approval record
      console.log('📝 Inserting new approval record');
      const { data: insertedData, error: insertError } = await supabase
        .from('payment_approvals')
        .insert({
          payment_id: parseInt(paymentId),
          approver_email: normalizedEmail,
          approver_name: userName,
          approval_status: status,
          notes: notes || null,
          approved_at: status === 'Aprobado' ? new Date().toISOString() : null
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Error inserting approval:', insertError);
        throw new Error(`Error insertando aprobación: ${insertError.message}`);
      }
      console.log(`✅ Inserted new approval with id ${insertedData?.id} - ${status} for ${normalizedEmail}`);
    }

    // Get current approval count AFTER the insert/update - critical for multi-approver logic
    const { data: approvals, error: countError } = await supabase
      .from('payment_approvals')
      .select('id, approver_email, approval_status')
      .eq('payment_id', parseInt(paymentId))
      .eq('approval_status', 'Aprobado');

    if (countError) {
      console.error('❌ Error counting approvals:', countError);
      throw new Error(`Error contando aprobaciones: ${countError.message}`);
    }

    const count = approvals?.length || 0;
    console.log(`📊 Current APPROVED count after recording: ${count}`, approvals);
    return count;
  };

  const updatePaymentStatus = async (status: 'Aprobado' | 'Rechazado', notes: string): Promise<{ currentApprovals: number; requiredApprovals: number }> => {
    console.log('🔄 Starting updatePaymentStatus with:', { paymentId, status, notes });
    
    // 1. Get project config first
    const projectId = payment?.projectData?.id || payment?.Project;
    if (!projectId) {
      console.error('❌ Could not determine project ID from payment:', payment);
      throw new Error('No se pudo determinar el proyecto');
    }

    const config = await getApprovalConfig(projectId);
    const requiredApprovals = config.required_approvals || 1;
    
    console.log('📋 Approval config for project', projectId, ':', { 
      requiredApprovals, 
      orderMatters: config.approval_order_matters 
    });

    // 2. Record individual approval and get current count
    const currentApprovals = await recordIndividualApproval(status, notes);

    console.log('📊 CRITICAL CHECK - Approval progress:', { 
      currentApprovals, 
      requiredApprovals,
      isFullyApproved: currentApprovals >= requiredApprovals,
      status
    });

    // 3. If rejection, update payment status immediately
    if (status === 'Rechazado') {
      console.log('❌ Recording rejection - setting status to Rechazado');
      await updatePaymentRecord('Rechazado', notes, 0, requiredApprovals);
      return { currentApprovals: 0, requiredApprovals };
    }

    // 4. Update payment based on progress - THIS IS THE CRITICAL MULTI-APPROVER LOGIC
    if (currentApprovals >= requiredApprovals) {
      // All approvals received - mark as fully approved
      console.log('✅ ALL APPROVALS RECEIVED - Marking as Aprobado');
      await updatePaymentRecord('Aprobado', notes, currentApprovals, requiredApprovals);
    } else {
      // Partial approval - keep as "En Revisión" - NOT fully approved yet
      console.log(`⏳ PARTIAL APPROVAL - ${currentApprovals}/${requiredApprovals} - Keeping as En Revisión`);
      const progressNotes = `${currentApprovals}/${requiredApprovals} aprobaciones completadas. Esperando ${requiredApprovals - currentApprovals} aprobación(es) adicional(es).`;
      await updatePaymentRecord('En Revisión', progressNotes, currentApprovals, requiredApprovals);
    }

    return { currentApprovals, requiredApprovals };
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

