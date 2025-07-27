
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
      if (!paymentId || accessChecked) {
        return;
      }
      
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
            
            if (accessData.paymentId === paymentId && 
                accessData.token === 'mandante_authenticated' &&
                accessData.timestamp && (Date.now() - new Date(accessData.timestamp).getTime() < 300000)) {
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

        // Verificar autenticación de contratista si tenemos datos del payment
        if (payment?.projectData) {
          setCheckingAccess(true);
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
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

            // Verificar si es un mandante autenticado
            const { data: mandanteData } = await supabase
              .from('Mandantes')
              .select('*')
              .eq('auth_user_id', user.id)
              .eq('id', payment.projectData.Owner?.id)
              .maybeSingle();

            if (mandanteData) {
              console.log('✅ Authenticated mandante access granted');
              setHasAccess(true);
              setIsMandante(true);
              setAccessChecked(true);
              setCheckingAccess(false);
              return;
            }
          }
        }

        // Si llegamos aquí y tenemos acceso de mandante válido pero sin payment data aún, esperar
        if (mandanteAccess && !payment) {
          console.log('⏳ Waiting for payment data to load...');
          return; // No marcar como fallido aún, esperar que cargue el payment
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

    // Ejecutar verificación si tenemos paymentId y no hemos verificado aún
    if (paymentId && !accessChecked) {
      checkAccess();
    }
  }, [payment, paymentId, accessChecked]);

  return {
    hasAccess,
    checkingAccess,
    isMandante,
    accessChecked
  };
};
