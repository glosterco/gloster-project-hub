
import React from 'react';
import EmailTemplate from '@/components/EmailTemplate';
import PaymentApprovalSection from '@/components/PaymentApprovalSection';
import { formatCurrency, getDocumentsFromPayment } from '@/utils/submissionPreviewUtils';

interface SubmissionContentProps {
  paymentId: string;
  payment: any;
  isMandante: boolean;
  onStatusChange: () => void;
  useDirectDownload?: boolean;
  driveFiles?: { [key: string]: string[] };
}

const SubmissionContent: React.FC<SubmissionContentProps> = ({
  paymentId,
  payment,
  isMandante,
  onStatusChange,
  useDirectDownload = false,
  driveFiles
}) => {
  // Extract data directly from payment object
  const paymentState = {
    month: `${payment.Mes} ${payment.Año}`,
    amount: payment.Total || 0,
    formattedAmount: payment?.projectData?.Budget === 0 || payment?.projectData?.Budget === null || payment?.projectData?.Budget === undefined ? 'Sin informar' : formatCurrency(payment.Total || 0, payment),
    dueDate: payment.ExpiryDate,
    projectName: payment.projectData?.Name || '',
    recipient: payment.projectData?.Owner?.ContactEmail || '',
    currency: payment.projectData?.Currency || 'CLP',
  };

  const project = {
    name: payment.projectData?.Name || '',
    client: payment.projectData?.Owner?.CompanyName || '',
    contractor: payment.projectData?.Contratista?.CompanyName || '',
    location: payment.projectData?.Location || '',
    projectManager: payment.projectData?.Contratista?.ContactName || '',
    contactEmail: payment.projectData?.Contratista?.ContactEmail || '',
    contractorRUT: payment.projectData?.Contratista?.RUT || '',
    contractorPhone: payment.projectData?.Contratista?.ContactPhone?.toString() || '',
    contractorAddress: ''
  };

  // Use actual backed up files instead of project requirements
  const documentsFromDrive = React.useMemo(() => {
    if (!driveFiles) return [];
    
    const contractorFiles: any[] = [];
    Object.entries(driveFiles).forEach(([docId, files]) => {
      if (docId !== 'mandante_docs' && files && files.length > 0) {
        files.forEach((fileName, index) => {
          contractorFiles.push({
            id: `${docId}_${index}`,
            name: fileName,
            description: 'Documento respaldado en Drive',
            uploaded: true
          });
        });
      }
    });
    
    return contractorFiles;
  }, [driveFiles]);
  
  const documents = documentsFromDrive.length > 0 ? documentsFromDrive : getDocumentsFromPayment(payment.projectData?.Requierment);

  console.log('🏗️ SubmissionContent rendering:', { 
    paymentId, 
    isMandante, 
    paymentStatus: payment?.Status,
    documentsCount: documents.length,
    documents: documents.map(d => d.name)
  });

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden email-template-container">
          <EmailTemplate 
            paymentId={paymentId}
            paymentState={paymentState}
            project={project}
            documents={documents}
            useDirectDownload={useDirectDownload}
            driveFiles={driveFiles}
          />
        </div>

        <PaymentApprovalSection
          paymentId={paymentId}
          payment={payment}
          paymentState={paymentState}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
};

export default SubmissionContent;
