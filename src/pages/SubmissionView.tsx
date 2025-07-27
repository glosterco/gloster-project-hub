
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useAccessVerification } from '@/hooks/useAccessVerification';
import SubmissionHeader from '@/components/submission/SubmissionHeader';
import SubmissionContent from '@/components/submission/SubmissionContent';

const SubmissionView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const paymentId = id || '';

  const { payment, loading, error, refetch } = usePaymentDetail(paymentId, true);
  const { toast } = useToast();
  
  // Solo verificar acceso después de que el payment se haya cargado o fallado
  const { hasAccess, checkingAccess, isMandante } = useAccessVerification(payment, paymentId);

  const handleStatusChange = () => {
    console.log('🔄 Status changed, refreshing payment data...');
    refetch();
  };

  // Mostrar loading mientras se verifica acceso O se cargan datos
  if (checkingAccess || loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>{checkingAccess ? 'Verificando acceso...' : 'Cargando datos del estado de pago...'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error de acceso solo si no está cargando
  if (!loading && !hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik flex items-center justify-center">
        <div className="text-center">
          <p className="text-gloster-gray mb-4">No tienes acceso a este estado de pago.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Volver al Inicio
          </Button>
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

  console.log('🔍 SubmissionView - payment completo:', payment);
  console.log('🔍 SubmissionView - projectData:', payment.projectData);
  console.log('🔍 SubmissionView - Contractor data completo:', {
    id: payment.projectData?.Contratista?.id,
    companyName: payment.projectData?.Contratista?.CompanyName,
    contactName: payment.projectData?.Contratista?.ContactName,
    contactEmail: payment.projectData?.Contratista?.ContactEmail,
    RUT: payment.projectData?.Contratista?.RUT,
    contactPhone: payment.projectData?.Contratista?.ContactPhone,
    
  });

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <SubmissionHeader projectId={payment?.projectData?.id?.toString()} />

      <SubmissionContent
        paymentId={paymentId}
        payment={payment}
        isMandante={isMandante}
        onStatusChange={handleStatusChange}
        useDirectDownload={true}
      />
    </div>
  );
};

export default SubmissionView;
