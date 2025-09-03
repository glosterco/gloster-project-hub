import React from 'react';
import EmailTemplate from '@/components/EmailTemplate';
import { PaymentDetail } from '@/hooks/usePaymentDetail';
import { formatCurrency, getDocumentsFromPayment } from '@/utils/submissionPreviewUtils';

interface SubmissionPreviewContentProps {
  payment: PaymentDetail;
  paymentId: string;
  driveFiles?: { [key: string]: string[] };
}

const SubmissionPreviewContent: React.FC<SubmissionPreviewContentProps> = ({
  payment,
  paymentId,
  driveFiles
}) => {
  // Use only actual backed up files from Drive
  const documentsFromDrive = React.useMemo(() => {
    if (!driveFiles || Object.keys(driveFiles).length === 0) return [];
    
    const contractorFiles: any[] = [];
    Object.entries(driveFiles).forEach(([docId, files]) => {
      if (docId !== 'mandante_docs' && files && files.length > 0) {
        files.forEach((fileName, index) => {
          // Remove file extension from display name
          const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
          contractorFiles.push({
            id: `${docId}_${index}`,
            name: nameWithoutExtension,
            description: 'Documento respaldado en Drive',
            uploaded: true
          });
        });
      }
    });
    
    return contractorFiles;
  }, [driveFiles]);

  const emailTemplateData = {
    paymentState: {
      month: `${payment.Mes} ${payment.Año}`,
      amount: payment.Total || 0,
      formattedAmount: payment?.projectData?.Budget === 0 || payment?.projectData?.Budget === null || payment?.projectData?.Budget === undefined ? 'Sin informar' : formatCurrency(payment.Total || 0, payment),
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
      contractorAddress: ''
    },
    documents: documentsFromDrive
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
          driveFiles={driveFiles}
        />
      </div>
    </div>
  );
};

export default SubmissionPreviewContent;