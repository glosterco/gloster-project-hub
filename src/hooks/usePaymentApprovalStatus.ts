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

  const fetchApprovalStatus = async () => {
    if (!paymentId) return;

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

      const typedApprovals = (approvals || []) as PaymentApproval[];

      const totalApproved = typedApprovals.filter(a => a.approval_status === 'Aprobado').length;
      const totalRejected = typedApprovals.filter(a => a.approval_status === 'Rechazado').length;
      const totalPending = totalRequired - totalApproved;

      // Find current user's approval if they have one
      const currentUserApproval = currentUserEmail
        ? typedApprovals.find(a => a.approver_email.toLowerCase() === currentUserEmail.toLowerCase()) || null
        : null;

      // Determine if user can approve
      const isApprover = currentUserEmail && approvers?.some(
        a => a.approver_email.toLowerCase() === currentUserEmail.toLowerCase()
      );
      const hasNotApprovedYet = !currentUserApproval || currentUserApproval.approval_status === 'Pendiente';
      const canUserApprove = !!(isApprover && hasNotApprovedYet);

      // Find pending approvers
      const approvedEmails = typedApprovals
        .filter(a => a.approval_status === 'Aprobado')
        .map(a => a.approver_email.toLowerCase());
      
      const pendingApprovers = (approvers || [])
        .filter(a => !approvedEmails.includes(a.approver_email.toLowerCase()))
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
  }, [paymentId, currentUserEmail]);

  return {
    status,
    loading,
    error,
    refetch: fetchApprovalStatus
  };
};
