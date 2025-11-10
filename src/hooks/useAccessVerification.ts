
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
              email: accessData.email,
              hasFullAccess: accessData.hasFullAccess
            });
            
              // STRICT VERIFICATION: Only allow access if paymentId matches AND user has valid authentication
              if (accessData.paymentId === paymentId && 
                  (accessData.token === 'mandante_authenticated' || accessData.token === 'cc_authenticated')) {
                
                // CRITICAL CHECK: Mandantes WITHOUT user_auth_id can ONLY access submission view
                if (accessData.isLimitedAccess || !accessData.hasFullAccess) {
                  const currentPath = window.location.pathname;
                  const allowedPath = `/submission/${paymentId}`;
                  
                  // Check if current path is NOT the allowed submission path
                  if (currentPath !== allowedPath) {
                    console.log('❌ LIMITED ACCESS mandante blocked - redirecting to submission view:', {
                      currentPath,
                      allowedPath,
                      email: accessData.email,
                      hasFullAccess: accessData.hasFullAccess,
                      isLimitedAccess: accessData.isLimitedAccess
                    });
                    
                    // Immediately redirect to submission view - no other pages allowed
                    window.location.href = allowedPath;
                    return;
                  }
                }
                
                // AUTHENTICATED MANDANTES: Can access mandante pages but NOT contractor pages
                if (accessData.hasFullAccess && accessData.userType === 'mandante') {
                  const currentPath = window.location.pathname;
                  
                  // CRITICAL: Block ALL contractor-only pages
                  const contractorOnlyPages = [
                    '/dashboard',           // Contractor dashboard
                    '/payment/',           // Payment detail pages
                    '/submission-preview', // Submission preview
                    '/project/'            // Project detail (contractor version)
                  ];
                  
                  const isContractorPage = contractorOnlyPages.some(page => 
                    currentPath === page || currentPath.startsWith(page)
                  );
                  
                  if (isContractorPage && !currentPath.startsWith('/project-mandante/')) {
                    console.log('❌ AUTHENTICATED mandante blocked from contractor page:', {
                      currentPath,
                      userType: accessData.userType,
                      hasFullAccess: accessData.hasFullAccess
                    });
                    setHasAccess(false);
                    setAccessChecked(true);
                    setCheckingAccess(false);
                    // Redirect to mandante dashboard
                    window.location.href = '/dashboard-mandante';
                    return;
                  }
                }
              
              console.log('✅ Mandante/CC access granted from sessionStorage');
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
              isRegistered: accessData.isRegistered,
              hasFullAccess: accessData.hasFullAccess
            });
            
            // CRÍTICO: Solo permitir acceso si el paymentId coincide exactamente
            if (accessData.paymentId === paymentId && 
                (accessData.token === 'contratista_authenticated' || accessData.token || accessData.isRegistered === false)) {
              
              // VERIFICACIÓN ADICIONAL: Si no tiene acceso completo (hasFullAccess), 
              // SOLO puede acceder a su paymentId específico, no a otras páginas
              if (!accessData.hasFullAccess && window.location.pathname !== `/payment/${paymentId}`) {
                console.log('❌ Limited access contractor trying to access wrong page');
                setHasAccess(false);
                setAccessChecked(true);
                setCheckingAccess(false);
                return;
              }
              
              // CRITICAL: Block contractor access to submission views
              if (window.location.pathname.startsWith('/submission/')) {
                console.log('❌ Contractor blocked from submission view - redirecting to payment');
                window.location.href = `/payment/${paymentId}`;
                return;
              }
              
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

          // Verificar si es un mandante autenticado (propietario directo)
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

          // Verificar si es un usuario asociado al mandante del proyecto
          if (payment.projectData.Owner?.id) {
            const { data: mandanteUserData } = await supabase
              .from('mandante_users')
              .select('*')
              .eq('mandante_id', payment.projectData.Owner.id)
              .eq('auth_user_id', user.id)
              .maybeSingle();

            if (mandanteUserData) {
              console.log('✅ Associated mandante user access granted for user:', user.email);
              setHasAccess(true);
              setIsMandante(true);
              setAccessChecked(true);
              setCheckingAccess(false);
              return;
            }
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
