
import React from 'react';
import EmailTemplate from '@/components/EmailTemplate';
import PaymentApprovalSection from '@/components/PaymentApprovalSection';

interface SubmissionContentProps {
  paymentId: string;
  emailTemplateData: {
    paymentState: {
      month: string;
      amount: number;
      formattedAmount: string;
      dueDate: string;
      projectName: string;
      recipient: string;
      currency: string;
    };
    project: {
      name: string;
      client: string;
      contractor: string;
      location: string;
      projectManager: string;
      contactEmail: string;
      contractorRUT: string;
      contractorPhone: string;
      contractorAddress: string;
    };
    documents: Array<{
      id: string;
      name: string;
      description: string;
      uploaded: boolean;
    }>;
  };
  isMandante: boolean;
  onStatusChange: () => void;
}

const SubmissionContent: React.FC<SubmissionContentProps> = ({
  paymentId,
  emailTemplateData,
  isMandante,
  onStatusChange
}) => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden email-template-container">
          <EmailTemplate 
            paymentId={paymentId}
            paymentState={emailTemplateData.paymentState}
            project={emailTemplateData.project}
            documents={emailTemplateData.documents}
          />
        </div>

        {isMandante && (
          <PaymentApprovalSection
            paymentId={paymentId}
            paymentState={emailTemplateData.paymentState}
            onStatusChange={onStatusChange}
          />
        )}
      </div>
    </div>
  );
};

export default SubmissionContent;
