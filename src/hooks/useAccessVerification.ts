
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
        console.log('🔍 Checking access for payment:', paymentId);
        
        // Verificar primero el acceso de mandante desde sessionStorage (más rápido)
        const mandanteAccess = sessionStorage.getItem('mandanteAccess');
        
        if (mandanteAccess) {
          try {
            const accessData = JSON.parse(mandanteAccess);
            console.log('🔍 Parsed mandanteAccess data:', { 
              storedPaymentId: accessData.paymentId, 
              requestedPaymentId: paymentId, 
              hasToken: !!accessData.token,
              isRecentAccess: accessData.timestamp && (Date.now() - accessData.timestamp < 300000) // 5 minutos
            });
            
            if (accessData.paymentId === paymentId && accessData.token) {
              console.log('✅ Mandante access granted from sessionStorage');
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

        // Si no hay acceso de mandante, verificar autenticación de contratista
        setCheckingAccess(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && payment?.projectData) {
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

        console.log('❌ Access denied - no valid access found');
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
