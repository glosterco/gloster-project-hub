
import React, { useState } from 'react';
import { usePaymentApproval } from '@/hooks/usePaymentApproval';
import PaymentInfoHeader from '@/components/approval/PaymentInfoHeader';
import ApprovalButtons from '@/components/approval/ApprovalButtons';
import RejectionForm from '@/components/approval/RejectionForm';

interface PaymentApprovalSectionProps {
  paymentId: string;
  payment?: any; // Agregar payment data para pasarlo al hook
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
  payment,
  paymentState,
  onStatusChange
}) => {
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  console.log('🏗️ PaymentApprovalSection rendering with:', { paymentId, hasPaymentData: !!payment });
  
  const { loading, handleApprove, handleReject } = usePaymentApproval({
    paymentId,
    payment, // Pasar los datos del payment
    onStatusChange
  });

  // Verificar si el pago ya fue procesado
  const isProcessed = payment?.Status === 'Aprobado' || payment?.Status === 'Rechazado';
  const currentStatus = payment?.Status;
  const statusNotes = payment?.Notes;

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

      {isProcessed ? (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border-l-4 ${
            currentStatus === 'Aprobado' 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-center">
              <div className={`h-4 w-4 rounded-full mr-3 ${
                currentStatus === 'Aprobado' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <h3 className={`font-semibold ${
                currentStatus === 'Aprobado' ? 'text-green-800' : 'text-red-800'
              }`}>
                Estado de Pago {currentStatus}
              </h3>
            </div>
            {statusNotes && (
              <p className={`mt-2 text-sm ${
                currentStatus === 'Aprobado' ? 'text-green-700' : 'text-red-700'
              }`}>
                {statusNotes}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {currentStatus === 'Aprobado' 
              ? 'El estado de pago ha sido aprobado exitosamente.' 
              : 'El estado de pago ha sido rechazado. El contratista ha sido notificado para realizar las correcciones necesarias.'
            }
          </p>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default PaymentApprovalSection;
