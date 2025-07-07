
import React from 'react';
import EmailTemplate from '@/components/EmailTemplate';
import PaymentApprovalSection from '@/components/PaymentApprovalSection';

interface SubmissionContentProps {
  paymentId: string;
  payment?: any; // Agregar payment data
  isMandante: boolean;
  onStatusChange: () => void;
  useDirectDownload?: boolean;
}

const SubmissionContent: React.FC<SubmissionContentProps> = ({
  paymentId,
  payment,
  isMandante,
  onStatusChange,
  useDirectDownload = false
}) => {
  const emailTemplateData = {
    paymentState: {
      month: `${payment?.Mes || ''} ${payment?.Año || ''}`,
      amount: payment?.Total || 0,
      formattedAmount: formatCurrency(payment?.Total || 0, payment),
      dueDate: payment?.ExpiryDate || '',
      projectName: payment?.projectData?.Name || '',
      recipient: payment?.projectData?.Owner?.ContactEmail || '',
      currency: payment?.projectData?.Currency || 'CLP',
    },
    project: {
      name: payment?.projectData?.Name || '',
      client: payment?.projectData?.Owner?.CompanyName || '',
      contractor: payment?.projectData?.Contratista?.CompanyName || '',
      location: payment?.projectData?.Location || '',
      projectManager: payment?.projectData?.Contratista?.ContactName || '',
      contactEmail: payment?.projectData?.Contratista?.ContactEmail || '',
      contractorRUT: payment?.projectData?.Contratista?.RUT || '',
      contractorPhone: payment?.projectData?.Contratista?.ContactPhone?.toString() || '',
      contractorAddress: payment?.projectData?.Contratista?.Adress || '',
    },
    documents: getDocumentsFromPayment(payment)
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden email-template-container">
          <EmailTemplate 
            paymentId={paymentId}
            paymentState={emailTemplateData.paymentState}
            project={emailTemplateData.project}
            documents={emailTemplateData.documents}
            useDirectDownload={useDirectDownload}
          />
        </div>

        {isMandante && (
          <PaymentApprovalSection
            paymentId={paymentId}
            payment={payment}
            paymentState={emailTemplateData.paymentState}
            onStatusChange={onStatusChange}
          />
        )}
      </div>
    </div>
  );
};

export default SubmissionContent;
