
import React, { useState } from 'react';
import { usePaymentApproval } from '@/hooks/usePaymentApproval';
import PaymentInfoHeader from '@/components/approval/PaymentInfoHeader';
import ApprovalButtons from '@/components/approval/ApprovalButtons';
import RejectionForm from '@/components/approval/RejectionForm';

interface PaymentApprovalSectionProps {
  paymentId: string;
  paymentState: {
    month: string;
    amount: number;
    formattedAmount?: string;
    projectName: string;
  };
  onStatusChange?: () => void;
}

const PaymentApprovalSection: React.FC<PaymentApprovalSectionProps> = ({
  paymentId,
  paymentState,
  onStatusChange
}) => {
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const { loading, handleApprove, handleReject } = usePaymentApproval({
    paymentId,
    onStatusChange
  });

  const onApprove = () => {
    handleApprove();
  };

  const onReject = () => {
    setShowRejectionForm(true);
  };

  const onConfirmReject = () => {
    handleReject(rejectionReason).then(() => {
      setShowRejectionForm(false);
      setRejectionReason('');
    });
  };

  const onCancel = () => {
    setShowRejectionForm(false);
    setRejectionReason('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <PaymentInfoHeader
        projectName={paymentState.projectName}
        month={paymentState.month}
        formattedAmount={paymentState.formattedAmount || ''}
      />

      {!showRejectionForm ? (
        <ApprovalButtons
          loading={loading}
          onApprove={onApprove}
          onReject={onReject}
        />
      ) : (
        <RejectionForm
          loading={loading}
          rejectionReason={rejectionReason}
          onReasonChange={setRejectionReason}
          onConfirmReject={onConfirmReject}
          onCancel={onCancel}
        />
      )}
    </div>
  );
};

export default PaymentApprovalSection;
