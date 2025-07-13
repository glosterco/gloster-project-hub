
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
        console.log('🔍 sessionStorage mandanteAccess:', mandanteAccess);
        
        if (mandanteAccess) {
          try {
            const accessData = JSON.parse(mandanteAccess);
            console.log('🔍 Parsed mandanteAccess data:', { 
              storedPaymentId: accessData.paymentId, 
              requestedPaymentId: paymentId, 
              hasToken: !!accessData.token 
            });
            
            if (accessData.paymentId === paymentId && accessData.token) {
              console.log('✅ Mandante access granted');
              setHasAccess(true);
              setIsMandante(true);
              setAccessChecked(true);
              setCheckingAccess(false);
              return;
            } else if (accessData.paymentId !== paymentId) {
              console.log('❌ Payment ID mismatch in sessionStorage');
            } else if (!accessData.token) {
              console.log('❌ No token in sessionStorage');
            }
          } catch (parseError) {
            console.error('Error parsing mandanteAccess:', parseError);
          }
        } else {
          console.log('❌ No mandanteAccess found in sessionStorage');
        }

        console.log('❌ Access denied - no mandante access found');
        setHasAccess(false);
        setAccessChecked(true);
        setCheckingAccess(false);
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
        setAccessChecked(true);
        setCheckingAccess(false);
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
