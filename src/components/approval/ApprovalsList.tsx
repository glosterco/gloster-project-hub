import { CheckCircle2, Clock, XCircle, User } from 'lucide-react';
import { PaymentApproval } from '@/hooks/usePaymentApprovalStatus';

interface ApprovalsListProps {
  approvals: PaymentApproval[];
  pendingApprovers: { email: string; name: string | null; order: number }[];
}

export const ApprovalsList = ({ approvals, pendingApprovers }: ApprovalsListProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'Rechazado':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">Estado de aprobaciones</h4>
      
      <div className="space-y-2">
        {/* Completed approvals */}
        {approvals
          .filter(a => a.approval_status !== 'Pendiente')
          .map((approval) => (
            <div 
              key={approval.id} 
              className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(approval.approval_status)}
                <div>
                  <p className="text-sm font-medium">
                    {approval.approver_name || approval.approver_email}
                  </p>
                  {approval.approved_at && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(approval.approved_at)}
                    </p>
                  )}
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                approval.approval_status === 'Aprobado' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {approval.approval_status}
              </span>
            </div>
          ))}
        
        {/* Pending approvers */}
        {pendingApprovers.map((approver, idx) => (
          <div 
            key={`pending-${approver.email}-${idx}`}
            className="flex items-center justify-between p-2 bg-muted/30 rounded-md border border-dashed border-muted-foreground/20"
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {approver.name || approver.email}
                </p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
              Pendiente
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
