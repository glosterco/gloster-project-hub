
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUniqueAccessUrl = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getBaseUrl = () => {
    // Always use the correct Lovable staging domain
    return 'https://gloster-project-hub.lovable.app';
  };

  const ensureUniqueAccessUrl = async (paymentId: string | number) => {
    setLoading(true);
    
    try {
      // Convert paymentId to number to ensure type compatibility
      const numericPaymentId = typeof paymentId === 'string' ? parseInt(paymentId, 10) : paymentId;
      
      if (isNaN(numericPaymentId)) {
        throw new Error('ID de pago inválido');
      }

      console.log('🔍 Ensuring access URL for payment:', numericPaymentId);

      // Check if user is authenticated first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Authenticated user: try direct database access
        const { data: existingPayment, error: fetchError } = await supabase
          .from('Estados de pago')
          .select('URLMandante')
          .eq('id', numericPaymentId)
          .single();

        if (!fetchError && existingPayment?.URLMandante) {
          const currentBaseUrl = getBaseUrl();
          try {
            const existingUrl = new URL(existingPayment.URLMandante);
            const currentUrlObj = new URL(currentBaseUrl);
            
            // Si el dominio coincide con el correcto, reutilizar el enlace existente
            if (existingUrl.origin === currentUrlObj.origin) {
              console.log('✅ Reusing existing mandante access URL:', existingPayment.URLMandante);
              return existingPayment.URLMandante;
            }
          } catch (urlError) {
            console.warn('Invalid URL in database, will generate new one:', urlError);
          }
        }

        // Generate new URL for authenticated user
        console.log('🔄 Generating new unique access URL for authenticated user...');
        const uniqueToken = crypto.randomUUID();
        const baseUrl = getBaseUrl();
        const newAccessUrl = `${baseUrl}/email-access?paymentId=${numericPaymentId}&token=${uniqueToken}`;

        const { error: updateError } = await supabase
          .from('Estados de pago')
          .update({ URLMandante: newAccessUrl })
          .eq('id', numericPaymentId);

        if (updateError) {
          console.error('Error updating URLMandante:', updateError);
          throw new Error('Error al guardar el enlace único');
        }

        console.log('✅ New access URL generated and saved:', newAccessUrl);
        return newAccessUrl;
      } else {
        // Non-authenticated user: ALWAYS use edge function
        console.log('🔐 Non-authenticated user, using edge function...');
        
        const contractorAccess = sessionStorage.getItem('contractorAccess');
        const mandanteAccess = sessionStorage.getItem('mandanteAccess');
        const accessInfo = contractorAccess
          ? JSON.parse(contractorAccess)
          : (mandanteAccess ? JSON.parse(mandanteAccess) : null);
        const accessToken = accessInfo?.accessToken;

        if (!accessToken) {
          throw new Error('No se encontró token de acceso para generar el enlace');
        }

        const { data: fnData, error: fnError } = await supabase.functions.invoke('ensure-unique-access-url', {
          body: { paymentId: numericPaymentId, token: accessToken }
        });

        if (fnError) {
          console.error('❌ Edge function ensure-unique-access-url error:', fnError);
          throw new Error(`Error al verificar el enlace: ${fnError.message}`);
        }

        if (fnData?.accessUrl) {
          console.log('✅ Access URL ensured via edge function:', fnData.accessUrl);
          return fnData.accessUrl;
        } else {
          throw new Error('La función edge no devolvió un enlace válido');
        }
      }

    } catch (error) {
      console.error('Error in ensureUniqueAccessUrl:', error);
      toast({
        title: "Error",
        description: error.message || "Error al generar el enlace de acceso",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    ensureUniqueAccessUrl,
    loading
  };
};
