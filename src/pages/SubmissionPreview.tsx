
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useNavigationWarning } from '@/hooks/useNavigationWarning';
import { useSubmissionPreviewLogic } from '@/hooks/useSubmissionPreviewLogic';
import SubmissionPreviewHeader from '@/components/submission/SubmissionPreviewHeader';
import SubmissionPreviewContent from '@/components/submission/SubmissionPreviewContent';

const SubmissionPreview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId') || '11';
  const { payment, loading, error } = usePaymentDetail(paymentId, true);
  
  // Verificar tipo de acceso desde sessionStorage
  const [accessData, setAccessData] = useState<any>(null);
  const [isLimitedAccess, setIsLimitedAccess] = useState(false);

  useEffect(() => {
    const userAccess = sessionStorage.getItem('userAccess');
    if (userAccess) {
      const accessInfo = JSON.parse(userAccess);
      setAccessData(accessInfo);
      
      // Determinar si es acceso limitado
      if ((accessInfo.userType === 'contratista' && !accessInfo.isRegistered) ||
          (accessInfo.userType === 'mandante' && !accessInfo.isRegistered)) {
        setIsLimitedAccess(true);
      }
    }
  }, []);
  
  const {
    isProjectUser,
    isUploading,
    notificationSent,
    notificationLoading,
    handleSendEmail
  } = useSubmissionPreviewLogic(payment);

  // Hook para advertencia de navegación
  const { handleNavigation } = useNavigationWarning({
    shouldWarn: isProjectUser && !notificationSent,
    message: "¿Estás seguro de que quieres salir? La notificación no ha sido enviada al mandante."
  });

  const handleBackNavigation = () => {
    handleNavigation(() => {
      if (isLimitedAccess) {
        // Usuarios con acceso limitado solo pueden volver al payment detail
        navigate(`/payment-detail/${payment?.id}`);
      } else if (isProjectUser) {
        navigate(`/payment/${payment?.id}`);
      } else {
        navigate('/');
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Cargando vista previa...</div>
        </div>
      </div>
    );
  }

  if (!payment || !payment.projectData) {
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

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <SubmissionPreviewHeader
        isProjectUser={isProjectUser}
        onSendEmail={handleSendEmail}
        onBackNavigation={handleBackNavigation}
        isUploading={isUploading}
        notificationLoading={notificationLoading}
      />
      
      <SubmissionPreviewContent
        payment={payment}
        paymentId={paymentId}
      />
    </div>
  );
};

export default SubmissionPreview;
