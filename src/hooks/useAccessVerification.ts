
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
        
        // PRIMERA PRIORIDAD: Verificar acceso de mandante desde sessionStorage (más prioritario)
        const mandanteAccess = sessionStorage.getItem('mandanteAccess');
        
        if (mandanteAccess) {
          try {
            const accessData = JSON.parse(mandanteAccess);
            console.log('🔍 Found mandante access in sessionStorage:', { 
              storedPaymentId: accessData.paymentId, 
              requestedPaymentId: paymentId, 
              hasToken: !!accessData.token,
              email: accessData.email
            });
            
            if (accessData.paymentId === paymentId && accessData.token === 'mandante_authenticated') {
              console.log('✅ Mandante access granted from sessionStorage (priority over auth)');
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

        // VERIFICAR ACCESO DE CONTRATISTA REGISTRADO desde sessionStorage
        const contractorAccess = sessionStorage.getItem('contractorAccess');
        
        if (contractorAccess) {
          try {
            const accessData = JSON.parse(contractorAccess);
            console.log('🔍 Found contractor access in sessionStorage:', { 
              storedPaymentId: accessData.paymentId, 
              requestedPaymentId: paymentId, 
              hasToken: !!accessData.token,
              email: accessData.email,
              isRegistered: accessData.isRegistered
            });
            
            if (accessData.paymentId === paymentId && 
                (accessData.token === 'contratista_authenticated' || accessData.isRegistered)) {
              console.log('✅ Contractor access granted from sessionStorage');
              setHasAccess(true);
              setIsMandante(false);
              setAccessChecked(true);
              setCheckingAccess(false);
              return;
            }
          } catch (parseError) {
            console.error('Error parsing contractorAccess:', parseError);
          }
        }

        // SEGUNDA PRIORIDAD: Solo verificar autenticación si NO hay acceso de mandante en sessionStorage
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && payment?.projectData) {
          console.log('🔍 Checking authenticated user access for user:', user.email);
          
          const { data: contractorData } = await supabase
            .from('Contratistas')
            .select('*')
            .eq('auth_user_id', user.id)
            .maybeSingle();

          if (contractorData && payment.projectData.Contratista?.id === contractorData.id) {
            console.log('✅ Contractor access granted for user:', user.email);
            setHasAccess(true);
            setIsMandante(false);
            setAccessChecked(true);
            setCheckingAccess(false);
            return;
          }

          // Verificar si es un mandante autenticado - verificar cualquier mandante asociado al usuario
          const { data: mandanteData } = await supabase
            .from('Mandantes')
            .select('*')
            .eq('auth_user_id', user.id)
            .maybeSingle();

          if (mandanteData && payment.projectData.Owner?.id === mandanteData.id) {
            console.log('✅ Authenticated mandante access granted for user:', user.email);
            setHasAccess(true);
            setIsMandante(true);
            setAccessChecked(true);
            setCheckingAccess(false);
            return;
          }

          console.log('❌ Authenticated user has no access to this payment');
        }

        // Si llegamos aquí y tenemos acceso válido pero sin payment data aún, esperar
        if ((mandanteAccess || contractorAccess) && !payment) {
          console.log('⏳ Waiting for payment data to load for session access...');
          return; // No marcar como fallido aún, esperar que cargue el payment
        }

        // Si no hay payment data pero no hay mandanteAccess, fallar
        if (!payment) {
          console.log('⏳ Still waiting for payment data...');
          return;
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
