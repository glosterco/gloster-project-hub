import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentApproval {
  id: string;
  payment_id: number;
  approver_email: string;
  approver_name: string | null;
  approval_status: 'Aprobado' | 'Rechazado' | 'Pendiente';
  notes: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface ApprovalStatus {
  approvals: PaymentApproval[];
  totalRequired: number;
  totalApproved: number;
  totalRejected: number;
  totalPending: number;
  isFullyApproved: boolean;
  hasRejection: boolean;
  currentUserApproval: PaymentApproval | null;
  canUserApprove: boolean;
  pendingApprovers: { email: string; name: string | null; order: number }[];
}

export const usePaymentApprovalStatus = (paymentId: number | null, currentUserEmail?: string) => {
  const [status, setStatus] = useState<ApprovalStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchApprovalStatus = async () => {
    if (!paymentId) return;

    console.log('🔄 fetchApprovalStatus called for paymentId:', paymentId);
    setLoading(true);
    setError(null);

    try {
      // 1. Get payment to find project
      const { data: payment, error: paymentError } = await supabase
        .from('Estados de pago')
        .select('Project, approval_progress, total_approvals_required')
        .eq('id', paymentId)
        .single();

      if (paymentError) throw paymentError;

      // 2. Get approval config for the project
      const { data: config, error: configError } = await supabase
        .from('project_approval_config')
        .select('id, required_approvals, approval_order_matters')
        .eq('project_id', payment.Project)
        .single();

      if (configError && configError.code !== 'PGRST116') throw configError;

      const totalRequired = config?.required_approvals || 1;

      // 3. Get all approvers for the project
      const { data: approvers, error: approversError } = await supabase
        .from('project_approvers')
        .select('approver_email, approver_name, approval_order')
        .eq('config_id', config?.id || '')
        .order('approval_order', { ascending: true });

      if (approversError && approversError.code !== 'PGRST116') throw approversError;

      // 4. Get existing approvals for this payment
      const { data: approvals, error: approvalsError } = await supabase
        .from('payment_approvals')
        .select('*')
        .eq('payment_id', paymentId);

      if (approvalsError) throw approvalsError;

      // 5. Check if current user is the mandante of the project
      let isMandanteOfProject = false;
      if (currentUserEmail) {
        const { data: mandanteCheck } = await supabase
          .rpc('verify_mandante_email_access', {
            payment_id: paymentId,
            email: currentUserEmail
          });
        isMandanteOfProject = mandanteCheck === true;
        console.log('🔍 Is mandante of project:', isMandanteOfProject, 'for email:', currentUserEmail);
      }

      const typedApprovals = (approvals || []) as PaymentApproval[];
      console.log('📊 Fetched approvals:', typedApprovals.length, typedApprovals);

      const totalApproved = typedApprovals.filter(a => a.approval_status === 'Aprobado').length;
      const totalRejected = typedApprovals.filter(a => a.approval_status === 'Rechazado').length;
      const totalPending = totalRequired - totalApproved;
      
      console.log('📈 Approval counts:', { totalApproved, totalRejected, totalRequired, totalPending });

      // Find current user's approval if they have one
      const currentUserApproval = currentUserEmail
        ? typedApprovals.find(a => a.approver_email.toLowerCase() === currentUserEmail.toLowerCase()) || null
        : null;

      // Determine if user can approve:
      // 1. User is in project_approvers list, OR
      // 2. User is the mandante of the project
      const isInApproversList = currentUserEmail && approvers?.some(
        a => a.approver_email.toLowerCase() === currentUserEmail.toLowerCase()
      );
      const isApprover = isInApproversList || isMandanteOfProject;
      
      console.log('🔐 Approval check:', { currentUserEmail, isInApproversList, isMandanteOfProject, isApprover });
      const hasNotApprovedYet = !currentUserApproval || currentUserApproval.approval_status === 'Pendiente';
      
      // Check if order matters and if it's this user's turn
      let isUsersTurn = true;
      if (config?.approval_order_matters === true && approvers && approvers.length > 0 && currentUserEmail) {
        const normalizedUserEmail = currentUserEmail.toLowerCase().trim();
        const userApprover = approvers.find(
          a => a.approver_email.toLowerCase().trim() === normalizedUserEmail
        );
        if (userApprover) {
          // Check if all previous approvers (lower order) have approved
          const previousApprovers = approvers.filter(a => a.approval_order < userApprover.approval_order);
          const previousApproverEmails = previousApprovers.map(a => a.approver_email.toLowerCase().trim());
          const allPreviousApproved = previousApproverEmails.every(email =>
            typedApprovals.some(a => 
              a.approver_email.toLowerCase().trim() === email && a.approval_status === 'Aprobado'
            )
          );
          isUsersTurn = allPreviousApproved;
          console.log('🔄 Turn check:', { 
            userOrder: userApprover.approval_order, 
            previousCount: previousApprovers.length,
            previousEmails: previousApproverEmails,
            allPreviousApproved,
            isUsersTurn 
          });
        } else {
          // User is mandante but not in approvers list - always their turn
          console.log('🔄 User not in approvers list (mandante access) - allowing approval');
          isUsersTurn = true;
        }
      }
      
      const canUserApprove = !!(isApprover && hasNotApprovedYet && isUsersTurn);

      // Find pending approvers - exclude those who have already acted (approved OR rejected)
      const actedEmails = typedApprovals
        .filter(a => a.approval_status === 'Aprobado' || a.approval_status === 'Rechazado')
        .map(a => a.approver_email.toLowerCase());
      
      const pendingApprovers = (approvers || [])
        .filter(a => !actedEmails.includes(a.approver_email.toLowerCase()))
        .map(a => ({ email: a.approver_email, name: a.approver_name, order: a.approval_order }));

      setStatus({
        approvals: typedApprovals,
        totalRequired,
        totalApproved,
        totalRejected,
        totalPending: Math.max(0, totalPending),
        isFullyApproved: totalApproved >= totalRequired,
        hasRejection: totalRejected > 0,
        currentUserApproval,
        canUserApprove,
        pendingApprovers
      });
    } catch (err: any) {
      console.error('Error fetching approval status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalStatus();
  }, [paymentId, currentUserEmail, refreshKey]);

  const refetch = async () => {
    console.log('🔄 Manual refetch triggered');
    setRefreshKey(prev => prev + 1);
    await fetchApprovalStatus();
  };

  return {
    status,
    loading,
    error,
    refetch
  };
};
