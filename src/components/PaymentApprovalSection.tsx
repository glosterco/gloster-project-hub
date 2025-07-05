
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
  
  console.log('🏗️ PaymentApprovalSection rendering with paymentId:', paymentId);
  
  const { loading, handleApprove, handleReject } = usePaymentApproval({
    paymentId,
    onStatusChange
  });

  const onApprove = async () => {
    console.log('✅ PaymentApprovalSection onApprove clicked');
    try {
      await handleApprove();
    } catch (error) {
      console.error('❌ Error in onApprove:', error);
    }
  };

  const onReject = () => {
    console.log('❌ PaymentApprovalSection onReject clicked');
    setShowRejectionForm(true);
  };

  const onConfirmReject = async () => {
    console.log('❌ PaymentApprovalSection onConfirmReject clicked with reason:', rejectionReason);
    try {
      await handleReject(rejectionReason);
      setShowRejectionForm(false);
      setRejectionReason('');
    } catch (error) {
      console.error('❌ Error in onConfirmReject:', error);
    }
  };

  const onCancel = () => {
    console.log('🚫 PaymentApprovalSection onCancel clicked');
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
