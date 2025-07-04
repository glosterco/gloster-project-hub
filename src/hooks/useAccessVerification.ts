
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PaymentDetail } from '@/hooks/usePaymentDetail';

export const useAccessVerification = (payment: PaymentDetail | null, paymentId: string) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isMandante, setIsMandante] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      if (!payment || accessChecked) return;
      
      try {
        setCheckingAccess(true);
        console.log('🔍 Checking access for payment:', paymentId);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && payment?.projectData) {
          // Verificar si es contratista autenticado
          const { data: contractorData } = await supabase
            .from('Contratistas')
            .select('*')
            .eq('auth_user_id', user.id)
            .maybeSingle();

          if (contractorData && payment.projectData.Contratista?.id === contractorData.id) {
            console.log('✅ Contractor access granted');
            setHasAccess(true);
            setIsMandante(false);
            setAccessChecked(true);
            setCheckingAccess(false);
            return;
          }
        }

        // Verificar acceso del mandante desde sessionStorage
        const mandanteAccess = sessionStorage.getItem('mandanteAccess');
        if (mandanteAccess) {
          try {
            const accessData = JSON.parse(mandanteAccess);
            if (accessData.paymentId === paymentId && accessData.token) {
              console.log('✅ Mandante access granted');
              setHasAccess(true);
              setIsMandante(true);
              setAccessChecked(true);
              setCheckingAccess(false);
              return;
            }
          } catch (parseError) {
            console.error('Error parsing mandanteAccess:', parseError);
          }
        }

        console.log('❌ Access denied, redirecting to email access');
        setAccessChecked(true);
        setCheckingAccess(false);
        navigate(`/email-access?paymentId=${paymentId}`);
      } catch (error) {
        console.error('Error checking access:', error);
        setAccessChecked(true);
        setCheckingAccess(false);
        navigate(`/email-access?paymentId=${paymentId}`);
      }
    };

    if (payment && !accessChecked) {
      checkAccess();
    }
  }, [payment, paymentId, navigate, accessChecked]);

  return {
    hasAccess,
    checkingAccess,
    isMandante,
    accessChecked
  };
};
