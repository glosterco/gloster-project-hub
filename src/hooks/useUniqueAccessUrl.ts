
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

      console.log('🔍 Checking existing access URL for payment:', numericPaymentId);

      // Verificar si ya existe un enlace para este pago
      const { data: existingPayment, error: fetchError } = await supabase
        .from('Estados de pago')
        .select('URLMandante')
        .eq('id', numericPaymentId)
        .single();

      if (fetchError) {
        console.warn('⚠️ RLS prevented direct fetch of URLMandante, trying public fallback via edge function:', fetchError);

        // Try public fallback using access token from sessionStorage
        try {
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
            throw new Error('Error al verificar el enlace existente');
          }

          if (fnData?.accessUrl) {
            console.log('✅ Access URL ensured via edge function:', fnData.accessUrl);
            return fnData.accessUrl;
          }
        } catch (fallbackErr) {
          console.error('❌ Public fallback failed:', fallbackErr);
          throw new Error('Error al verificar el enlace existente');
        }
      }

      // Si ya existe un enlace válido, verificar si el dominio es correcto
      if (existingPayment?.URLMandante) {
        const currentBaseUrl = getBaseUrl();
        const existingUrl = new URL(existingPayment.URLMandante);
        const currentUrlObj = new URL(currentBaseUrl);
        
        // Si el dominio coincide con el correcto, reutilizar el enlace existente
        if (existingUrl.origin === currentUrlObj.origin) {
          console.log('✅ Reusing existing mandante access URL:', existingPayment.URLMandante);
          return existingPayment.URLMandante;
        } else {
          console.log('🔄 Domain incorrect, generating new mandante URL...');
        }
      }

      console.log('🔄 Generating new unique access URL...');
      const uniqueToken = crypto.randomUUID();
      const baseUrl = getBaseUrl();
      const newAccessUrl = `${baseUrl}/email-access?paymentId=${numericPaymentId}&token=${uniqueToken}`;

      // Guardar el nuevo enlace en la base de datos
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
