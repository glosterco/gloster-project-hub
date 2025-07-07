
import React from 'react';
import EmailTemplate from '@/components/EmailTemplate';
import { PaymentDetail } from '@/hooks/usePaymentDetail';
import { formatCurrency, getDocumentsFromPayment } from '@/utils/submissionPreviewUtils';

interface SubmissionPreviewContentProps {
  payment: PaymentDetail;
  paymentId: string;
}

const SubmissionPreviewContent: React.FC<SubmissionPreviewContentProps> = ({
  payment,
  paymentId
}) => {
  const documentsFromPayment = getDocumentsFromPayment(payment.projectData?.Requierment);

  const emailTemplateData = {
    paymentState: {
      month: `${payment.Mes} ${payment.Año}`,
      amount: payment.Total || 0,
      formattedAmount: formatCurrency(payment.Total || 0, payment),
      dueDate: payment.ExpiryDate,
      projectName: payment.projectData?.Name || '',
      recipient: payment.projectData?.Owner?.ContactEmail || '',
      currency: payment.projectData?.Currency || 'CLP'
    },
    project: {
      name: payment.projectData?.Name || '',
      client: payment.projectData?.Owner?.CompanyName || '',
      contractor: payment.projectData?.Contratista?.CompanyName || '',
      location: payment.projectData?.Location || '',
      projectManager: payment.projectData?.Contratista?.ContactName || '',
      contactEmail: payment.projectData?.Contratista?.ContactEmail || '',
      contractorRUT: payment.projectData?.Contratista?.RUT || '',
      contractorPhone: payment.projectData?.Contratista?.ContactPhone?.toString() || '',
      contractorAddress: payment.projectData?.Contratista?.Adress || ''
    },
    documents: documentsFromPayment
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden email-template-container">
        <EmailTemplate 
          paymentId={paymentId}
          paymentState={emailTemplateData.paymentState}
          project={emailTemplateData.project}
          documents={emailTemplateData.documents}
          hideActionButtons={true}
          useDirectDownload={true}
        />
      </div>
    </div>
  );
};

export default SubmissionPreviewContent;
