
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useDirectDownload } from '@/hooks/useDirectDownload';
import { useAccessVerification } from '@/hooks/useAccessVerification';
import { usePrintAndDownload } from '@/hooks/usePrintAndDownload';
import SubmissionHeader from '@/components/submission/SubmissionHeader';
import SubmissionContent from '@/components/submission/SubmissionContent';
import { formatCurrency } from '@/utils/currencyUtils';
import { documentsFromPayment } from '@/constants/documentTypes';

const SubmissionView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId') || '11';
  const { payment, loading, error, refetch } = usePaymentDetail(paymentId, true);
  const { downloadFilesDirect, loading: downloadLoading, downloadProgress } = useDirectDownload();
  const { toast } = useToast();
  const { hasAccess, checkingAccess, isMandante } = useAccessVerification(payment, paymentId);
  const { handlePrint, handleDownloadPDF } = usePrintAndDownload(payment);

  const handleDownloadFiles = async () => {
    if (!payment) {
      toast({
        title: "Error",
        description: "No se encontraron datos del estado de pago",
        variant: "destructive"
      });
      return;
    }

    console.log('🚀 Starting direct file download for payment:', paymentId);
    
    const result = await downloadFilesDirect(paymentId);
    
    if (result.success) {
      console.log(`✅ Successfully downloaded ${result.filesCount} files`);
    } else {
      console.error('❌ Failed to download files:', result.error);
    }
  };

  const handleStatusChange = () => {
    console.log('🔄 Status changed, refreshing payment data...');
    refetch();
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Verificando acceso...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Cargando datos del estado de pago...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !payment || !payment.projectData) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gloster-gray mb-4">
              {error || "Estado de pago no encontrado."}
            </p>
            <p className="text-sm text-gloster-gray mb-4">
              ID solicitado: {paymentId}
            </p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // DEBUG: Log contractor data to see what's actually coming from the database
  console.log('🔍 DEBUG - Contractor data from payment:', {
    contratista: payment.projectData.Contratista,
    rut: payment.projectData.Contratista?.RUT,
    phone: payment.projectData.Contratista?.ContactPhone,
    address: payment.projectData.Contratista?.Adress
  });

  // Construct emailTemplateData exactly like SubmissionPreview does
  const emailTemplateData = {
    paymentState: {
      month: `${payment.Mes} ${payment.Año}`,
      amount: payment.Total || 0,
      formattedAmount: formatCurrency(payment.Total || 0, payment.projectData.Currency),
      dueDate: payment.ExpiryDate,
      projectName: payment.projectData.Name,
      recipient: payment.projectData.Owner?.ContactEmail || '',
      currency: payment.projectData.Currency || 'CLP'
    },
    project: {
      name: payment.projectData.Name,
      client: payment.projectData.Owner?.CompanyName || '',
      contractor: payment.projectData.Contratista?.CompanyName || '',
      location: payment.projectData.Location || '',
      projectManager: payment.projectData.Contratista?.ContactName || '',
      contactEmail: payment.projectData.Contratista?.ContactEmail || '',
      // FIXED: Handle null/undefined/empty values properly for contractor fields
      contractorRUT: payment.projectData.Contratista?.RUT?.trim() || '',
      contractorPhone: payment.projectData.Contratista?.ContactPhone?.toString() || '',
      contractorAddress: payment.projectData.Contratista?.Adress?.trim() || ''
    },
    documents: documentsFromPayment
  };

  // DEBUG: Log final emailTemplateData to verify contractor info
  console.log('📧 DEBUG - Email template data:', {
    contractorRUT: emailTemplateData.project.contractorRUT,
    contractorPhone: emailTemplateData.project.contractorPhone,
    contractorAddress: emailTemplateData.project.contractorAddress
  });

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <SubmissionHeader
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
        onDownloadFiles={handleDownloadFiles}
        downloadLoading={downloadLoading}
        downloadProgress={downloadProgress}
      />

      <SubmissionContent
        paymentId={paymentId}
        emailTemplateData={emailTemplateData}
        isMandante={isMandante}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default SubmissionView;
