
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useAccessVerification } from '@/hooks/useAccessVerification';
import SubmissionHeader from '@/components/submission/SubmissionHeader';
import SubmissionContent from '@/components/submission/SubmissionContent';
import PaymentApprovalSection from '@/components/PaymentApprovalSection';
import { formatCurrency } from '@/utils/currencyUtils';
import { documentsFromPayment } from '@/constants/documentTypes';

const SubmissionView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId') || '11';

  const { payment, loading, error, refetch } = usePaymentDetail(paymentId, true);
  const { toast } = useToast();
  const { hasAccess, checkingAccess, isMandante } = useAccessVerification(payment, paymentId);

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
    return (
      <div className="min-h-screen bg-slate-50 font-rubik flex items-center justify-center">
        <p className="text-gloster-gray">No tienes acceso a este estado de pago.</p>
      </div>
    );
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
              {error || 'Estado de pago no encontrado.'}
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

  // DEBUG logs para ayudar a diagnosticar
  console.log('🔍 SubmissionView - payment completo:', payment);
  console.log('🔍 SubmissionView - projectData:', payment.projectData);
  console.log('🔍 SubmissionView - Contratista:', payment.projectData?.Contratista);

  // Construir emailTemplateData con validación para evitar undefined
  const emailTemplateData = {
    paymentState: {
      month: `${payment.Mes || ''} ${payment.Año || ''}`,
      amount: payment.Total || 0,
      formattedAmount: formatCurrency(payment.Total || 0, payment.projectData?.Currency || 'CLP'),
      dueDate: payment.ExpiryDate || '',
      projectName: payment.projectData?.Name || '',
      recipient: payment.projectData?.Owner?.ContactEmail || '',
      currency: payment.projectData?.Currency || 'CLP',
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
      contractorAddress: payment.projectData?.Contratista?.Adress || '',
    },
    documents: documentsFromPayment,
  };

  // Más logs para verificar emailTemplateData
  console.log('📧 SubmissionView - emailTemplateData:', emailTemplateData);

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <SubmissionHeader />

      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          <SubmissionContent
            paymentId={paymentId}
            emailTemplateData={emailTemplateData}
            isMandante={isMandante}
            onStatusChange={handleStatusChange}
            useDirectDownload={true}
          />

          {/* SOLO mostrar PaymentApprovalSection para mandantes con estados pendientes */}
          {isMandante && payment.Status !== 'Aprobado' && payment.Status !== 'Rechazado' && (
            <PaymentApprovalSection
              paymentId={paymentId}
              paymentState={{
                month: `${payment.Mes || ''} ${payment.Año || ''}`,
                amount: payment.Total || 0,
                formattedAmount: formatCurrency(payment.Total || 0, payment.projectData?.Currency || 'CLP'),
                projectName: payment.projectData?.Name || '',
              }}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionView;
